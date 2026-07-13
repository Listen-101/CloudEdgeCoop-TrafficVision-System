package com.listen.project_backend.service;

import com.listen.project_backend.entity.RecognitionResult;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public interface RecognitionResultService {
    void save(RecognitionResult result);
    Page<RecognitionResult> listByDevice(String deviceId, int page, int size);
    Page<RecognitionResult> listByFrameId(Long frameId, int page, int size);
}
