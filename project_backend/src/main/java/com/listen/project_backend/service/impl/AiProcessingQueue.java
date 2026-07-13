package com.listen.project_backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.listen.project_backend.entity.FrameRecord;
import com.listen.project_backend.entity.RecognitionResult;
import com.listen.project_backend.service.AiService;
import com.listen.project_backend.service.RecognitionResultService;
import com.listen.project_backend.websocket.DeviceWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
public class AiProcessingQueue {

    private static final Logger log = LoggerFactory.getLogger(AiProcessingQueue.class);

    private final AiService aiService;
    private final RecognitionResultService recognitionResultService;
    private final DeviceWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor = Executors.newFixedThreadPool(2);

    public AiProcessingQueue(AiService aiService,
                             RecognitionResultService recognitionResultService,
                             DeviceWebSocketHandler webSocketHandler) {
        this.aiService = aiService;
        this.recognitionResultService = recognitionResultService;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = new ObjectMapper();
    }

    public void submit(FrameRecord frame) {
        executor.submit(() -> process(frame));
    }

    private void process(FrameRecord frame) {
        try {
            java.io.File file = new java.io.File(frame.getFilePath());
            if (!file.exists()) {
                log.warn("Image file not found for AI: {}", frame.getFilePath());
                return;
            }

            byte[] imageBytes = java.nio.file.Files.readAllBytes(file.toPath());

            long timestamp = frame.getTimestamp() != null
                    ? frame.getTimestamp().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
                    : System.currentTimeMillis();

            Map<String, Object> aiResult = aiService.recognize(
                    imageBytes, frame.getDeviceId(), timestamp, frame.getId());

            if (aiResult == null || !"ok".equals(aiResult.get("status"))) {
                log.debug("AI returned no results for frame {}", frame.getId());
                return;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> results = (Map<String, Object>) aiResult.get("results");
            if (results == null) return;

            // Process tracking annotations
            processAnnotations(frame, results, "vehicle_tracking", "tracking");

            // Process plate recognition
            processAnnotations(frame, results, "license_plate_recognition", "plate");

            // Push result to device via WebSocket
            pushToDevice(frame);

        } catch (Exception e) {
            log.error("AI processing error for frame {}: {}", frame.getId(), e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void processAnnotations(FrameRecord frame, Map<String, Object> results,
                                     String key, String resultType) {
        Map<String, Object> moduleResult = (Map<String, Object>) results.get(key);
        if (moduleResult == null) return;

        List<Map<String, Object>> annotations = (List<Map<String, Object>>) moduleResult.get("annotations");
        if (annotations == null) return;

        for (Map<String, Object> ann : annotations) {
            RecognitionResult record = new RecognitionResult();
            record.setFrameId(frame.getId());
            record.setDeviceId(frame.getDeviceId());

            String annType = (String) ann.get("annotation_type");
            if ("license_plate".equals(annType)) {
                record.setPlateNumber((String) ann.get("text"));
                Object conf = ann.get("text_confidence");
                if (conf instanceof Number) record.setConfidence(((Number) conf).doubleValue());
            }

            if ("vehicle_detection".equals(annType) || annType == null) {
                record.setVehicleType((String) ann.get("class_name"));
                Object conf = ann.get("confidence");
                if (conf instanceof Number) record.setConfidence(((Number) conf).doubleValue());
            }

            record.setAlertType("正常");
            record.setResultData(writeJson(ann));
            record.setCreateTime(LocalDateTime.now());

            recognitionResultService.save(record);
        }
    }

    private void pushToDevice(FrameRecord frame) {
        try {
            var results = recognitionResultService.listByFrameId(frame.getId(), 1, 20);
            if (results.getTotal() > 0) {
                Map<String, Object> msg = Map.of(
                        "type", "recognition",
                        "frameId", frame.getId(),
                        "deviceId", frame.getDeviceId(),
                        "fileName", frame.getFileName(),
                        "results", results.getRecords()
                );
                webSocketHandler.sendMessage(frame.getDeviceId(), msg);
            }
        } catch (Exception e) {
            log.error("Failed to push recognition to device: {}", e.getMessage());
        }
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}
