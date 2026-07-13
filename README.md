# 车辆图像采集与识别系统

三端协同系统：**微信小程序**（图像采集）→ **Java Spring Boot**（后端服务）→ **Python AI 桥接**（YOLO 车辆检测/追踪/车牌识别）。

## 架构概览

```
┌─────────────────┐     HTTP/WS      ┌──────────────────┐     HTTP (JSON)    ┌─────────────────┐
│  微信小程序      │ ◄──────────────► │  Java Spring Boot │ ◄───────────────► │  Python AI 桥接  │
│  (摄像头采集)    │   uploadFile     │  (8080 端口)      │   Base64 图片     │  (5000 端口)     │
│                 │   WebSocket      │                   │                   │  YOLOv8 + CUDA  │
│  - 实时拍照      │                  │  - 设备管理        │                   │                 │
│  - 10FPS 上传   │                  │  - 图片存储        │                   │  - 车辆检测      │
│  - 状态监控      │                  │  - 异步 AI 队列    │                   │  - 车辆追踪      │
│  - 历史记录      │                  │  - WebSocket 推送  │                   │  - 车牌识别      │
│                 │                  │  - 定时清理        │                   │                 │
└─────────────────┘                  └──────────────────┘                   └─────────────────┘
                                              │
                                              ▼
                                       ┌──────────────────┐
                                       │     MySQL        │
                                       │  (3306 端口)     │
                                       │  schoolProjectDB │
                                       └──────────────────┘
```

## 目录结构

```
D:\school_project\
├── Mini Program/                          # 微信小程序
│   ├── app.js / app.json / app.wxss      # 入口与全局配置
│   ├── pages/
│   │   ├── index/                         # 主页面（摄像头采集 + 控制）
│   │   ├── settings/                      # 设置页（服务器地址、FPS、画质）
│   │   ├── logs/                          # 日志页（采集日志查看）
│   │   └── history/                       # 历史页（图片记录浏览）
│   └── utils/
│       ├── api.js                         # HTTP API 封装
│       └── ws.js                          # WebSocket 封装
│
├── project_backend/                       # Java Spring Boot 后端
│   ├── src/main/java/.../
│   │   ├── controller/                    # REST API 控制器
│   │   ├── service/                       # 业务逻辑 + AI 异步队列
│   │   ├── websocket/                     # WebSocket 处理器
│   │   └── config/                        # Spring 配置
│   ├── src/main/resources/
│   │   └── application.yml               # 应用配置
│   └── images/                            # 上传图片存储目录
│
├── ai_bridge/                             # Python AI 桥接服务
│   ├── server.py                          # Flask-less HTTP 服务
│   └── yolov8n.pt                         # YOLOv8 nano 模型权重
│
├── traffic_algorithm_sdk_backend_v2_2026-07-13/  # 算法 SDK
└── Python312/                             # Python 3.12 独立环境（GPU）
```

## 自行下载的组件

以下组件因体积过大未包含在仓库中，需自行下载：

