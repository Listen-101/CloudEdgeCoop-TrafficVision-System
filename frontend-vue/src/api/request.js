// Axios 请求封装（带错误兜底）
import { API_BASE_URL, API_ENABLED } from '../utils/constants.js'

// 创建 Request 实例
class Request {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async request(url, options = {}) {
    // 如果 API 未启用，直接返回失败，不发起真实请求
    if (!API_ENABLED) {
      return {
        code: -1,
        message: 'API Mode 未启用',
        data: null
      }
    }

    const { method = 'GET', data, headers = {} } = options
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData

    const config = {
      method,
      headers: isFormData ? { ...headers } : {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (data) {
      if (method === 'GET') {
        const params = new URLSearchParams(data)
        const query = params.toString()
        if (query) {
          url += '?' + query
        }
      } else if (isFormData) {
        config.body = data
      } else {
        config.body = JSON.stringify(data)
      }
    }

    try {
      const response = await fetch(this.baseURL + url, config)
      const result = await response.json()

      if (result.code === 200) {
        return result
      } else {
        console.warn('API Warning:', result.message)
        return result
      }
    } catch (error) {
      console.error('Network Error:', error)
      // 返回失败但不抛出异常，避免页面崩溃
      return {
        code: -1,
        message: '网络请求失败',
        data: null
      }
    }
  }

  get(url, params) {
    return this.request(url, { method: 'GET', data: params })
  }

  post(url, data, headers) {
    return this.request(url, { method: 'POST', data, headers })
  }

  put(url, data) {
    return this.request(url, { method: 'PUT', data })
  }

  delete(url, params) {
    return this.request(url, { method: 'DELETE', data: params })
  }
}

export default new Request(API_BASE_URL)
