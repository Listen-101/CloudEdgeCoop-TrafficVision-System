package com.listen.project_backend.service;

import com.listen.project_backend.entity.FrameRecord;
import org.springframework.web.multipart.MultipartFile;

public interface ImageService {

    FrameRecord save(MultipartFile file, String deviceId, Long timestamp);
}
