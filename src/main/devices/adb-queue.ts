/** 全局串行队列：避免 track-devices 长连接与 adb CLI 并发导致 Windows 上偶发空输出。 */
let chain: Promise<unknown> = Promise.resolve()

export function withAdbLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn)
  chain = run.then(
    () => undefined,
    () => undefined
  )
  return run
}
