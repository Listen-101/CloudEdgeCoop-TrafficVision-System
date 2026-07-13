package com.listen.project_backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.listen.project_backend.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class AiServiceImpl implements AiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);

    private final ObjectMapper objectMapper;
    private final String pythonUrl;

    public AiServiceImpl(@Value("${app.ai.python-url:http://127.0.0.1:5000}") String pythonUrl) {
        this.objectMapper = new ObjectMapper();
        this.pythonUrl = pythonUrl;
    }

    @Override
    public boolean isAvailable() {
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(pythonUrl + "/api/health").toURL().openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public Map<String, Object> recognize(byte[] imageBytes, String streamId, Long timestamp, Long frameId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("image", Base64.getEncoder().encodeToString(imageBytes));
            payload.put("stream_id", streamId);
            payload.put("deviceId", streamId);
            if (timestamp != null) payload.put("timestamp", timestamp);
            if (frameId != null) payload.put("frame_id", frameId);
            payload.put("modules", java.util.Arrays.asList("tracking", "plate"));

            String json = objectMapper.writeValueAsString(payload);
            byte[] jsonBytes = json.getBytes(StandardCharsets.UTF_8);
            log.info("Sending {} bytes to AI bridge", jsonBytes.length);

            HttpURLConnection conn = (HttpURLConnection) URI.create(pythonUrl + "/api/recognize").toURL().openConnection();
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            conn.setFixedLengthStreamingMode(jsonBytes.length);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(60000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBytes);
            }

            int status = conn.getResponseCode();
            if (status == 200) {
                try (InputStream is = conn.getInputStream()) {
                    String response = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    return objectMapper.readValue(response, Map.class);
                }
            } else {
                try (InputStream es = conn.getErrorStream()) {
                    String err = es != null ? new String(es.readAllBytes(), StandardCharsets.UTF_8) : "no body";
                    log.error("AI bridge returned {}: {}", status, err);
                }
            }
        } catch (Exception e) {
            log.error("AI recognition failed: {}", e.getMessage());
        }
        return null;
    }

    @Override
    public Map<String, Object> resetStream(String streamId) {
        try {
            Map<String, String> body = Map.of("stream_id", streamId);
            String json = objectMapper.writeValueAsString(body);
            byte[] jsonBytes = json.getBytes(StandardCharsets.UTF_8);

            HttpURLConnection conn = (HttpURLConnection) URI.create(pythonUrl + "/api/reset-stream").toURL().openConnection();
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            conn.setFixedLengthStreamingMode(jsonBytes.length);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBytes);
            }

            if (conn.getResponseCode() == 200) {
                try (InputStream is = conn.getInputStream()) {
                    String response = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    return objectMapper.readValue(response, Map.class);
                }
            }
        } catch (Exception e) {
            log.error("Reset stream failed: {}", e.getMessage());
        }
        return null;
    }
}
