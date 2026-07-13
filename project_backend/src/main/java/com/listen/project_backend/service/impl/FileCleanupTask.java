package com.listen.project_backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.listen.project_backend.entity.FrameRecord;
import com.listen.project_backend.mapper.FrameRecordMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.LocalDateTime;

@Component
public class FileCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(FileCleanupTask.class);

    private final FrameRecordMapper frameRecordMapper;
    private final String savePath;
    private final int cleanupDays;

    public FileCleanupTask(FrameRecordMapper frameRecordMapper,
                           @Value("${app.image.save-path:./images}") String savePath,
                           @Value("${app.image.cleanup-days:7}") int cleanupDays) {
        this.frameRecordMapper = frameRecordMapper;
        this.savePath = savePath;
        this.cleanupDays = cleanupDays;
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void cleanOldFiles() {
        log.info("Starting file cleanup, retention: {} days", cleanupDays);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(cleanupDays);

        var wrapper = new LambdaQueryWrapper<FrameRecord>()
                .lt(FrameRecord::getCreateTime, cutoff);
        var records = frameRecordMapper.selectList(wrapper);

        int deleted = 0;
        for (FrameRecord record : records) {
            File file = new File(record.getFilePath());
            if (file.exists() && file.delete()) {
                deleted++;
                log.debug("Deleted: {}", record.getFilePath());
            }
            frameRecordMapper.deleteById(record.getId());
        }

        log.info("Cleanup finished: {} files deleted, {} DB records removed", deleted, records.size());

        cleanEmptyDirs(new File(savePath));
    }

    private void cleanEmptyDirs(File dir) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.isDirectory()) {
                cleanEmptyDirs(f);
                if (f.listFiles() != null && f.listFiles().length == 0) {
                    f.delete();
                }
            }
        }
    }
}
