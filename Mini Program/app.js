// 静默框架级 backgroundFetch 隐私报错，不影响功能
const _error = console.error;
console.error = function() {
  var msg = Array.prototype.join.call(arguments, ' ');
  if (msg.indexOf('backgroundfetch') > -1 || msg.indexOf('backgroundFetch') > -1) return;
  _error.apply(console, arguments);
};

App({
  onLaunch() {},

  onError(err) {
    if (err && err.indexOf && err.indexOf('backgroundFetch') > -1) return;
    console.error('App Error:', err);
  },

  globalData: {
    userInfo: null
  }
});