| 组件 | 大小 | 说明 | 获取方式 |
|------|------|------|----------|
| Python 3.12 运行环境 | ~1GB | GPU 推理专用，放入 `Python312/` | [python.org](https://www.python.org/downloads/) 下载 embeddable 版本 |
| 算法 SDK | ~463MB | 车牌检测/识别模型，放入 `traffic_algorithm_sdk_backend_v2_2026-07-13/` | 联系项目方获取 |
| YOLO 模型权重 | ~6MB | `yolov8n.pt`，放入 `ai_bridge/` | `ultralytics` 首次运行自动下载，或手动 `pip install ultralytics` 后运行 |
| PyTorch CUDA | ~2.5GB | GPU 推理框架 | [download.pytorch.org](https://download.pytorch.org/whl/torch_stable.html) 下载 CUDA 12.4 版本 |

## 环境要求

| 组件 | 版本/工具 | 说明 |
|------|----------|------|
| Java | JDK 17+ | Spring Boot 3.x |
| MySQL | 8.0+ | 数据库 `schoolProjectDB` |
| Python | 3.12（GPU 桥接）/ 3.14（开发） | 免安装版放入 `D:\school_project\Python312\` |
| CUDA | 12.4+ | NVIDIA GPU + 驱动 |
| 微信开发者工具 | 最新稳定版 | 小程序编译调试 |
| 手机热点 | — | 小程序与后端需同一局域网 |

## 配置前必读

源码中以下信息已用 `***` 占位，**运行前必须替换为实际值**：

| 位置 | 占位符 | 说明 |
|------|--------|------|
| `application.yml` | `password: ***` | MySQL 数据库密码 |
| `utils/api.js` | `'***.*.*.*'` | 后端服务器 IP（手机热点 IP） |
| `utils/ws.js` | `'***.*.*.*'` | WebSocket 服务器 IP |
| `pages/settings/settings.js` | `'***.*.*.*'` | 设置页默认服务器 IP |
| `project.config.json` | AppID | 微信小程序 AppID |

获取方式：
- **服务器 IP**：手机开热点 → 电脑连接 → `ipconfig` 查看无线网卡 IPv4
- **数据库密码**：MySQL 安装时设置的 root 密码
- **AppID**：微信公众平台 → 开发管理 → 开发设置

---

## 快速启动

### 1. MySQL 数据库

确保 MySQL 运行在 `localhost:3306`，用户名 `root`，密码 `***`（替换为实际密码），已创建数据库 `schoolProjectDB`。启动后 MyBatis-Plus 会自动建表。

### 2. Python AI 桥接（GPU）

```bash
cd D:\school_project\ai_bridge
D:\school_project\Python312\python.exe server.py
```

看到以下输出表示启动成功：
```
Algorithm SDK available: True
TrafficAlgorithmService initialized successfully (CPU mode)  # 实际为 cuda
AI Bridge listening on http://0.0.0.0:5000
```

健康检查：`curl http://127.0.0.1:5000/api/health`

### 3. Java 后端

在 IntelliJ IDEA 中打开 `D:\school_project\project_backend`，运行 `ProjectBackendApplication`。

或命令行：
```bash
cd D:\school_project\project_backend
mvn spring-boot:run
```

后端启动在 `http://localhost:8080`。

### 4. 微信小程序

1. 打开**微信开发者工具**
2. 导入项目目录 `D:\school_project\Mini Program`
3. AppID：`***`（替换为你的微信小程序 AppID）
4. 点击「编译」或 `Ctrl+B`
5. 在**设置页**配置服务器 IP（手机热点 IP）和端口 `8080`

### 启动顺序

```
MySQL → Python AI 桥接 → Java 后端 → 微信小程序
```

## 配置说明

### 后端配置（application.yml）

```yaml
server:
  port: 8080                           # 后端端口

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/schoolProjectDB
    username: root
    password: ***  # 替换为实际数据库密码

app:
  image:
    save-path: D:/school_project/project_backend/images   # 图片存储路径
    cleanup-days: 7                                        # 自动清理天数
  ai:
    python-url: http://127.0.0.1:5000                     # AI 桥接地址
```

### 小程序配置

小程序服务器地址在**设置页**手动配置，保存到本地 Storage：
- `serverHost`：默认 `***.*.*.*`（需改为手机热点 IP，见下方配置说明）
- `serverPort`：默认 `8080`
- `captureFps`：采集帧率，默认 `10`
- `imageQuality`：图片质量百分比，默认 `80`
- `autoReconnect`：WebSocket 自动重连，默认 `true`

### AI 桥接配置

修改 `server.py` 中的设备参数：
```python
device="cuda"     # GPU 推理，改为 "cpu" 使用 CPU
max_streams=4     # 最大并发视频流
```

端口通过命令行参数修改：
```bash
python server.py --port 5001
```

## 数据流程

```
1. 小程序摄像头拍照（10 FPS）
2. wx.uploadFile → POST /api/image/upload
3. 后端存盘 + 写入 frame_record 表
4. 异步送入 AiProcessingQueue（2 线程）
5. 图片 Base64 编码 → POST /api/recognize（Python 桥接）
6. YOLO 推理 → 返回检测/追踪/车牌结果
7. 结果写入 recognition_result 表
8. WebSocket 推送识别结果给小程序
9. 小程序日志面板 + 历史页可查看
```

## API 文档

详见 [API接口文档.md](API接口文档.md)

## WebSocket 消息

### 设备状态（每 5 秒推送）
```json
{ "type": "status", "data": { "cpuUsage": 23.5, "memoryUsage": 62.1, ... } }
```

### 识别结果（实时推送）
```json
{ "type": "recognition", "frameId": 42, "results": [{ "plateNumber": "京A12345", ... }] }
```

## 定时任务

| 任务 | 频率 | 说明 |
|------|------|------|
| 系统状态推送 | 每 5 秒 | WebSocket 广播 |
| 文件自动清理 | 每日凌晨 3:00 | 清理 7 天前的图片 |

## 常见问题

**小程序连不上后端？**
- 检查手机热点是否开启
- 设置页 IP 是否为当前热点 IP（`ipconfig` 查看）
- 小程序详情→本地设置→不校验合法域名（开发阶段）

**AI 识别报错？**
- Python 桥接是否启动：`curl http://127.0.0.1:5000/api/health`
- 查看 Python 控制台错误信息
- GPU 不可用时改为 `device="cpu"`（速度慢 ~10 倍）

**端口被占用？**
```bash
netstat -ano | findstr 8080    # 查占用
taskkill /F /PID <PID>         # 杀进程
```

**Python 两个版本说明？**
- `D:\school_project\Python312\python.exe` — 专用于 AI 桥接（CUDA GPU）
- 系统 `python` 命令 — Python 3.14，不影响桥接服务
