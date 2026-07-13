package com.listen.project_backend.dto;

import jakarta.validation.constraints.NotBlank;

public class DeviceRegisterRequest {

    @NotBlank(message = "设备ID不能为空")
    private String deviceId;

    private String name;
    private String serverHost;
    private Integer serverPort;

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getServerHost() { return serverHost; }
    public void setServerHost(String serverHost) { this.serverHost = serverHost; }

    public Integer getServerPort() { return serverPort; }
    public void setServerPort(Integer serverPort) { this.serverPort = serverPort; }
}
