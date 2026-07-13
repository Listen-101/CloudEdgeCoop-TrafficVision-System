let socketTask = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let messageHandlers = [];
let isConnecting = false;

const connect = (deviceId) => {
  if (isConnecting || (socketTask && socketTask.readyState === 1)) return;

  isConnecting = true;
  const serverHost = wx.getStorageSync('serverHost') || '***.*.*.*';
  const serverPort = wx.getStorageSync('serverPort') || 8080;
  const url = `ws://${serverHost}:${serverPort}/ws/device?deviceId=${deviceId}`;

  socketTask = wx.connectSocket({
    url,
    success: () => {
      console.log('WebSocket connecting...');
    },
    fail: (err) => {
      console.error('WebSocket connect failed:', err);
      isConnecting = false;
      scheduleReconnect(deviceId);
    }
  });

  socketTask.onOpen(() => {
    console.log('WebSocket connected');
    isConnecting = false;
    startHeartbeat(deviceId);
  });

  socketTask.onMessage((res) => {
    try {
      const data = JSON.parse(res.data);
      messageHandlers.forEach(h => h(data));
    } catch (e) {
      console.error('WS message parse error:', e);
    }
  });

  socketTask.onError((err) => {
    console.error('WebSocket error:', err);
    isConnecting = false;
  });

  socketTask.onClose(() => {
    console.log('WebSocket closed');
    isConnecting = false;
    stopHeartbeat();
    socketTask = null;
    scheduleReconnect(deviceId);
  });
};

const disconnect = () => {
  stopHeartbeat();
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (socketTask) {
    socketTask.close();
    socketTask = null;
  }
};

const send = (data) => {
  if (socketTask && socketTask.readyState === 1) {
    socketTask.send({ data: JSON.stringify(data) });
  }
};

const onMessage = (handler) => {
  messageHandlers.push(handler);
};

const offMessage = (handler) => {
  messageHandlers = messageHandlers.filter(h => h !== handler);
};

const startHeartbeat = (deviceId) => {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    send({ type: 'heartbeat', deviceId });
  }, 30000);
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

const scheduleReconnect = (deviceId) => {
  if (reconnectTimer) return;
  const autoReconnect = wx.getStorageSync('autoReconnect');
  if (autoReconnect === false) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(deviceId);
  }, 5000);
};

module.exports = { connect, disconnect, send, onMessage, offMessage };
