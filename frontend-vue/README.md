# 云边端协同智慧交通视觉感知系统前端

## 项目简介

本项目是“云边端协同智慧交通视觉感知系统”的前端控制台，用于展示交通视觉感知场景中的设备状态、实时识别、告警事件、统计指标和数据看板。前端支持 Mock Mode / API Mode 双模式：默认使用 Mock Mode，便于在后端未启动或接口未完整提供时进行独立展示与验收；API Mode 用于联调后端文档中已明确提供的接口。

## 技术栈

- Vue 3
- Vite
- JavaScript
- CSS

## 目录结构

```text
frontend-vue/
├─ public/                 # 静态资源
├─ src/
│  ├─ api/                 # 后端 API 与 WebSocket 封装
│  ├─ store/               # 全局状态、Mock/API 双模式逻辑
│  ├─ utils/               # 常量、后端地址、Mock 数据配置
│  ├─ App.vue              # 主页面入口
│  ├─ main.js              # Vue 应用入口
│  └─ style.css            # 全局样式
├─ README.md               # 项目说明
├─ FRONTEND_TEST_CHECKLIST.md
├─ API_ALIGNMENT_REPORT.md
├─ FRONTEND_DEPLOYMENT_NOTES.md
├─ package.json
└─ vite.config.js
```

## 安装依赖

```bash
npm install
```

## 本地运行

```bash
npm run dev
```

## 打包

```bash
npm run build
```

## 生产预览

```bash
npm run preview
```

## 当前已实现页面

- 总览
- 监控中心
- 告警中心
- 数据看板
- 设备管理

## Mock Mode / API Mode

前端通过 `API_ENABLED` 控制运行模式。

- Mock Mode：`API_ENABLED = false`，默认模式。页面使用本地 Mock/fallback 数据，不请求后端，不连接 WebSocket。
- API Mode：`API_ENABLED = true`，用于后端联调。只主动调用后端 API 文档中明确提供的接口。

配置位置：

- API 开关：`src/utils/constants.js`
- HTTP 后端地址：`src/utils/constants.js` 中的 `API_BASE_URL`
- WebSocket 后端地址：`src/utils/constants.js` 中的 `WS_BASE_URL`

默认配置保持：

```js
export const API_ENABLED = false
```

## API 对齐情况

前端已按 `D:\PROJECT\API接口文档.md` 对齐以下接口：

- `POST /api/device/register`
- `POST /api/device/heartbeat`
- `GET /api/device/{deviceId}`
- `GET /api/device/test`
- `POST /api/image/upload`，使用 `multipart/form-data`
- WebSocket：`/ws/device?deviceId=xxx`
- WebSocket 消息类型：`status`、`recognition`

文档未提供的查询类接口不会在当前 API Mode 下主动请求。

## 当前使用 Mock/fallback 的数据

后端 API 文档暂未提供以下查询接口，因此前端继续使用 Mock/fallback 数据保障页面完整展示：

- 设备列表
- 告警列表
- 识别结果
- 统计汇总

## 注意事项

- 默认不要开启 `API_ENABLED`。
- 后端未启动或接口未完整提供时，请使用 Mock Mode。
- 上传 GitHub 前不要提交 `.claude/` 和 `output/`。
- 不要提交临时备份文件或构建错误日志。