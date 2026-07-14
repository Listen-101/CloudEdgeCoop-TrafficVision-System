// 全局状态管理（Mock Mode / API Mode 双模式）
import { reactive } from 'vue'
import {
  API_ENABLED,
  API_BASE_URL,
  DEVICE_ID,
  DEVICE_STATUS,
  HEARTBEAT_INTERVAL,
  REFRESH_INTERVAL,
  MOCK_DATA
} from '../utils/constants.js'
import { registerDevice, deviceHeartbeat } from '../api/device.js'
import websocket from '../api/websocket.js'

function nowTime() {
  return new Date().toLocaleTimeString()
}

function safeText(value, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'object') return fallback
  return String(value)
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeDevice(data = {}) {
  return {
    id: data.id || 'current-device',
    deviceId: safeText(data.deviceId, DEVICE_ID),
    name: safeText(data.name, 'Web控制台'),
    status: safeText(data.status, DEVICE_STATUS.ONLINE),
    lastHeartbeat: safeText(data.lastHeartbeat, new Date().toISOString()),
    serverHost: safeText(data.serverHost, ''),
    serverPort: data.serverPort || null,
    createTime: data.createTime
  }
}

function upsertDevice(deviceData) {
  const device = normalizeDevice(deviceData)
  const index = store.devices.findIndex(item => item.deviceId === device.deviceId)
  if (index >= 0) {
    store.devices[index] = { ...store.devices[index], ...device }
  } else {
    store.devices.unshift(device)
  }
  return device
}

// 全局状态
export const store = reactive({
  // 系统状态
  systemStatus: API_ENABLED ? 'INITIALIZING' : 'MOCK_MODE',
  apiMode: API_ENABLED,

  // 当前设备信息
  currentDevice: {
    deviceId: DEVICE_ID,
    name: 'Web控制台',
    status: API_ENABLED ? DEVICE_STATUS.OFFLINE : 'MOCK',
    lastHeartbeat: null
  },

  // 设备列表
  devices: [...MOCK_DATA.devices],

  // 统计数据
  statistics: { ...MOCK_DATA.statistics },

  // 识别结果列表
  recognitionResults: [...MOCK_DATA.recognitionResults],

  // 告警列表
  alerts: [...MOCK_DATA.alerts],

  // 实时事件流
  eventStream: [...MOCK_DATA.eventStream],

  // 定时器
  timers: {
    heartbeat: null,
    refresh: null
  },

  lastRefresh: null
})

// 初始化系统
export async function initSystem() {
  console.log('Initializing system...')
  console.log('API Mode:', API_ENABLED ? 'ENABLED' : 'DISABLED (Mock Mode)')

  if (!API_ENABLED) {
    // Mock Mode：使用静态数据，不连接后端
    console.log('Running in Mock Mode - using static data')
    store.systemStatus = 'MOCK_MODE'
    store.currentDevice.status = 'MOCK'
    return
  }

  try {
    const url = new URL(API_BASE_URL)
    const serverHost = url.hostname
    const serverPort = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)

    const registerResult = await registerDevice({
      deviceId: DEVICE_ID,
      name: 'Web控制台',
      serverHost,
      serverPort
    })

    if (registerResult.code === 200) {
      const device = upsertDevice(registerResult.data || { deviceId: DEVICE_ID })
      store.currentDevice = device
      store.systemStatus = 'ONLINE'
      console.log('Device registered:', device)

      startHeartbeat()
      startDataRefresh()
      connectWebSocket()
      await refreshAllData()
    } else {
      console.warn('Device registration failed, fallback to Mock Mode')
      fallbackToMockMode()
    }
  } catch (error) {
    console.error('Initialization failed:', error)
    fallbackToMockMode()
  }
}

// 回退到 Mock/fallback 数据
function fallbackToMockMode() {
  store.systemStatus = 'OFFLINE'
  store.currentDevice.status = DEVICE_STATUS.OFFLINE

  if (store.timers.heartbeat) {
    clearInterval(store.timers.heartbeat)
    store.timers.heartbeat = null
  }
  if (store.timers.refresh) {
    clearInterval(store.timers.refresh)
    store.timers.refresh = null
  }

  websocket.disconnect()

  store.devices = [...MOCK_DATA.devices]
  store.statistics = { ...MOCK_DATA.statistics }
  store.recognitionResults = [...MOCK_DATA.recognitionResults]
  store.alerts = [...MOCK_DATA.alerts]
  store.eventStream = [...MOCK_DATA.eventStream]

  console.log('Fallback to Mock Mode - using static data')
}

