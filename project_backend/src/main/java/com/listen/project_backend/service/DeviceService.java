package com.listen.project_backend.service;

import com.listen.project_backend.dto.DeviceRegisterRequest;
import com.listen.project_backend.dto.DeviceVO;

public interface DeviceService {

    DeviceVO register(DeviceRegisterRequest request);

    void heartbeat(String deviceId);

    DeviceVO getByDeviceId(String deviceId);
}
