// 系统常量配置

// ========== API 模式开关 ==========
// 默认使用 Mock Mode，不连接真实后端
// 设为 true 才会连接真实后端 API 和 WebSocket
export const API_ENABLED = false

// API 基础地址（仅在 API_ENABLED = true 时使用）
export const API_BASE_URL = 'http://10.58.177.175:8080'

// WebSocket 地址（仅在 API_ENABLED = true 时使用）
export const WS_BASE_URL = 'ws://10.58.177.175:8080'

// 设备 ID（前端控制台固定ID）
export const DEVICE_ID = 'CONSOLE_WEB_' + Date.now()

// 心跳间隔（毫秒）
export const HEARTBEAT_INTERVAL = 30000 // 30秒

// 数据刷新间隔（毫秒）
export const REFRESH_INTERVAL = 5000 // 5秒

// 设备状态
export const DEVICE_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE'
}

// 告警类型
export const ALERT_TYPE = {
  NORMAL: '正常',
  NO_PARKING: '禁停超时',
  ROAD_ANOMALY: '道路异常',
  CONGESTION: '拥堵提醒',
  NON_WHITELIST: '非白名单'
}

// 车辆类型
export const VEHICLE_TYPE = {
  CAR: '轿车',
  TRUCK: '卡车',
  BUS: '客车',
  MOTORCYCLE: '摩托车'
}

// ========== Mock 数据 ==========
export const MOCK_DATA = {
  statistics: {
    onlineDevices: 3,
    activeAlerts: 5,
    todayRecognitions: 182,
    avgLatency: 38
  },

  devices: [
    { id: 1, deviceId: 'EDGE-CAM-01', name: '边缘摄像头01', status: 'ONLINE', lastHeartbeat: '2026-07-13 10:30:00' },
    { id: 2, deviceId: 'EDGE-CAM-02', name: '边缘摄像头02', status: 'ONLINE', lastHeartbeat: '2026-07-13 10:29:45' },
    { id: 3, deviceId: 'EDGE-GATE-01', name: '闸机设备01', status: 'ONLINE', lastHeartbeat: '2026-07-13 10:30:12' },
    { id: 4, deviceId: 'EDGE-SPARE-01', name: '备用设备01', status: 'OFFLINE', lastHeartbeat: '2026-07-13 09:45:00' }
  ],

  recognitionResults: [
    { deviceId: 'EDGE-CAM-01', plateNumber: '粤B·A7K29', vehicleType: '轿车', alertType: null, createTime: '10:24:11' },
    { deviceId: 'EDGE-CAM-02', plateNumber: '粤B·C9M21', vehicleType: '轿车', alertType: '非白名单', createTime: '10:19:36' },
    { deviceId: 'EDGE-CAM-01', plateNumber: '粤A·8F230', vehicleType: '轿车', alertType: null, createTime: '10:12:04' },
    { deviceId: 'EDGE-GATE-01', plateNumber: '粤A·3D512', vehicleType: '卡车', alertType: null, createTime: '10:05:38' }
  ],

  alerts: [
    { type: '禁停超时', scene: '禁停监控', level: 'alert', status: 'active', time: '10:24:18', plateNumber: 'CAR-03' },
    { type: '道路异常', scene: '道路异常', level: 'alert', status: 'active', time: '10:20:43', plateNumber: null },
    { type: '非白名单', scene: '闸机监控', level: 'warn', status: 'review', time: '10:16:09', plateNumber: '粤B·C9M21' },
    { type: '拥堵提醒', scene: '拥堵监测', level: 'warn', status: 'active', time: '10:08:27', plateNumber: null },
    { type: '设备波动', scene: '设备管理', level: 'offline', status: 'closed', time: '09:52:51', plateNumber: null }
  ],

  eventStream: [
    { time: '10:24:18', type: 'warning', title: '禁停超时', desc: 'CAR-03 停留 02:18', scene: '禁停监控' },
    { time: '10:20:43', type: 'warning', title: '道路异常', desc: '主干道右侧障碍物', scene: '道路异常' },
    { time: '10:16:09', type: 'info', title: '非白名单车辆', desc: '粤B·C9M21 待复核', scene: '闸机监控' },
    { time: '10:12:04', type: 'success', title: '通行允许', desc: '粤A·8F230 白名单通过', scene: '闸机监控' },
    { time: '10:08:27', type: 'info', title: '拥堵提醒', desc: '路口 B 轻度拥堵', scene: '拥堵监测' },
    { time: '10:05:48', type: 'success', title: '设备上线', desc: 'EDGE-CAM-02 连接成功', scene: '设备管理' }
  ]
}
