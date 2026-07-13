package com.listen.project_backend.service.impl;

import com.listen.project_backend.entity.FrameRecord;
import com.listen.project_backend.mapper.FrameRecordMapper;
import com.listen.project_backend.service.ImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class ImageServiceImpl implements ImageService {

    private static final Logger log = LoggerFactory.getLogger(ImageServiceImpl.class);

    @Value("${app.image.save-path:./images}")
    private String savePath;

    private final FrameRecordMapper frameRecordMapper;

    private final AiProcessingQueue aiProcessingQueue;

    public ImageServiceImpl(FrameRecordMapper frameRecordMapper, AiProcessingQueue aiProcessingQueue) {
        this.frameRecordMapper = frameRecordMapper;
        this.aiProcessingQueue = aiProcessingQueue;
    }

    @Override
    @Transactional
    public FrameRecord save(MultipartFile file, String deviceId, Long timestamp) {
        String dateDir = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String fileName = deviceId + "_" + UUID.randomUUID().toString().substring(0, 8) + ".jpg";

        File dir = new File(savePath, dateDir);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (!created) {
                log.error("Failed to create directory: {}", dir.getAbsolutePath());
                throw new RuntimeException("创建目录失败: " + dir.getAbsolutePath());
            }
        }

        File dest = new File(dir, fileName);
        log.info("Saving to: {}", dest.getAbsolutePath());
        try {
            file.transferTo(dest);
        } catch (IOException e) {
            log.error("Failed to save image: {}", dest.getAbsolutePath(), e);
            throw new RuntimeException("文件保存失败: " + e.getMessage(), e);
        }

        FrameRecord record = new FrameRecord();
        record.setDeviceId(deviceId);
        record.setFileName(fileName);
        record.setFilePath(dest.getAbsolutePath());
        record.setFileSize(dest.length());
        record.setTimestamp(timestamp != null
                ? LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault())
                : LocalDateTime.now());
        record.setCreateTime(LocalDateTime.now());
        frameRecordMapper.insert(record);

        aiProcessingQueue.submit(record);

        log.info("Image saved: {} ({} bytes)", fileName, dest.length());
        return record;
    }
}
