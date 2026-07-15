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

const HEATMAP_WIDTH = 800
const HEATMAP_HEIGHT = 450

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function parseResultData(value) {
  if (!value) return {}
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return {}

  try {
    return JSON.parse(value)
  } catch (error) {
    return {}
  }
}

function scaleBox(box) {
  const allNormalized = [box.x, box.y, box.w, box.h].every(value => value >= 0 && value <= 1)
  const x = allNormalized ? box.x * HEATMAP_WIDTH : box.x
  const y = allNormalized ? box.y * HEATMAP_HEIGHT : box.y
  const w = allNormalized ? box.w * HEATMAP_WIDTH : box.w
  const h = allNormalized ? box.h * HEATMAP_HEIGHT : box.h

  return {
    x: clamp(x, 0, HEATMAP_WIDTH),
    y: clamp(y, 0, HEATMAP_HEIGHT),
    w: clamp(w, 1, HEATMAP_WIDTH),
    h: clamp(h, 1, HEATMAP_HEIGHT)
  }
}

function boxFromArray(values, source = {}) {
  if (!Array.isArray(values) || values.length < 4) return null

  const raw = values.slice(0, 4).map(value => Number(value))
  if (raw.some(value => !Number.isFinite(value))) return null

  const [x1, y1, third, fourth] = raw
  const format = safeText(source.bboxFormat || source.bbox_format || source.boxFormat || source.box_format, '').toLowerCase()
  const isXyxy = format.includes('xyxy') || (!format && third > x1 && fourth > y1)

  if (isXyxy) {
    return scaleBox({ x: x1, y: y1, w: third - x1, h: fourth - y1 })
  }
  return scaleBox({ x: x1, y: y1, w: third, h: fourth })
}

function boxFromObject(source = {}) {
  if (!source || typeof source !== 'object') return null

  const arrayBox = source.bbox || source.box || source.boundingBox || source.bounding_box || source.rect || source.rectangle
  const fromArray = boxFromArray(arrayBox, source)
  if (fromArray) return fromArray

  const x = source.x ?? source.left ?? source.x1
  const y = source.y ?? source.top ?? source.y1
  const width = source.width ?? source.w
  const height = source.height ?? source.h
  if (x !== undefined && y !== undefined && width !== undefined && height !== undefined) {
    return scaleBox({ x: Number(x), y: Number(y), w: Number(width), h: Number(height) })
  }

  const right = source.right ?? source.x2
  const bottom = source.bottom ?? source.y2
  if (x !== undefined && y !== undefined && right !== undefined && bottom !== undefined) {
    return scaleBox({ x: Number(x), y: Number(y), w: Number(right) - Number(x), h: Number(bottom) - Number(y) })
  }

  return null
}

function normalizeHeatmapVehicle(record = {}, frame = {}, index = 0) {
  const parsed = parseResultData(record.resultData)
  const box = boxFromObject(record) || boxFromObject(parsed)
  if (!box) return null

  const confidence = safeNumber(record.confidence ?? parsed.confidence ?? parsed.text_confidence, 0)
  const areaRatio = clamp((box.w * box.h) / (HEATMAP_WIDTH * HEATMAP_HEIGHT), 0.02, 0.18)
  const radius = clamp(46 + areaRatio * 420 + confidence * 24, 54, 126)

  return {
    id: record.id || parsed.track_id || parsed.trackId || `${frame.frameId || 'frame'}-${index}`,
    x: Math.round(box.x),
    y: Math.round(box.y),
    w: Math.round(box.w),
    h: Math.round(box.h),
    cx: Math.round(box.x + box.w / 2),
    cy: Math.round(box.y + box.h / 2),
    radius: Math.round(radius),
    intensity: clamp(0.34 + areaRatio * 2.4 + confidence * 0.28, 0.38, 0.86),
    vehicleType: safeText(record.vehicleType || parsed.class_name || parsed.label, '车辆'),
    plateNumber: safeText(record.plateNumber || parsed.text, ''),
    confidence
  }
}

function buildCurrentFrameHeatmap(frame = {}, records = []) {
  const vehicles = records
    .map((record, index) => normalizeHeatmapVehicle(record, frame, index))
    .filter(Boolean)

  if (vehicles.length === 0) return null

  const coverage = vehicles.reduce((sum, vehicle) => sum + vehicle.w * vehicle.h, 0) / (HEATMAP_WIDTH * HEATMAP_HEIGHT)
  const densityScore = clamp(Math.round(vehicles.length * 12 + coverage * 260), 0, 100)
  const densityLevel = densityScore >= 70 ? '拥堵' : densityScore >= 38 ? '缓行' : '畅通'

  return {
    frameId: frame.frameId || records[0]?.frameId || null,
    deviceId: safeText(frame.deviceId || records[0]?.deviceId, DEVICE_ID),
    fileName: safeText(frame.fileName, ''),
    updatedAt: nowTime(),
    densityScore,
    densityLevel,
    vehicles
  }
}

function normalizeRecognitionRecord(record = {}, frame = {}) {
  const parsed = parseResultData(record.resultData)
  return {
    deviceId: safeText(record.deviceId || frame.deviceId, DEVICE_ID),
    frameId: record.frameId || frame.frameId || null,
    plateNumber: safeText(record.plateNumber || parsed.text, '未知车牌'),
    vehicleType: safeText(record.vehicleType || parsed.class_name || parsed.label, '未知车型'),
    alertType: safeText(record.alertType, null),
    confidence: safeNumber(record.confidence ?? parsed.confidence ?? parsed.text_confidence, 0),
    resultData: record.resultData,
    bbox: record.bbox || parsed.bbox,
    createTime: safeText(record.createTime, nowTime())
  }
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

  // 当前帧车辆密度热力图
  currentFrameHeatmap: {
    ...MOCK_DATA.currentFrameHeatmap,
    vehicles: [...MOCK_DATA.currentFrameHeatmap.vehicles]
  },

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
  store.currentFrameHeatmap = {
    ...MOCK_DATA.currentFrameHeatmap,
    vehicles: [...MOCK_DATA.currentFrameHeatmap.vehicles]
  }
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
  const records = Array.isArray(data.results) ? data.results : [data]
  const normalizedRecords = records.map(record => normalizeRecognitionRecord(record, data))

  normalizedRecords.reverse().forEach(result => {
    store.recognitionResults.unshift(result)

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
  })

  if (store.recognitionResults.length > 50) {
    store.recognitionResults.splice(50)
  }

  const heatmap = buildCurrentFrameHeatmap(data, records)
  if (heatmap) {
    store.currentFrameHeatmap = heatmap
    if (heatmap.densityLevel !== '畅通') {
      addEventToStream({
        time: heatmap.updatedAt,
        type: 'warning',
        title: '当前帧密度偏高',
        desc: `${heatmap.deviceId} ${heatmap.vehicles.length} 辆 / ${heatmap.densityLevel}`,
        scene: '拥堵监测'
      })
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
