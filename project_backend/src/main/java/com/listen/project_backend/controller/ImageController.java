package com.listen.project_backend.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.listen.project_backend.dto.ApiResult;
import com.listen.project_backend.entity.FrameRecord;
import com.listen.project_backend.service.FrameRecordService;
import com.listen.project_backend.service.ImageService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/image")
public class ImageController {

    private final ImageService imageService;
    private final FrameRecordService frameRecordService;

    public ImageController(ImageService imageService, FrameRecordService frameRecordService) {
        this.imageService = imageService;
        this.frameRecordService = frameRecordService;
    }

    @PostMapping("/upload")
    public ApiResult<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("deviceId") String deviceId,
            @RequestParam(value = "timestamp", required = false) Long timestamp) {

        if (file.isEmpty()) {
            return ApiResult.error(400, "文件为空");
        }

        FrameRecord record = imageService.save(file, deviceId, timestamp);

        Map<String, Object> data = new HashMap<>();
        data.put("frameId", record.getId());
        data.put("fileName", record.getFileName());
        return ApiResult.success(data);
    }

    @GetMapping("/list")
    public ApiResult<Map<String, Object>> list(
            @RequestParam String deviceId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<FrameRecord> result = frameRecordService.listByDevice(deviceId, page, size);

        Map<String, Object> data = new HashMap<>();
        data.put("records", result.getRecords());
        data.put("total", result.getTotal());
        data.put("page", result.getCurrent());
        data.put("size", result.getSize());
        return ApiResult.success(data);
    }
}
