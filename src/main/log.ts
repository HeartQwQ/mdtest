/** 主进程结构化日志，便于开发阶段过滤。 */
export function log(scope: string, message: string, ...args: unknown[]): void {
  console.log(`[${scope}] ${message}`, ...args)
}

export function logWarn(scope: string, message: string, ...args: unknown[]): void {
  console.warn(`[${scope}] ${message}`, ...args)
}

export function logError(scope: string, message: string, ...args: unknown[]): void {
  console.error(`[${scope}] ${message}`, ...args)
}
