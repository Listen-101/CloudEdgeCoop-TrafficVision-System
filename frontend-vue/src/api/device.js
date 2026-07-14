// 设备管理 API
import request from './request.js'

export function registerDevice(data) {
  return request.post('/api/device/register', data)
}

export function deviceHeartbeat(deviceId) {
  return request.post('/api/device/heartbeat', { deviceId })
}

export function getDeviceInfo(deviceId) {
  return request.get(`/api/device/${encodeURIComponent(deviceId)}`)
}

export function testDeviceApi() {
  return request.get('/api/device/test')
}

// 当前后端 API 文档未提供设备列表接口，不在当前 API Mode 主动调用。
export function getDeviceList() {
  return Promise.resolve({
    code: -1,
    message: 'Device list API is not provided by current backend API document',
    data: null
  })
}

// 当前后端 API 文档未提供设备状态更新接口，不在当前 API Mode 主动调用。
export function updateDeviceStatus(deviceId, status) {
  return Promise.resolve({
    code: -1,
    message: 'Device status update API is not provided by current backend API document',
    data: { deviceId, status }
  })
}
