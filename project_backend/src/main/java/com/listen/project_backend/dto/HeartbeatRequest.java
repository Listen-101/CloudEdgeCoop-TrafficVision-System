package com.listen.project_backend.dto;

import jakarta.validation.constraints.NotBlank;

public class HeartbeatRequest {

    @NotBlank(message = "设备ID不能为空")
    private String deviceId;

    private String status;

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
