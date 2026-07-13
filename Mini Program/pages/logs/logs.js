Page({
  data: {
    logs: [],
    logTypes: ['全部', 'info', 'error', 'warn'],
    selectedType: '全部'
  },

  onLoad() {
    this.loadLogs();
  },

  onShow() {
    this.loadLogs();
  },

  loadLogs() {
    const stored = wx.getStorageSync('captureLogs') || [];
    const allLogs = [...stored].reverse();
    const type = this.data.selectedType;
    const logs = type === '全部' ? allLogs : allLogs.filter(l => l.type === type);
    this.setData({ logs });
  },

  filterByType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ selectedType: type });
    this.loadLogs();
  },

  clearLogs() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有日志吗？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('captureLogs', []);
          this.setData({ logs: [] });
        }
      }
    });
  }
});
