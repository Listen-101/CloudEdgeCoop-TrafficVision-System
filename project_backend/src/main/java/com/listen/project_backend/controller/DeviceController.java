package com.listen.project_backend.controller;

import com.listen.project_backend.dto.ApiResult;
import com.listen.project_backend.dto.DeviceRegisterRequest;
import com.listen.project_backend.dto.DeviceVO;
import com.listen.project_backend.dto.HeartbeatRequest;
import com.listen.project_backend.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/device")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping("/register")
    public ApiResult<DeviceVO> register(@Valid @RequestBody DeviceRegisterRequest request) {
        DeviceVO device = deviceService.register(request);
        return ApiResult.success(device);
    }

    @PostMapping("/heartbeat")
    public ApiResult<Void> heartbeat(@Valid @RequestBody HeartbeatRequest request) {
        deviceService.heartbeat(request.getDeviceId());
        return ApiResult.success();
    }

    @GetMapping("/test")
    public ApiResult<String> test() {
        return ApiResult.success("ok");
    }

    @GetMapping("/{deviceId}")
    public ApiResult<DeviceVO> getDevice(@PathVariable String deviceId) {
        DeviceVO device = deviceService.getByDeviceId(deviceId);
        if (device == null) {
            return ApiResult.error(404, "设备不存在");
        }
        return ApiResult.success(device);
    }
}
