const api = require('../../utils/api');
const ws = require('../../utils/ws');

Page({
  data: {
    deviceId: '',
    connectionStatus: 'disconnected',
    captureStatus: 'stopped',
    fps: 0,
    uploadCount: 0,
    uploadSpeed: '0 KB/s',
    networkType: '',
    captureFps: 10,
    imageQuality: 80,
    logs: []
  },

  cameraContext: null,
  captureTimer: null,
  queue: [],
  uploading: false,
  frameCount: 0,
  speedBytes: 0,
  speedTimer: null,
  uploadTimer: null,
  heartbeatTimer: null,
  _wsHandler: null,

  onLoad() {
    this.data.deviceId = this.generateDeviceId();
    this.loadSettings();
    this.addLog('info', '页面加载');

    this._wsHandler = (msg) => {
      if (msg.type === 'status') {
        const cpu = msg.cpuUsage != null ? msg.cpuUsage.toFixed(1) : '?';
        const mem = msg.memoryUsage != null ? msg.memoryUsage.toFixed(1) : '?';
        this.addLog('info', '服务器: CPU=' + cpu + '% MEM=' + mem + '%');
      } else if (msg.type === 'recognition') {
        this.addLog('info', '识别结果: 帧#' + msg.frameId);
      }
    };
    ws.onMessage(this._wsHandler);
  },

  onShow() {
    this.loadSettings();
    wx.getNetworkType({
      success: (res) => this.setData({ networkType: res.networkType })
    });
    wx.onNetworkStatusChange((res) => {
      this.setData({ networkType: res.networkType });
      this.addLog('info', '网络变化: ' + res.networkType);
    });
    this.registerDevice();
  },

  onHide() {
    if (this.data.captureStatus === 'running') this.stopCapture();
  },

  onUnload() {
    this.stopCapture();
    this.stopHeartbeat();
    ws.offMessage(this._wsHandler);
    ws.disconnect();
    wx.offNetworkStatusChange();
  },

  generateDeviceId() {
    let deviceId = wx.getStorageSync('deviceId');
    if (!deviceId) {
      deviceId = 'MP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      wx.setStorageSync('deviceId', deviceId);
    }
    return deviceId;
  },

  loadSettings() {
    this.setData({
      captureFps: wx.getStorageSync('captureFps') || 10,
      imageQuality: wx.getStorageSync('imageQuality') || 80
    });
  },

  async registerDevice() {
    try {
      await api.deviceApi.register({
        deviceId: this.data.deviceId,
        name: '微信小程序设备'
      });
      this.setData({ connectionStatus: 'connected' });
      this.addLog('info', '设备注册成功');
      ws.connect(this.data.deviceId);
      this.startHeartbeat();
    } catch (err) {
      this.setData({ connectionStatus: 'disconnected' });
      this.addLog('error', '设备注册失败');
    }
  },

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.data.connectionStatus === 'connected') {
        ws.send({ type: 'heartbeat', deviceId: this.data.deviceId });
        api.deviceApi.heartbeat({ deviceId: this.data.deviceId }).catch(() => {});
      }
    }, 30000);
  },

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  },

  toggleCapture() {
    if (this.data.captureStatus === 'running') {
      this.stopCapture();
    } else {
      this.startCapture();
    }
  },

  startCapture() {
    if (this.data.captureStatus === 'running') return;
    if (this.data.connectionStatus !== 'connected') {
      wx.showToast({ title: '请先连接服务器', icon: 'none' });
      return;
    }

    this.setData({ captureStatus: 'running', uploadCount: 0, fps: 0, uploadSpeed: '0 KB/s' });
    this.frameCount = 0;
    this.speedBytes = 0;
    this.queue = [];
    this.uploading = false;

    const maxFps = Math.min(this.data.captureFps, 10);
    const interval = Math.round(1000 / maxFps);
    this.addLog('info', '采集开始 FPS=' + maxFps + ' 间隔=' + interval + 'ms');

    this.cameraContext = wx.createCameraContext();

    this.captureTimer = setInterval(() => {
      if (this.data.captureStatus !== 'running') return;

      this.cameraContext.takePhoto({
        quality: this.data.imageQuality > 70 ? 'high' : 'normal',
        success: (res) => {
          this.frameCount++;
          if (this.frameCount <= 3) {
            this.addLog('info', '拍照成功 #' + this.frameCount);
          }
          if (this.frameCount % maxFps === 0) {
            this.setData({ fps: maxFps });
            this.addLog('info', 'FPS=' + maxFps + ' 队列=' + this.queue.length);
          }
          this.queue.push(res.tempImagePath);
        },
        fail: (err) => {
          this.addLog('error', '拍照失败: ' + JSON.stringify(err));
        }
      });
    }, interval);

    this.uploadLoop();

    this.speedTimer = setInterval(() => {
      const speed = this.speedBytes;
      this.speedBytes = 0;
      let text;
      if (speed >= 1048576) text = (speed / 1048576).toFixed(2) + ' MB/s';
      else if (speed >= 1024) text = (speed / 1024).toFixed(1) + ' KB/s';
      else text = speed + ' B/s';
      this.setData({ uploadSpeed: text });
    }, 1000);
  },

  stopCapture() {
    if (this.data.captureStatus === 'stopped') return;
    if (this.captureTimer) { clearInterval(this.captureTimer); this.captureTimer = null; }
    if (this.speedTimer) { clearInterval(this.speedTimer); this.speedTimer = null; }
    if (this.uploadTimer) { clearTimeout(this.uploadTimer); this.uploadTimer = null; }
    this.setData({ captureStatus: 'stopped', fps: 0, uploadSpeed: '0 KB/s' });
    this.addLog('info', '停止采集 拍照' + this.frameCount + '次 上传' + this.data.uploadCount + '帧');
  },

  uploadLoop() {
    const tick = () => {
      if (this.data.captureStatus !== 'running') { this.uploadTimer = null; return; }
      if (this.uploading || this.queue.length === 0) {
        this.uploadTimer = setTimeout(tick, 50);
        return;
      }

      this.uploading = true;
      const filePath = this.queue.shift();
      const uploadIdx = this.data.uploadCount + 1;

      wx.uploadFile({
        url: api.getBaseUrl() + '/api/image/upload',
        filePath: filePath,
        name: 'file',
        formData: { deviceId: this.data.deviceId, timestamp: Date.now().toString() },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              this.setData({ uploadCount: uploadIdx });
              this.speedBytes += Number(res.data.length) || 30000;
              if (uploadIdx <= 3) {
                this.addLog('info', '上传成功 #' + uploadIdx);
              }
            } else {
              this.addLog('error', '上传返回异常: ' + JSON.stringify(data));
            }
          } catch (e) {
            this.addLog('error', '解析响应失败: ' + String(e));
          }
        },
        fail: (err) => {
          this.addLog('error', '上传失败: ' + JSON.stringify(err));
          if (this.data.captureStatus === 'running' && this.queue.length < 30) {
            this.queue.unshift(filePath);
          }
        },
        complete: () => {
          this.uploading = false;
          this.uploadTimer = setTimeout(tick, 10);
        }
      });
    };

    this.uploadTimer = setTimeout(tick, 100);
  },

  cameraError(e) {
    this.addLog('error', '摄像头错误: ' + JSON.stringify(e.detail));
  },

  addLog(type, content) {
    const log = { type, content, time: new Date().toLocaleTimeString() };
    const logs = [log, ...this.data.logs].slice(0, 100);
    this.setData({ logs });
    const stored = wx.getStorageSync('captureLogs') || [];
    stored.push(log);
    if (stored.length > 500) stored.splice(0, stored.length - 500);
    wx.setStorageSync('captureLogs', stored);
  },

  navigateToSettings() {
    wx.navigateTo({ url: '../settings/settings' });
  },

  navigateToLogs() {
    wx.navigateTo({ url: '../logs/logs' });
  },

  navigateToHistory() {
    wx.navigateTo({ url: '../history/history' });
  }
});
