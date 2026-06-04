import { execFile } from 'child_process'
import { promisify } from 'util'
import type { DeviceAdapter, DeviceInfo } from './types'

const execFileAsync = promisify(execFile)

interface PsProcess {
  Id: number
  ProcessName: string
  MainWindowTitle: string
}

/**
 * Windows 端接入（第一版）：通过 PowerShell 列出带主窗口的进程，
 * 作为「可被测试的 Win 端目标窗口」。不依赖原生模块，免 MSVC 编译。
 * 后续可替换为 Win32 EnumWindows 原生实现以获得句柄/类名/位置等完整信息。
 */
export const windowsAdapter: DeviceAdapter = {
  platform: 'windows',

  async isAvailable(): Promise<boolean> {
    return process.platform === 'win32'
  },

  async listDevices(): Promise<DeviceInfo[]> {
    if (process.platform !== 'win32') return []

    const script =
      "Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | " +
      'Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json -Compress'

    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { timeout: 10000, maxBuffer: 4 * 1024 * 1024 }
    )

    let parsed: PsProcess[] = []
    try {
      const json = JSON.parse(stdout || '[]')
      parsed = Array.isArray(json) ? json : [json]
    } catch {
      parsed = []
    }

    return parsed.map((p) => ({
      id: String(p.Id),
      platform: 'windows' as const,
      name: p.MainWindowTitle || p.ProcessName,
      status: 'online' as const,
      details: {
        pid: String(p.Id),
        processName: p.ProcessName
      }
    }))
  }
}
