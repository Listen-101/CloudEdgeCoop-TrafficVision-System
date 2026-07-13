package com.listen.project_backend.service;

import java.util.Map;

public interface AiService {
    Map<String, Object> recognize(byte[] imageBytes, String streamId, Long timestamp, Long frameId);
    Map<String, Object> resetStream(String streamId);
    boolean isAvailable();
}
