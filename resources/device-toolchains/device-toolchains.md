# 内置设备工具链

> 本文档说明 `resources/device-toolchains/` 中的运行时二进制，并随工具链目录一起维护。

三端 CLI 统一放在 `device-toolchains/`，随仓库提交，克隆即可使用，无需额外下载脚本。

```
resources/
└── device-toolchains/
    ├── android/          # Google platform-tools（adb 等）
    │   └── adb.exe
    ├── harmony/          # DevEco hdc toolchains
    │   └── hdc.exe
    ├── ios/              # libimobiledevice Windows 套件
    │   ├── idevice_id.exe
    │   ├── ideviceinfo.exe
    │   └── …
    └── device-toolchains.md
```

## 路径约定

| 平台 | 目录 | 主程序 |
|------|------|--------|
| 安卓 | `device-toolchains/android/` | `adb.exe` |
| 鸿蒙 | `device-toolchains/harmony/` | `hdc.exe` |
| iOS | `device-toolchains/ios/` | `idevice_id.exe` |

代码通过 `deviceToolchainDir('android' | 'harmony' | 'ios')` 解析路径（见 `src/main/devices/resources-path.ts`）。

## Android 文件路径口径

Android 文件管理默认入口是用户内部存储根，不是 Linux 系统根目录 `/`。

当前路径解析顺序：

1. `/storage/emulated/0`
2. `/sdcard`
3. `/`

其中 `/storage/emulated/0` 应与 Windows 资源管理器 MTP 视图里的“设备 / 内部存储”内容一致。测试同学日常理解路径时应以“设备名 / 内部存储 / 子目录”表达；ADB 只是底层执行通道，UI 不应把 `/storage/emulated/0` 或 `/` 暴露为主要心智模型。

和平精英常用路径以 `/storage/emulated/0` 为基准，例如：

```text
/storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd
```

## 来源与许可

| 工具 | 来源 | 许可 |
|------|------|------|
| adb | [Android SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) | Apache 2.0 |
| hdc | Huawei DevEco Studio SDK toolchains | 见目录内 `NOTICE.txt` |
| libimobiledevice | [libimobiledevice-windows](https://github.com/jrjr/libimobiledevice-windows) | 见各发行包说明 |

iOS 设备接入另需本机安装 **Apple Mobile Device Support**（iTunes 组件），与工具链二进制无关。

## 更新工具链

直接替换对应子目录内的文件并提交即可。鸿蒙工具链可从 DevEco 安装目录复制 `toolchains/` 内容到 `harmony/`。
