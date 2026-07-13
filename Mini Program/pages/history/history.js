const api = require('../../utils/api');

Page({
  data: {
    records: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    previewUrl: ''
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    this.loadRecords();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  loadRecords() {
    this.setData({ page: 1, records: [], hasMore: true });
    this.fetchRecords();
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.fetchRecords();
  },

  fetchRecords() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const baseUrl = api.getBaseUrl();
    wx.request({
      url: baseUrl + '/api/image/list',
      data: { page: this.data.page, pageSize: this.data.pageSize },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const newRecords = res.data.data || [];
          const records = this.data.page === 1
            ? newRecords
            : [...this.data.records, ...newRecords];
          this.setData({
            records,
            hasMore: newRecords.length >= this.data.pageSize
          });
        }
      },
      fail: (err) => {
        console.error('加载历史记录失败:', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },

  formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const pad = (n) => n < 10 ? '0' + n : n;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
      + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
});
