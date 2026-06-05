import { join } from 'path'
import { app } from 'electron'

export type DeviceToolchainPlatform = 'android' | 'harmony' | 'ios'

const DEVICE_TOOLCHAINS = 'device-toolchains'

/** 内置 resources 子目录（开发：项目 resources/；打包：安装目录 resources/）。 */
export function resourcesSubdir(name: string): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, name)
  }
  return join(app.getAppPath(), 'resources', name)
}

/** 三端 CLI 工具链目录：resources/device-toolchains/{android|harmony|ios}/ */
export function deviceToolchainDir(platform: DeviceToolchainPlatform): string {
  return join(resourcesSubdir(DEVICE_TOOLCHAINS), platform)
}
