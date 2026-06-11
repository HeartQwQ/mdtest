import { isAbsolute, resolve } from 'path'

interface RemotePathOptions {
  allowRoot?: boolean
}

function samePath(left: string, right: string): boolean {
  const a = resolve(left)
  const b = resolve(right)
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

export function assertAllowedRoot(root: string, allowedRoots: string[]): void {
  if (typeof root !== 'string' || !root.trim()) throw new Error('UNAUTHORIZED_LOCAL_ROOT')
  const allowed = allowedRoots.filter((item): item is string => Boolean(item?.trim()))
  if (!allowed.some((allowedRoot) => samePath(root, allowedRoot))) {
    throw new Error('UNAUTHORIZED_LOCAL_ROOT')
  }
}

export function normalizeRemoteRelativePath(
  relativePath: string,
  action: string,
  options: RemotePathOptions = {}
): string {
  if (typeof relativePath !== 'string') throw new Error('REMOTE_PATH_MUST_BE_RELATIVE')
  const raw = relativePath.trim().replace(/\\/g, '/')
  const isRootLike = !raw || raw === '.' || /^\/+$/.test(raw)

  if (isRootLike) {
    if (options.allowRoot) return ''
    throw new Error(`REMOTE_ROOT_FORBIDDEN: cannot ${action} remote root`)
  }

  if (raw.startsWith('/') || /^[a-zA-Z]:\//.test(raw) || isAbsolute(raw)) {
    throw new Error('REMOTE_PATH_MUST_BE_RELATIVE')
  }

  const segments = raw.split('/').filter((segment) => segment && segment !== '.')
  if (segments.some((segment) => segment === '..')) {
    throw new Error('REMOTE_PATH_ESCAPE')
  }

  return segments.join('/')
}
