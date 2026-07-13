package com.listen.project_backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.listen.project_backend.entity.RecognitionResult;
import com.listen.project_backend.mapper.RecognitionResultMapper;
import com.listen.project_backend.service.RecognitionResultService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecognitionResultServiceImpl implements RecognitionResultService {

    private final RecognitionResultMapper mapper;

    public RecognitionResultServiceImpl(RecognitionResultMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void save(RecognitionResult result) {
        mapper.insert(result);
    }

    @Override
    public Page<RecognitionResult> listByDevice(String deviceId, int page, int size) {
        var wrapper = new LambdaQueryWrapper<RecognitionResult>()
                .eq(RecognitionResult::getDeviceId, deviceId)
                .orderByDesc(RecognitionResult::getCreateTime);
        return mapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    public Page<RecognitionResult> listByFrameId(Long frameId, int page, int size) {
        var wrapper = new LambdaQueryWrapper<RecognitionResult>()
                .eq(RecognitionResult::getFrameId, frameId)
                .orderByDesc(RecognitionResult::getCreateTime);
        return mapper.selectPage(new Page<>(page, size), wrapper);
    }
}
