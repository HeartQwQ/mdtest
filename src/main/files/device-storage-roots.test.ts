import { describe, expect, it } from 'vitest'
import { getDeviceStorageRootCandidates } from './device-storage-roots'

describe('getDeviceStorageRootCandidates', () => {
  it('uses Android internal storage before falling back to the Linux root', () => {
    expect(getDeviceStorageRootCandidates('android')).toEqual(['/storage/emulated/0', '/sdcard', '/'])
  })
})
