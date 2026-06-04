import { shell } from 'electron'
import { spawn } from 'child_process'

export async function openFolderInExplorer(path: string): Promise<void> {
  const err = await shell.openPath(path)
  if (err) throw new Error(err)
}

export function launchExe(exePath: string): void {
  const child = spawn(exePath, [], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  })
  child.unref()
}
