import type { Component } from 'svelte'
import {
  AudioWaveform,
  Command,
  FolderOpen,
  GalleryVerticalEnd,
  House,
  MonitorSmartphone,
  Settings
} from '@lucide/svelte'
import type { ViewId } from '$lib/stores/view.svelte'

export interface NavItem {
  id: ViewId
  title: string
  desc: string
  icon: Component
}

export interface Team {
  name: string
  plan: string
  logo: Component
}

export interface UserInfo {
  name: string
  email: string
}

/** 主导航项（与视图路由一一对应）。 */
export const navMain: NavItem[] = [
  { id: 'home', title: '主页', desc: '功能总览与快速入口', icon: House },
  { id: 'devices', title: '设备管理', desc: '四端设备接入与投屏控制', icon: MonitorSmartphone },
  { id: 'svar-files', title: 'SVAR 文件管理', desc: '原生文件管理实验页', icon: FolderOpen },
  { id: 'settings', title: '设置', desc: '应用内各项配置', icon: Settings }
]

/** 顶部功能区（占位，复刻 tauri team-switcher 视觉）。 */
export const teams: Team[] = [
  { name: '和平精英', plan: 'Game For Peace', logo: GalleryVerticalEnd },
  { name: 'UE5', plan: 'Game For Peace', logo: AudioWaveform },
  { name: '潘多拉', plan: 'Game For Peace', logo: Command }
]

/** 底部功能区（占位，复刻 tauri nav-user 视觉）。 */
export const userInfo: UserInfo = {
  name: 'v-yuxilong(龙昱樨)',
  email: 'v-yuxilong@tencent.com'
}
