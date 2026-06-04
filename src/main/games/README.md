# 游戏包管理

与 `devices/` 分离：设备怎么连；这里管**测哪些包/目录**。

## 手机端

1. 连接设备后，**自动读取**已安装包（安卓 `pm list packages -3`；鸿蒙优先 `pm list`，失败则列举 `database` 目录）
2. 用户点 **收藏**，写入 `userData/games-store.json` 的 `mobileFavorites`
3. 收藏按 **包名** 保存，换设备仍可用同一包名做后续装包/文件操作

## PC 端

1. **自选目录**：系统文件夹选择器加入列表
2. **名称搜索**：按配置的目录名（默认 `ShadowTrackerExtra`）在各盘符有限深度搜索
3. 搜索结果可 **加入列表**，与自选目录统一在 `pcPaths` 管理

## 数据文件

`%APPDATA%/mdtest/games-store.json`（Electron `userData`）

```json
{
  "mobileFavorites": [],
  "pcPaths": [],
  "pcSearch": { "dirNames": ["ShadowTrackerExtra"], "maxDepth": 3 }
}
```
