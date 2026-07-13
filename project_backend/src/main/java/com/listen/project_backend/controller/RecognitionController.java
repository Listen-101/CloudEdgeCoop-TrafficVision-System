package com.listen.project_backend.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.listen.project_backend.dto.ApiResult;
import com.listen.project_backend.entity.RecognitionResult;
import com.listen.project_backend.service.RecognitionResultService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/recognition")
public class RecognitionController {

    private final RecognitionResultService recognitionResultService;

    public RecognitionController(RecognitionResultService recognitionResultService) {
        this.recognitionResultService = recognitionResultService;
    }

    @GetMapping("/list")
    public ApiResult<Map<String, Object>> list(
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) Long frameId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<RecognitionResult> result;
        if (frameId != null) {
            result = recognitionResultService.listByFrameId(frameId, page, size);
        } else if (deviceId != null) {
            result = recognitionResultService.listByDevice(deviceId, page, size);
        } else {
            return ApiResult.error(400, "deviceId or frameId required");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("records", result.getRecords());
        data.put("total", result.getTotal());
        data.put("page", result.getCurrent());
        data.put("size", result.getSize());
        return ApiResult.success(data);
    }
}
