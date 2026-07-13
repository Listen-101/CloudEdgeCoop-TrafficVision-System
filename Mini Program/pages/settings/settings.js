Page({
  data: {
    serverHost: '***.*.*.*',
    serverPort: 8080,
    captureFps: 10,
    imageQuality: 80,
    autoReconnect: true
  },

  onLoad() {
    this.loadSettings();
  },

  onShow() {
    this.loadSettings();
  },

  loadSettings() {
    this.setData({
      serverHost: wx.getStorageSync('serverHost') || '***.*.*.*',
      serverPort: wx.getStorageSync('serverPort') || 8080,
      captureFps: wx.getStorageSync('captureFps') || 10,
      imageQuality: wx.getStorageSync('imageQuality') || 80,
      autoReconnect: wx.getStorageSync('autoReconnect') !== false
    });
  },

  onServerHostChange(e) {
    const value = e.detail.value;
    this.setData({ serverHost: value });
    wx.setStorageSync('serverHost', value);
  },

  onServerPortChange(e) {
    const value = parseInt(e.detail.value) || 8080;
    this.setData({ serverPort: value });
    wx.setStorageSync('serverPort', value);
  },

  onCaptureFpsChange(e) {
    const value = parseInt(e.detail.value) || 10;
    this.setData({ captureFps: value });
    wx.setStorageSync('captureFps', value);
  },

  onImageQualityChange(e) {
    const value = parseInt(e.detail.value) || 80;
    this.setData({ imageQuality: value });
    wx.setStorageSync('imageQuality', value);
  },

  onAutoReconnectChange(e) {
    const value = e.detail.value;
    this.setData({ autoReconnect: value });
    wx.setStorageSync('autoReconnect', value);
  },

  testConnection() {
    wx.showLoading({ title: '连接测试中...' });
    const baseUrl = `http://${this.data.serverHost}:${this.data.serverPort}`;
    wx.request({
      url: baseUrl + '/api/device/test',
      method: 'GET',
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: '连接成功', icon: 'success' });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '连接失败', icon: 'error' });
      }
    });
  },

  resetSettings() {
    wx.showModal({
      title: '确认重置',
      content: '将恢复默认设置？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.loadSettings();
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  }
});
