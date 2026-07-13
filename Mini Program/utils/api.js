const getBaseUrl = () => {
  const serverHost = wx.getStorageSync('serverHost') || '***.*.*.*';
  const serverPort = wx.getStorageSync('serverPort') || 8080;
  return `http://${serverHost}:${serverPort}`;
};

const request = (options) => {
  return new Promise((resolve, reject) => {
    const baseUrl = getBaseUrl();
    wx.request({
      url: baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

const get = (url, data) => request({ url, method: 'GET', data });
const post = (url, data) => request({ url, method: 'POST', data });

// Device APIs
const deviceApi = {
  register: (data) => post('/api/device/register', data),
  heartbeat: (data) => post('/api/device/heartbeat', data),
  get: (deviceId) => get(`/api/device/${deviceId}`),
};

module.exports = { request, get, post, deviceApi, getBaseUrl };
