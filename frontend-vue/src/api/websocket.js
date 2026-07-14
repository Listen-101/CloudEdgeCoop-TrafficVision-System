// WebSocket 实时通信封装（带错误兜底）
import { WS_BASE_URL, API_ENABLED } from '../utils/constants.js'

class WebSocketClient {
  constructor() {
    this.ws = null
    this.reconnectTimer = null
    this.reconnectDelay = 3000
    this.listeners = new Map()
    this.enabled = false
  }

  connect(deviceId) {
    // 如果 API 未启用，不连接 WebSocket
    if (!API_ENABLED) {
      console.log('WebSocket disabled: API_ENABLED is false')
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    const url = `${WS_BASE_URL}/ws/device?deviceId=${encodeURIComponent(deviceId)}`
    console.log('Connecting to WebSocket:', url)

    try {
      this.ws = new WebSocket(url)
      this.enabled = true

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.emit('connected')
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket message:', message)
          this.emit('message', message)

          if (message.type) {
            const payload = message.data && typeof message.data === 'object'
              ? { ...message.data, type: message.type }
              : message
            this.emit(message.type, payload)
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket closed')
        this.emit('closed')
        // 只在 API 启用时自动重连
        if (API_ENABLED) {
          this.reconnect(deviceId)
        }
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
      // 连接失败不影响页面运行
      if (API_ENABLED) {
        this.reconnect(deviceId)
      }
    }
  }

  disconnect() {
    this.enabled = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  reconnect(deviceId) {
    if (this.reconnectTimer || !API_ENABLED) {
      return
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('WebSocket reconnecting...')
      this.reconnectTimer = null
      this.connect(deviceId)
    }, this.reconnectDelay)
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected')
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data))
    }
  }
}

export default new WebSocketClient()
