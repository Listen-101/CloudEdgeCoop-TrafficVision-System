# API 对齐报告

## 后端 API 文档

文档位置：`D:\PROJECT\API接口文档.md`

## 文档中明确存在的接口

- `POST /api/device/register`
- `POST /api/device/heartbeat`
- `GET /api/device/{deviceId}`
- `GET /api/device/test`
- `POST /api/image/upload`
- WebSocket：`/ws/device?deviceId=xxx`

## 前端已对齐接口

- 设备注册：`POST /api/device/register`
- 设备心跳：`POST /api/device/heartbeat`
- 查询单个设备：`GET /api/device/{deviceId}`
- 设备连接测试：`GET /api/device/test`
- 图片上传：`POST /api/image/upload`，使用 `multipart/form-data`，字段为 `file`、`deviceId`、`timestamp`
- WebSocket 连接：`/ws/device?deviceId=xxx`
- WebSocket 消息类型：优先兼容文档中的 `status`、`recognition`，同时保留旧类型 `DEVICE_STATUS`、`RECOGNITION_RESULT` 兼容处理

## 已停用主动调用的非文档接口

以下接口当前后端 API 文档未提供，前端不在 API Mode 下主动请求：

- `/api/device/list`
- `/api/statistics/summary`
- `/api/recognition/results`
- `/api/recognition/alerts`
- `/api/image/frames/latest`
- `/api/recognition/device`
- `/api/device/status`
- `/api/image/upload/base64`

## 当前继续使用 Mock/fallback 的 UI 数据

- 设备列表
- 告警列表
- 识别结果
- 统计汇总
- 监控中心展示数据
- 数据看板展示数据

## 建议后端后续补充接口

- `GET /api/device/list`
- `GET /api/recognition/results`
- `GET /api/recognition/alerts`
- `GET /api/statistics/summary`
- `GET /api/image/frames/latest`