import net from 'net'
import { ensureAdbServer } from './adb-path'

const ADB_HOST = '127.0.0.1'
const ADB_PORT = 5037
const RECONNECT_MS = 2000

/** adb 协议帧：4 位十六进制长度前缀 + ascii 命令。 */
function encode(command: string): string {
  return command.length.toString(16).padStart(4, '0') + command
}

export interface AdbTracker {
  stop: () => void
}

/**
 * 通过 adb server 的 `host:track-devices` 建立长连接。
 * 每当设备列表发生变化（插拔 / 授权 / 离线）服务端会主动推送一帧，
 * 此处仅把「收到帧」作为变化信号回调 onChange，由上层去取带详情的列表。
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
