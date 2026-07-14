// 图像采集与识别 API
import request from './request.js'

export function uploadImage({ file, deviceId, timestamp } = {}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('deviceId', deviceId)
  if (timestamp !== undefined && timestamp !== null) {
    formData.append('timestamp', timestamp)
  }

  return request.post('/api/image/upload', formData)
}

// 兼容旧调用名；当前后端 API 文档未提供 base64 上传接口，不能请求旧路径。
export function uploadImageBase64() {
  return Promise.resolve({
    code: -1,
    message: 'Base64 image upload API is not provided by current backend API document',
    data: null
  })
}

// 当前后端 API 文档未提供最新帧查询接口，不在当前 API Mode 主动调用。
export function getLatestFrames() {
  return Promise.resolve({
    code: -1,
    message: 'Latest frames API is not provided by current backend API document',
    data: null
  })
}

// 当前后端 API 文档未提供识别结果查询接口，不在当前 API Mode 主动调用。
export function getRecognitionResults() {
  return Promise.resolve({
    code: -1,
    message: 'Recognition results API is not provided by current backend API document',
    data: null
  })
}

// 当前后端 API 文档未提供按设备查询识别结果接口，不在当前 API Mode 主动调用。
export function getDeviceRecognitions(deviceId, params) {
  return Promise.resolve({
    code: -1,
    message: 'Device recognition API is not provided by current backend API document',
    data: { deviceId, ...(params || {}) }
  })
}

// 当前后端 API 文档未提供告警列表接口，不在当前 API Mode 主动调用。
export function getAlertList() {
  return Promise.resolve({
    code: -1,
    message: 'Alert list API is not provided by current backend API document',
    data: null
  })
}

// 当前后端 API 文档未提供统计汇总接口，不在当前 API Mode 主动调用。
export function getStatistics() {
  return Promise.resolve({
    code: -1,
    message: 'Statistics API is not provided by current backend API document',
    data: null
  })
}
