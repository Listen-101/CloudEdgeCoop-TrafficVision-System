package com.listen.project_backend.service.impl;

import com.listen.project_backend.dto.SystemStatusVO;
import com.listen.project_backend.service.SystemMonitorService;
import com.listen.project_backend.websocket.DeviceWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class StatusPushTask {

    private static final Logger log = LoggerFactory.getLogger(StatusPushTask.class);

    private final DeviceWebSocketHandler webSocketHandler;
    private final SystemMonitorService monitorService;

    public StatusPushTask(DeviceWebSocketHandler webSocketHandler, SystemMonitorService monitorService) {
        this.webSocketHandler = webSocketHandler;
        this.monitorService = monitorService;
    }

    @Scheduled(fixedRate = 5000)
    public void pushStatus() {
        if (webSocketHandler.getDeviceSessions().isEmpty()) return;

        SystemStatusVO status = monitorService.getStatus();
        Map<String, Object> msg = Map.of("type", "status", "data", status);
        webSocketHandler.broadcast(msg);
    }
}
