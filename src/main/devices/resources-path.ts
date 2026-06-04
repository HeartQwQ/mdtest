import { join } from 'path'
import { app } from 'electron'

/** 内置 resources 子目录（开发：项目 resources/；打包：安装目录 resources/）。 */
export function resourcesSubdir(name: string): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, name)
  }
  return join(app.getAppPath(), 'resources', name)
}
