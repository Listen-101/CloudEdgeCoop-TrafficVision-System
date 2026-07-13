package com.listen.project_backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DeviceWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(DeviceWebSocketHandler.class);
    private static final Map<String, WebSocketSession> deviceSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, WebSocketSession> getDeviceSessions() {
        return deviceSessions;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String deviceId = getDeviceId(session);
        if (deviceId != null) {
            deviceSessions.put(deviceId, session);
            log.info("Device WebSocket connected: deviceId={}", deviceId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        log.info("WS message from {}: {}", session.getId(), message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String deviceId = getDeviceId(session);
        if (deviceId != null) {
            deviceSessions.remove(deviceId);
            log.info("Device WebSocket disconnected: deviceId={}", deviceId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WS transport error: sessionId={}", session.getId(), exception);
    }

    public void sendMessage(String deviceId, Object message) {
        WebSocketSession session = deviceSessions.get(deviceId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(json));
            } catch (IOException e) {
                log.error("Failed to send WS message to device: {}", deviceId, e);
            }
        }
    }

    public void broadcast(Object message) {
        deviceSessions.forEach((deviceId, session) -> sendMessage(deviceId, message));
    }

    private String getDeviceId(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null) {
            for (String param : query.split("&")) {
                String[] kv = param.split("=");
                if (kv.length == 2 && "deviceId".equals(kv[0])) {
                    return kv[1];
                }
            }
        }
        return null;
    }
}
