# 前端交付说明

## 交付范围

本前端项目已完成 UI 展示、Mock Mode / API Mode 双模式、以及基于后端 API 文档的接口对齐修复。默认交付状态为 Mock Mode，可在后端未启动时独立运行展示。

## 推荐验收流程

1. 安装依赖：`npm install`
2. 启动开发服务：`npm run dev`
3. 使用浏览器打开 Vite 输出的本地地址
4. 按 `FRONTEND_TEST_CHECKLIST.md` 完成人工验收
5. 执行生产构建：`npm run build`
6. 可选执行生产预览：`npm run preview`

## 运行模式

默认：

```js
export const API_ENABLED = false
```

配置文件：`src/utils/constants.js`

Mock Mode 下：

- 不请求后端 HTTP API
- 不连接业务 WebSocket
- 使用前端 Mock/fallback 数据展示页面

API Mode 下：

- 只主动调用后端文档中明确存在的接口
- 文档未提供的列表、统计、告警、识别结果查询继续使用本地 fallback 数据

## 后端联调注意事项

- 后端地址集中配置在 `src/utils/constants.js`
- 当前后端默认地址为 `http://10.58.177.175:8080`
- WebSocket 默认地址为 `ws://10.58.177.175:8080`
- 开启 API Mode 前，请确认后端已启动且接口文档中的接口可访问

## 提交前注意事项

- 不要提交 `.claude/`
- 不要提交 `output/`
- 不要提交 `*.backup`
- 不要提交 `build-error.log`
- 不要提交 `node_modules/` 或 `dist/`