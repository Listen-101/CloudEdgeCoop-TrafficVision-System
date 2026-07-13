package com.listen.project_backend.service.impl;

import com.listen.project_backend.dto.SystemStatusVO;
import com.listen.project_backend.service.SystemMonitorService;
import com.listen.project_backend.websocket.DeviceWebSocketHandler;
import com.sun.management.OperatingSystemMXBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.lang.management.ManagementFactory;

@Service
public class SystemMonitorServiceImpl implements SystemMonitorService {

    private final DeviceWebSocketHandler webSocketHandler;
    private final OperatingSystemMXBean osBean;
    private final String savePath;

    public SystemMonitorServiceImpl(DeviceWebSocketHandler webSocketHandler,
                                    @Value("${app.image.save-path:./images}") String savePath) {
        this.webSocketHandler = webSocketHandler;
        this.osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        this.savePath = savePath;
    }

    @Override
    public SystemStatusVO getStatus() {
        SystemStatusVO vo = new SystemStatusVO();

        double cpuLoad = osBean.getCpuLoad();
        vo.setCpuUsage(Math.round((cpuLoad < 0 ? 0 : cpuLoad) * 1000) / 10.0);

        long totalMem = osBean.getTotalMemorySize();
        long freeMem = osBean.getFreeMemorySize();
        if (totalMem > 0) {
            vo.setMemoryUsage(Math.round((1.0 - (double) freeMem / totalMem) * 1000) / 10.0);
        }

        File imageDir = new File(savePath);
        long totalDisk = imageDir.getTotalSpace();
        long freeDisk = imageDir.getFreeSpace();
        if (totalDisk > 0) {
            vo.setDiskUsage(Math.round((1.0 - (double) freeDisk / totalDisk) * 1000) / 10.0);
        }

        Runtime runtime = Runtime.getRuntime();
        vo.setJvmTotalMemory(runtime.totalMemory());
        vo.setJvmFreeMemory(runtime.freeMemory());
        vo.setJvmUsedMemory(runtime.totalMemory() - runtime.freeMemory());

        vo.setActiveDevices(webSocketHandler.getDeviceSessions().size());
        vo.setUptimeSeconds(ManagementFactory.getRuntimeMXBean().getUptime() / 1000);

        return vo;
    }
}
