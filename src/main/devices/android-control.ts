import { runAdb, runAdbBuffer } from './adb-path'

export interface AndroidScreenSize {
  width: number
  height: number
}

export interface AndroidScreenshot {
  mime: 'image/png'
  data: string
  width?: number
  height?: number
}

export interface AndroidSwipeOptions {
  x1: number
  y1: number
  x2: number
  y2: number
  durationMs?: number
}

function assertDeviceId(deviceId: string): void {
  if (!deviceId.trim()) throw new Error('缺少 Android deviceId')
}

function intArg(value: number, name: string): string {
  if (!Number.isFinite(value)) throw new Error(`${name} 不是有效数字`)
  return String(Math.round(value))
}

function parseScreenSize(out: string): AndroidScreenSize | null {
  const match = out.match(/(?:Physical|Override) size:\s*(\d+)x(\d+)/i)
  if (!match) return null
  return {
    width: Number(match[1]),
    height: Number(match[2])
  }
}

async function adbShell(deviceId: string, args: string[]): Promise<string> {
  assertDeviceId(deviceId)
  return runAdb(['-s', deviceId, 'shell', ...args])
}

export async function getAndroidScreenSize(deviceId: string): Promise<AndroidScreenSize> {
  const out = await adbShell(deviceId, ['wm', 'size'])
  const size = parseScreenSize(out)
  if (!size) throw new Error(`无法解析屏幕尺寸: ${out.trim()}`)
  return size
}

export async function captureAndroidScreen(deviceId: string): Promise<AndroidScreenshot> {
  assertDeviceId(deviceId)
  const [png, size] = await Promise.all([
    runAdbBuffer(['-s', deviceId, 'exec-out', 'screencap', '-p']),
    getAndroidScreenSize(deviceId).catch(() => null)
  ])

  if (png.length === 0) throw new Error('截图结果为空')

  return {
    mime: 'image/png',
    data: png.toString('base64'),
    width: size?.width,
    height: size?.height
  }
}

export async function tapAndroid(deviceId: string, x: number, y: number): Promise<void> {
  await adbShell(deviceId, ['input', 'tap', intArg(x, 'x'), intArg(y, 'y')])
}

export async function swipeAndroid(
  deviceId: string,
  opts: AndroidSwipeOptions
): Promise<void> {
  await adbShell(deviceId, [
    'input',
    'swipe',
    intArg(opts.x1, 'x1'),
    intArg(opts.y1, 'y1'),
    intArg(opts.x2, 'x2'),
    intArg(opts.y2, 'y2'),
    intArg(opts.durationMs ?? 300, 'durationMs')
  ])
}

export async function keyeventAndroid(deviceId: string, keyCode: number | string): Promise<void> {
  const code = typeof keyCode === 'number' ? intArg(keyCode, 'keyCode') : keyCode.trim()
  if (!code) throw new Error('缺少 keyCode')
  await adbShell(deviceId, ['input', 'keyevent', code])
}

export async function inputTextAndroid(deviceId: string, text: string): Promise<void> {
  const normalized = text.replace(/\s/g, '%s')
  await adbShell(deviceId, ['input', 'text', normalized])
}
