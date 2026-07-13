package com.listen.project_backend.controller;

import com.listen.project_backend.dto.ApiResult;
import com.listen.project_backend.dto.SystemStatusVO;
import com.listen.project_backend.service.SystemMonitorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/monitor")
public class MonitorController {

    private final SystemMonitorService monitorService;

    public MonitorController(SystemMonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @GetMapping("/status")
    public ApiResult<SystemStatusVO> status() {
        return ApiResult.success(monitorService.getStatus());
    }
}
