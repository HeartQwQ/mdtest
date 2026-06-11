import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: () => 'C:\\tmp\\mdtest-vitest',
    isPackaged: false
  }
}))

vi.mock('../devices/adb-path', () => ({
  runAdb: vi.fn()
}))

vi.mock('../devices/hdc-path', () => ({
  runHdc: vi.fn()
}))

let parseLsLineForTest: typeof import('./remote-fs').parseLsLineForTest

beforeAll(async () => {
  ;({ parseLsLineForTest } = await import('./remote-fs'))
})

describe('parseLsLineForTest', () => {
  it('parses modified time from ls -la output with a clock', () => {
    expect(
      parseLsLineForTest(
        '-rw-rw---- 1 u0_a123 u0_a123 1536 Jan 02 12:34 client.log',
        '/storage/emulated/0',
        'Android/data'
      )
    ).toMatchObject({
      name: 'client.log',
      path: 'Android/data/client.log',
      isDirectory: false,
      size: 1536,
      modifiedAt: expect.stringMatching(/^2026-01-02T12:34:00/)
    })
  })

  it('parses modified date from ls -la output with a year', () => {
    expect(
      parseLsLineForTest(
        'drwxrwx--- 2 u0_a123 u0_a123 4096 Dec 31 2025 Saved',
        '/storage/emulated/0',
        ''
      )
    ).toMatchObject({
      name: 'Saved',
      path: 'Saved',
      isDirectory: true,
      size: 4096,
      modifiedAt: expect.stringMatching(/^2025-12-31T00:00:00/)
    })
  })
})
