package com.listen.project_backend.service;

import com.listen.project_backend.dto.SystemStatusVO;

public interface SystemMonitorService {
    SystemStatusVO getStatus();
}
