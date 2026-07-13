# 图像采集与识别系统 API 接口文档

> 后端地址：`http://{host}:8080`，host 默认为热点 IP（手机设置页查看），小程序端可配置

---

## 1. 设备管理

### 1.1 设备注册

```
POST /api/device/register
Content-Type: application/json
```

**请求体：**
```json
{
  "deviceId": "MP_1712345678_abc123",
  "name": "微信小程序设备",
  "serverHost": "<server_host>",
  "serverPort": 8080
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | String | 是 | 设备唯一标识 |
| name | String | 否 | 设备名称 |
| serverHost | String | 否 | 服务器地址 |
| serverPort | Integer | 否 | 服务器端口 |

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "deviceId": "MP_1712345678_abc123",
    "name": "微信小程序设备",
    "status": "ONLINE",
    "lastHeartbeat": "2026-07-13T10:30:00",
    "serverHost": "<server_host>",
    "serverPort": 8080,
    "createTime": "2026-07-13T10:30:00"
  }
}
```

设备已存在时更新信息并重新上线，不存在则新建。

---

### 1.2 心跳上报

```
POST /api/device/heartbeat
Content-Type: application/json
```

**请求体：**
```json
{
  "deviceId": "MP_1712345678_abc123"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

建议每 30 秒调用一次，更新设备心跳时间和在线状态。

---

### 1.3 查询设备信息

```
GET /api/device/{deviceId}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| deviceId | String | 设备唯一标识（路径参数） |

---

### 1.4 连接测试

```
GET /api/device/test
```

返回 `{"code":200,"message":"success","data":"ok"}`，用于测试后端是否可达。

---

## 2. 图像上传

### 2.1 上传图片

```
POST /api/image/upload
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | JPEG 图片文件 |
| deviceId | String | 是 | 设备唯一标识 |
| timestamp | Long | 否 | 采集时间戳（毫秒） |

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "frameId": 42,
    "fileName": "MP_abc123_a1b2c3d4.jpg"
  }
}
```

上传后：存盘 → 写入 `frame_record` 表 → 异步送入 AI 队列 → 识别结果通过 WebSocket 推送。

---

## 3. 历史记录与图片访问

### 3.1 查询上传记录

```
GET /api/image/list?deviceId={deviceId}&page=1&size=20
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | String | 是 | 设备唯一标识 |
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页条数，默认 20 |

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": 42,
        "deviceId": "MP_abc123",
        "fileName": "MP_abc123_a1b2c3d4.jpg",
        "filePath": "D:/school_project/project_backend/images/20260713/MP_abc123_a1b2c3d4.jpg",
        "fileSize": 30720,
        "timestamp": "2026-07-13T10:30:00",
        "createTime": "2026-07-13T10:30:00"
      }
    ],
    "total": 150,
    "page": 1,
    "size": 20
  }
}
```

### 3.2 静态图片访问

```
GET /images/{yyyyMMdd}/{fileName}
```

示例：`http://<server_host>:8080/images/20260713/MP_abc123_a1b2c3d4.jpg`

---

## 4. AI 识别结果

### 4.1 查询识别结果

```
GET /api/recognition/list?deviceId={deviceId}&frameId={frameId}&page=1&size=20
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | String | 二选一 | 设备 ID |
| frameId | Long | 二选一 | 帧 ID |
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页条数，默认 20 |

### 4.2 AI 桥接服务（Python 端，内部调用）

```
POST /api/recognize
Content-Type: application/json

POST /api/health
GET

POST /api/reset-stream
Content-Type: application/json
```

`/api/recognize` 请求体：
```json
{
  "image": "<base64 编码的图片字节>",
  "stream_id": "MP_abc123",
  "deviceId": "MP_abc123",
  "timestamp": 1720000000000,
  "frame_id": 42,
  "modules": ["tracking", "plate"]
}
```

**处理流程：**
```
图片上传 → 存盘 + 入库 → 响应 200（不阻塞）
                ↓ (异步线程池)
         AI 队列 → Python 桥接 (GPU, ~200ms/帧)
                ↓
         结果入库 (recognition_result)
                ↓
         WebSocket 推送 → 小程序
```

---

## 5. WebSocket 实时推送

### 5.1 连接

```
ws://{host}:8080/ws/device?deviceId={deviceId}
```

### 5.2 服务端状态推送（每 5 秒）

```json
{
  "type": "status",
  "data": {
    "cpuUsage": 23.5,
    "memoryUsage": 62.1,
    "diskUsage": 65.3,
    "activeDevices": 3,
    "uptimeSeconds": 3600,
    "processingQueueSize": 0
  }
}
```

### 5.3 识别结果推送（实时）

```json
{
  "type": "recognition",
  "frameId": 42,
  "deviceId": "MP_abc123",
  "fileName": "MP_abc123_a1b2c3d4.jpg",
  "results": [
    {
      "id": 1,
      "frameId": 42,
      "deviceId": "MP_abc123",
      "plateNumber": "京A12345",
      "vehicleType": "car",
      "alertType": "正常",
      "confidence": 0.95,
      "resultData": "{...}",
      "createTime": "2026-07-13T10:30:00"
    }
  ]
}
```

---

## 6. 系统监控

```
GET /api/monitor/status
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "cpuUsage": 23.5,
    "memoryUsage": 62.1,
    "diskUsage": 65.3,
    "jvmTotalMemory": 268435456,
    "jvmFreeMemory": 125829120,
    "jvmUsedMemory": 142606336,
    "activeDevices": 3,
    "uptimeSeconds": 3600,
    "processingQueueSize": 0
  }
}
```

CPU/内存/磁盘为百分比，内存单位为字节。

---

## 7. 定时任务

| 任务 | 频率 | 说明 |
|------|------|------|
| 状态推送 | 每 5 秒 | WebSocket 广播系统状态 |
| 文件清理 | 每日 03:00 | 清理 `cleanup-days`（默认 7 天）前的图片及记录 |

---

## 8. 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

| code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 附录：数据库表结构

### A.1 device（设备表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| device_id | VARCHAR(64) | 设备唯一标识 |
| name | VARCHAR(128) | 设备名称 |
| status | VARCHAR(16) | ONLINE / OFFLINE |
| last_heartbeat | DATETIME | 最后心跳时间 |
| server_host | VARCHAR(128) | 服务器地址 |
| server_port | INT | 服务器端口 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

### A.2 frame_record（帧记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| device_id | VARCHAR(64) | 设备 ID |
| file_name | VARCHAR(256) | 文件名 |
| file_path | VARCHAR(512) | 存储路径 |
| file_size | BIGINT | 文件大小（字节） |
| timestamp | DATETIME | 采集时间 |
| create_time | DATETIME | 入库时间 |

### A.3 recognition_result（识别结果表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| frame_id | BIGINT | 关联帧 ID |
| device_id | VARCHAR(64) | 设备 ID |
| plate_number | VARCHAR(32) | 车牌号 |
| vehicle_type | VARCHAR(32) | 车辆类型 |
| alert_type | VARCHAR(32) | 告警类型 |
| confidence | DOUBLE | 置信度 |
| result_data | TEXT | 完整结果 JSON |
| create_time | DATETIME | 入库时间 |

### A.4 system_log（系统日志表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| type | VARCHAR(32) | API / ERROR / DEVICE / IMAGE |
| content | TEXT | 日志内容 |
| create_time | DATETIME | 记录时间 |
