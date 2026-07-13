package com.listen.project_backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.listen.project_backend.entity.FrameRecord;
import com.listen.project_backend.mapper.FrameRecordMapper;
import com.listen.project_backend.service.FrameRecordService;
import org.springframework.stereotype.Service;

@Service
public class FrameRecordServiceImpl implements FrameRecordService {

    private final FrameRecordMapper frameRecordMapper;

    public FrameRecordServiceImpl(FrameRecordMapper frameRecordMapper) {
        this.frameRecordMapper = frameRecordMapper;
    }

    @Override
    public Page<FrameRecord> listByDevice(String deviceId, int page, int size) {
        var wrapper = new LambdaQueryWrapper<FrameRecord>()
                .eq(FrameRecord::getDeviceId, deviceId)
                .orderByDesc(FrameRecord::getCreateTime);
        return frameRecordMapper.selectPage(new Page<>(page, size), wrapper);
    }
}
