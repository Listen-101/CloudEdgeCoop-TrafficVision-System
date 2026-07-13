package com.listen.project_backend.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.listen.project_backend.entity.FrameRecord;

public interface FrameRecordService {
    Page<FrameRecord> listByDevice(String deviceId, int page, int size);
}
