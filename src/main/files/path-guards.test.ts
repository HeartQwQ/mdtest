import { describe, expect, it } from 'vitest'
import { assertAllowedRoot, normalizeRemoteRelativePath } from './path-guards'

describe('normalizeRemoteRelativePath', () => {
  it('keeps safe relative paths normalized for remote file operations', () => {
    expect(normalizeRemoteRelativePath('Logs/client.log', 'delete')).toBe('Logs/client.log')
    expect(normalizeRemoteRelativePath('Saved\\Config\\User.ini', 'read')).toBe(
      'Saved/Config/User.ini'
    )
  })

  it('rejects root-like remote paths before destructive operations', () => {
    expect(() => normalizeRemoteRelativePath('', 'delete')).toThrow('REMOTE_ROOT_FORBIDDEN')
    expect(() => normalizeRemoteRelativePath('.', 'delete')).toThrow('REMOTE_ROOT_FORBIDDEN')
    expect(() => normalizeRemoteRelativePath('/', 'delete')).toThrow('REMOTE_ROOT_FORBIDDEN')
  })

  it('rejects absolute or escaping remote paths', () => {
    expect(() => normalizeRemoteRelativePath('/sdcard/Android', 'delete')).toThrow(
      'REMOTE_PATH_MUST_BE_RELATIVE'
    )
    expect(() => normalizeRemoteRelativePath('../system', 'delete')).toThrow('REMOTE_PATH_ESCAPE')
    expect(() => normalizeRemoteRelativePath('Logs/../../system', 'delete')).toThrow(
      'REMOTE_PATH_ESCAPE'
    )
  })
})

describe('assertAllowedRoot', () => {
  it('allows an exact registered root', () => {
    expect(() =>
      assertAllowedRoot('D:\\Games\\ShadowTrackerExtra', ['D:\\Games\\ShadowTrackerExtra'])
    ).not.toThrow()
  })

  it('rejects unregistered local roots even when the target is internally relative', () => {
    expect(() =>
      assertAllowedRoot('D:\\Private', ['D:\\Games\\ShadowTrackerExtra'])
    ).toThrow('UNAUTHORIZED_LOCAL_ROOT')
  })
})