// 启动心跳
function startHeartbeat() {
  if (!API_ENABLED) return

  if (store.timers.heartbeat) {
    clearInterval(store.timers.heartbeat)
  }

  const sendHeartbeat = async () => {
    try {
      const result = await deviceHeartbeat(DEVICE_ID)
      if (result.code === 200) {
        const lastHeartbeat = new Date().toISOString()
        store.currentDevice.lastHeartbeat = lastHeartbeat
        store.currentDevice.status = DEVICE_STATUS.ONLINE
        upsertDevice({ ...store.currentDevice, lastHeartbeat, status: DEVICE_STATUS.ONLINE })
      } else {
        store.currentDevice.status = DEVICE_STATUS.OFFLINE
        upsertDevice({ ...store.currentDevice, status: DEVICE_STATUS.OFFLINE })
      }
    } catch (error) {
      console.error('Heartbeat failed:', error)
      store.currentDevice.status = DEVICE_STATUS.OFFLINE
      upsertDevice({ ...store.currentDevice, status: DEVICE_STATUS.OFFLINE })
    }
  }

  store.timers.heartbeat = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
  sendHeartbeat()
}

// 启动本地数据刷新。当前后端文档未提供列表/统计/告警/识别查询接口，因此不主动请求这些接口。
function startDataRefresh() {
  if (!API_ENABLED) return

  if (store.timers.refresh) {
    clearInterval(store.timers.refresh)
  }

  store.timers.refresh = setInterval(() => {
    refreshAllData()
  }, REFRESH_INTERVAL)
}

// 刷新数据
export async function refreshAllData() {
  if (!API_ENABLED) {
    console.log('Mock Mode: Skip data refresh')
    return
  }

  // API Mode 下只保留本地 fallback 数据；等待后端补充查询接口后再接入真实查询。
  store.lastRefresh = new Date().toISOString()
}

function handleRecognitionMessage(data = {}) {
  const result = {
    deviceId: safeText(data.deviceId, DEVICE_ID),
    frameId: data.frameId || null,
    plateNumber: safeText(data.plateNumber, '未知车牌'),
    vehicleType: safeText(data.vehicleType, '未知车型'),
    alertType: safeText(data.alertType, null),
    confidence: safeNumber(data.confidence, 0),
    createTime: safeText(data.createTime, nowTime())
  }

  store.recognitionResults.unshift(result)
  if (store.recognitionResults.length > 50) {
    store.recognitionResults.pop()
  }

  const hasAlert = result.alertType && result.alertType !== '正常'
  addEventToStream({
    time: nowTime(),
    type: hasAlert ? 'warning' : 'info',
    title: hasAlert ? result.alertType : '车辆识别',
    desc: `${result.plateNumber} - ${result.vehicleType}`,
    scene: '实时识别'
  })

  if (hasAlert) {
    store.alerts.unshift({
      type: result.alertType,
      scene: '实时监控',
      level: 'alert',
      status: 'active',
      time: nowTime(),
      plateNumber: result.plateNumber
    })
    if (store.alerts.length > 50) {
      store.alerts.pop()
    }
  }
}

function handleStatusMessage(data = {}) {
  const deviceId = safeText(data.deviceId, DEVICE_ID)
  const status = safeText(data.status, DEVICE_STATUS.ONLINE)
  const latency = safeNumber(data.latency, store.statistics.avgLatency)
  const serverFps = safeNumber(data.serverFps, 0)

  store.currentDevice.status = status
  store.statistics.avgLatency = latency
  upsertDevice({ ...store.currentDevice, deviceId, status, lastHeartbeat: new Date().toISOString() })

  addEventToStream({
    time: nowTime(),
    type: status === DEVICE_STATUS.ONLINE ? 'success' : 'warning',
    title: status === DEVICE_STATUS.ONLINE ? '设备在线' : '设备状态更新',
    desc: `${deviceId} 延迟 ${latency}ms${serverFps ? ` / ${serverFps} FPS` : ''}`,
    scene: '设备管理'
  })
}

// 连接 WebSocket
function connectWebSocket() {
  if (!API_ENABLED) return

  try {
    websocket.connect(DEVICE_ID)

    // 文档消息类型
    websocket.on('recognition', handleRecognitionMessage)
    websocket.on('status', handleStatusMessage)

    // 兼容旧 Mock/历史消息类型
    websocket.on('RECOGNITION_RESULT', handleRecognitionMessage)
    websocket.on('DEVICE_STATUS', handleStatusMessage)
  } catch (error) {
    console.error('WebSocket connection failed:', error)
  }
}

// 添加事件到事件流
function addEventToStream(event) {
  store.eventStream.unshift({
    time: safeText(event.time, nowTime()),
    type: safeText(event.type, 'info'),
    title: safeText(event.title, '事件'),
    desc: safeText(event.desc, ''),
    scene: safeText(event.scene, '系统')
  })

  if (store.eventStream.length > 50) {
    store.eventStream.pop()
  }
}

// 停止系统
export function stopSystem() {
  if (store.timers.heartbeat) {
    clearInterval(store.timers.heartbeat)
    store.timers.heartbeat = null
  }

  if (store.timers.refresh) {
    clearInterval(store.timers.refresh)
    store.timers.refresh = null
  }

  websocket.disconnect()

  if (API_ENABLED) {
    store.systemStatus = 'OFFLINE'
  }
}

export default store
