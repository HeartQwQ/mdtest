/**
 * 文件目录缓存模块
 *
 * - 内存缓存：LRU 策略，同一时刻最多保留 N 条目
 * - 持久化存储：应用退出时写入 userData，启动时加载
 * - 智能刷新：对已缓存目录做快照比对，内容无变化则跳过
 * - 预热：设备连接成功后可立即异步加载根目录
 */

import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { log, logWarn } from '../log'
import type { FileEntry } from './types'

/* ------------------------------------------------------------------ */
/*  类型                                                               */
/* ------------------------------------------------------------------ */

export interface CachedDir {
  entries: FileEntry[]
  root?: string
  hint?: string
  /** 缓存写入时的毫秒时间戳 */
  ts: number
  /** 条目快照（用于智能刷新比对） */
  snapshot: string
}

export type CacheKey = string

/* ------------------------------------------------------------------ */
/*  常量                                                               */
/* ------------------------------------------------------------------ */

/** 内存缓存最大条目数 */
const MAX_MEMORY_ENTRIES = 256

/** 缓存有效期（毫秒），超过后视为"陈旧"但仍可瞬时展示 */
const STALE_MS = 5 * 60 * 1000 // 5 分钟

/** 持久化文件名 */
const PERSIST_FILENAME = 'dir-cache.json'

/* ------------------------------------------------------------------ */
/*  辅助                                                               */
/* ------------------------------------------------------------------ */

/** 生成条目快照，用于比较目录内容是否变化 */
function makeSnapshot(entries: FileEntry[]): string {
  // 只取 name + isDirectory + size 三项做快速比对
  return entries.map((e) => `${e.name}|${e.isDirectory ? 'd' : 'f'}|${e.size ?? 0}`).join('\n')
}

function persistPath(): string {
  return join(app.getPath('userData'), PERSIST_FILENAME)
}

/* ------------------------------------------------------------------ */
/*  DirCache 类                                                        */
/* ------------------------------------------------------------------ */

class DirCache {
  /** 内存缓存，key → CachedDir */
  private map = new Map<CacheKey, CachedDir>()
  /** LRU 访问顺序记录 */
  private order: CacheKey[] = []

  /* ---- 读取 ---- */

  /** 获取缓存（不存在返回 null） */
  get(key: CacheKey): CachedDir | null {
    const cached = this.map.get(key)
    if (!cached) return null
    // LRU：移到末尾
    this.touch(key)
    return cached
  }

  /** 获取缓存，若陈旧则标记需要后台刷新 */
  getWithFreshness(key: CacheKey): { cached: CachedDir; stale: boolean } | null {
    const cached = this.map.get(key)
    if (!cached) return null
    this.touch(key)
    const stale = Date.now() - cached.ts > STALE_MS
    return { cached, stale }
  }

  /** 判断两个条目列表是否相同（智能刷新） */
  isSameSnapshot(key: CacheKey, entries: FileEntry[]): boolean {
    const cached = this.map.get(key)
    if (!cached) return false
    return cached.snapshot === makeSnapshot(entries)
  }

  /* ---- 写入 ---- */

  set(key: CacheKey, data: { entries: FileEntry[]; root?: string; hint?: string }): void {
    const snapshot = makeSnapshot(data.entries)
    const existing = this.map.get(key)
    // 智能刷新：如果快照一致，仅更新时间戳
    if (existing && existing.snapshot === snapshot) {
      existing.ts = Date.now()
      this.touch(key)
      return
    }
    // 新增或内容变化
    this.map.set(key, {
      entries: data.entries,
      root: data.root,
      hint: data.hint,
      ts: Date.now(),
      snapshot
    })
    this.touch(key)
    // 淘汰最旧的
    while (this.map.size > MAX_MEMORY_ENTRIES) {
      const oldest = this.order.shift()
      if (oldest) this.map.delete(oldest)
    }
  }

  /** 使某个 key 失效（如删除/创建/重命名后） */
  invalidate(key: CacheKey): void {
    this.map.delete(key)
    this.order = this.order.filter((k) => k !== key)
  }

  /** 使所有以 prefix 开头的 key 失效 */
  invalidatePrefix(prefix: CacheKey): void {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) {
        this.map.delete(key)
      }
    }
    this.order = this.order.filter((k) => !k.startsWith(prefix))
  }

  /** 清除所有缓存 */
  clear(): void {
    this.map.clear()
    this.order = []
  }

  /* ---- 持久化 ---- */

  /** 从磁盘加载持久化缓存 */
  loadFromDisk(): void {
    const p = persistPath()
    if (!existsSync(p)) return
    try {
      const raw = readFileSync(p, 'utf8')
      const data = JSON.parse(raw) as Record<CacheKey, CachedDir>
      const now = Date.now()
      for (const [key, cached] of Object.entries(data)) {
        // 丢弃过期太久的（超过 1 天）
        if (now - cached.ts > 24 * 60 * 60 * 1000) continue
        this.map.set(key, cached)
        this.order.push(key)
      }
      log('dir_cache', `从磁盘加载 ${this.map.size} 条缓存`)
    } catch (e) {
      logWarn('dir_cache', `加载缓存失败: ${e}`)
    }
  }

  /** 将内存缓存持久化到磁盘 */
  saveToDisk(): void {
    try {
      const data: Record<CacheKey, CachedDir> = {}
      for (const [key, cached] of this.map) {
        data[key] = cached
      }
      writeFileSync(persistPath(), JSON.stringify(data), 'utf8')
      log('dir_cache', `持久化 ${this.map.size} 条缓存到磁盘`)
    } catch (e) {
      logWarn('dir_cache', `持久化缓存失败: ${e}`)
    }
  }

  /* ---- 内部 ---- */

  private touch(key: CacheKey): void {
    this.order = this.order.filter((k) => k !== key)
    this.order.push(key)
  }
}

/* ------------------------------------------------------------------ */
/*  单例导出                                                           */
/* ------------------------------------------------------------------ */

export const dirCache = new DirCache()

/**
 * 生成缓存 key
 * - local:   "local:<root>:<relativePath>"
 * - device:  "device:<platform>:<deviceId>:<relativePath>"
 * - mobile:  "mobile:<platform>:<deviceId>:<packageId>:<relativePath>"
 */
export function makeCacheKey(
  mode: 'local' | 'device' | 'mobile',
  opts: {
    root?: string
    platform?: string
    deviceId?: string
    packageId?: string
    relativePath?: string
  }
): CacheKey {
  const rel = opts.relativePath ?? ''
  switch (mode) {
    case 'local':
      return `local:${opts.root ?? ''}:${rel}`
    case 'device':
      return `device:${opts.platform ?? ''}:${opts.deviceId ?? ''}:${rel}`
    case 'mobile':
      return `mobile:${opts.platform ?? ''}:${opts.deviceId ?? ''}:${opts.packageId ?? ''}:${rel}`
  }
}
