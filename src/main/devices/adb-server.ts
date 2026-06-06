import net from 'net'
import { ensureAdbServer } from './adb-path'

const ADB_HOST = '127.0.0.1'
const ADB_PORT = 5037
const RECONNECT_MS = 2000

/** adb 协议帧：4 位十六进制长度前缀 + ascii 命令。 */
function encode(command: string): string {
  return command.length.toString(16).padStart(4, '0') + command
}

/**
 * 解析 adb server 响应帧：status(4) + length(4) + payload(length)。
 * 返回 payload 文本；若 status 非 OKAY 则抛错。
 */
function parseAdbResponse(raw: Buffer): string {
  if (raw.length < 4) throw new Error('adb server 响应过短')
  const status = raw.subarray(0, 4).toString('ascii')
  if (status !== 'OKAY') {
    const failMsg = raw.subarray(4).toString('utf8').trim()
    throw new Error(`adb server 返回 ${status}: ${failMsg}`)
  }
  if (raw.length < 8) throw new Error('adb server 响应缺少长度字段')
  const payloadLen = parseInt(raw.subarray(4, 8).toString('ascii'), 16)
  if (Number.isNaN(payloadLen)) throw new Error('adb server 响应长度字段无效')
  if (raw.length < 8 + payloadLen) throw new Error('adb server 响应 payload 不完整')
  return raw.subarray(8, 8 + payloadLen).toString('utf8')
}

/**
 * 通过 TCP 直连 adb server 执行一次性查询命令（如 host:devices-l）。
 * 绕过 adb.exe 子进程在 Windows + Node.js 下 stdout 为空的问题。
 */
export async function queryAdbServer(command: string): Promise<string> {
  await ensureAdbServer()

  return new Promise<string>((resolve, reject) => {
    const sock = net.createConnection({ host: ADB_HOST, port: ADB_PORT })
    let acc = Buffer.alloc(0)
    let settled = false

    const timer = setTimeout(() => {
      settled = true
      sock.destroy()
      reject(new Error(`adb server 查询超时: ${command}`))
    }, 10000)

    sock.on('connect', () => {
      sock.write(encode(command))
    })

    sock.on('data', (chunk: Buffer) => {
      acc = Buffer.concat([acc, chunk])
      // 尝试解析：如果 payload 已经完整则立即返回
      try {
        const result = parseAdbResponse(acc)
        if (!settled) {
          settled = true
          clearTimeout(timer)
          sock.destroy()
          resolve(result)
        }
      } catch {
        // payload 尚未完整，继续等待
      }
    })

    sock.on('error', (err) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(err)
      }
    })

    sock.on('close', () => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        // 最后尝试一次解析
        try {
          resolve(parseAdbResponse(acc))
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      }
    })
  })
}

export interface AdbTracker {
  stop: () => void
}

/**
 * 通过 adb server 的 `host:track-devices` 建立长连接。
 * 每当设备列表发生变化（插拔 / 授权 / 离线）服务端会主动推送一帧，
 * 触发 onChange 后由上层调用 listDevices 取带详情的列表（事件驱动，非轮询）。
 * 断线自动重连。
 */
export function createAdbTracker(onChange: () => void): AdbTracker {
  let socket: net.Socket | null = null
  let stopped = false
  let reconnectTimer: NodeJS.Timeout | null = null

  function scheduleReconnect(): void {
    if (stopped || reconnectTimer) return
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null
      await ensureAdbServer()
      connect()
    }, RECONNECT_MS)
  }

  function connect(): void {
    if (stopped) return

    const sock = net.createConnection({ host: ADB_HOST, port: ADB_PORT })
    socket = sock

    let phase: 'status' | 'length' | 'payload' = 'status'
    let payloadLen = 0
    let acc = Buffer.alloc(0)

    sock.on('connect', () => {
      sock.write(encode('host:track-devices'))
    })

    sock.on('data', (chunk: Buffer) => {
      acc = Buffer.concat([acc, chunk])

      // 状态机：解析连续的长度前缀帧，每完成一帧触发一次变化信号。
      for (;;) {
        if (phase === 'status') {
          if (acc.length < 4) break
          const status = acc.subarray(0, 4).toString('ascii')
          acc = acc.subarray(4)
          if (status !== 'OKAY') {
            sock.destroy()
            break
          }
          phase = 'length'
        } else if (phase === 'length') {
          if (acc.length < 4) break
          payloadLen = parseInt(acc.subarray(0, 4).toString('ascii'), 16)
          acc = acc.subarray(4)
          if (Number.isNaN(payloadLen)) {
            sock.destroy()
            break
          }
          phase = 'payload'
        } else {
          if (acc.length < payloadLen) break
          acc = acc.subarray(payloadLen)
          phase = 'length'
          onChange()
        }
      }
    })

    sock.on('error', scheduleReconnect)
    sock.on('close', scheduleReconnect)
  }

  void ensureAdbServer().then(connect)

  return {
    stop(): void {
      stopped = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      socket?.destroy()
      socket = null
    }
  }
}
