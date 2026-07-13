package com.listen.project_backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.listen.project_backend.dto.DeviceRegisterRequest;
import com.listen.project_backend.dto.DeviceVO;
import com.listen.project_backend.entity.Device;
import com.listen.project_backend.mapper.DeviceMapper;
import com.listen.project_backend.service.DeviceService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class DeviceServiceImpl implements DeviceService {

    private final DeviceMapper deviceMapper;

    public DeviceServiceImpl(DeviceMapper deviceMapper) {
        this.deviceMapper = deviceMapper;
    }

    @Override
    @Transactional
    public DeviceVO register(DeviceRegisterRequest request) {
        Device existing = deviceMapper.selectOne(
                new LambdaQueryWrapper<Device>().eq(Device::getDeviceId, request.getDeviceId()));

        Device device;
        if (existing != null) {
            device = existing;
            device.setName(request.getName() != null ? request.getName() : device.getName());
            device.setServerHost(request.getServerHost() != null ? request.getServerHost() : device.getServerHost());
            device.setServerPort(request.getServerPort() != null ? request.getServerPort() : device.getServerPort());
            device.setStatus("ONLINE");
            device.setLastHeartbeat(LocalDateTime.now());
            device.setUpdateTime(LocalDateTime.now());
            deviceMapper.updateById(device);
        } else {
            device = new Device();
            device.setDeviceId(request.getDeviceId());
            device.setName(request.getName() != null ? request.getName() : "");
            device.setServerHost(request.getServerHost() != null ? request.getServerHost() : "");
            device.setServerPort(request.getServerPort() != null ? request.getServerPort() : 8080);
            device.setStatus("ONLINE");
            device.setLastHeartbeat(LocalDateTime.now());
            device.setCreateTime(LocalDateTime.now());
            device.setUpdateTime(LocalDateTime.now());
            deviceMapper.insert(device);
        }

        DeviceVO vo = new DeviceVO();
        BeanUtils.copyProperties(device, vo);
        return vo;
    }

    @Override
    @Transactional
    public void heartbeat(String deviceId) {
        Device device = deviceMapper.selectOne(
                new LambdaQueryWrapper<Device>().eq(Device::getDeviceId, deviceId));
        if (device != null) {
            device.setStatus("ONLINE");
            device.setLastHeartbeat(LocalDateTime.now());
            device.setUpdateTime(LocalDateTime.now());
            deviceMapper.updateById(device);
        }
    }

    @Override
    public DeviceVO getByDeviceId(String deviceId) {
        Device device = deviceMapper.selectOne(
                new LambdaQueryWrapper<Device>().eq(Device::getDeviceId, deviceId));
        if (device == null) {
            return null;
        }
        DeviceVO vo = new DeviceVO();
        BeanUtils.copyProperties(device, vo);
        return vo;
    }
}
