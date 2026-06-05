# 内置工具目录

路径固定，应用只认以下位置：

```
resources/
├── platform-tools/
│   └── adb.exe          # 及同目录 dll 等
├── hdc-toolchains/
│   └── toolchains/
│       └── hdc.exe      # 及同目录 lib、modulecheck 等
└── libimobiledevice/
    ├── idevice_id.exe
    ├── ideviceinfo.exe
    └── …                # 同目录 dll 等
```

- 安卓：`pnpm run setup:platform-tools` 下载到 `platform-tools/`
- 鸿蒙：从 DevEco 复制 `toolchains` 到 `hdc-toolchains/toolchains/`，或 `pnpm run setup:hdc`
- iOS：`pnpm run setup:libimobiledevice` 下载到 `libimobiledevice/`（Windows 另需 Apple Mobile Device Support）
