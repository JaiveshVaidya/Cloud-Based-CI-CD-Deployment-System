package com.cicd.platform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LogStreamHandler extends TextWebSocketHandler {
    private static final Logger logger = LoggerFactory.getLogger(LogStreamHandler.class);

    // Map of buildId -> Set of Web Socket Sessions
    private final Map<Long, Set<WebSocketSession>> buildSessions = new ConcurrentHashMap<>();

    private static final String LOGS_DIR = "./logs/builds";

    public LogStreamHandler() {
        File dir = new File(LOGS_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long buildId = getBuildId(session);
        if (buildId != null) {
            buildSessions.computeIfAbsent(buildId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>()))
                    .add(session);
            
            logger.info("WebSocket connection established for build: {}", buildId);
            
            // Replay historical logs to the newly connected user
            sendHistoricalLogs(session, buildId);
        } else {
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long buildId = getBuildId(session);
        if (buildId != null) {
            Set<WebSocketSession> sessions = buildSessions.get(buildId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    buildSessions.remove(buildId);
                }
            }
            logger.info("WebSocket connection closed for build: {}", buildId);
        }
    }

    private Long getBuildId(WebSocketSession session) {
        try {
            String query = session.getUri().getQuery();
            if (query != null) {
                String[] params = query.split("&");
                for (String param : params) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2 && keyValue[0].equalsIgnoreCase("buildId")) {
                        return Long.parseLong(keyValue[1]);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to parse buildId from connection URI: {}", e.getMessage());
        }
        return null;
    }

    private void sendHistoricalLogs(WebSocketSession session, Long buildId) {
        String logPath = LOGS_DIR + "/build_" + buildId + ".log";
        File logFile = new File(logPath);
        if (logFile.exists()) {
            try {
                Files.lines(Paths.get(logPath)).forEach(line -> {
                    try {
                        session.sendMessage(new TextMessage(line));
                    } catch (IOException e) {
                        logger.error("Error sending historical log line to session: {}", e.getMessage());
                    }
                });
            } catch (IOException e) {
                logger.error("Error reading historical logs for build {}: {}", buildId, e.getMessage());
            }
        }
    }

    public void appendAndBroadcast(Long buildId, String logLine) {
        // 1. Write to file
        String logPath = LOGS_DIR + "/build_" + buildId + ".log";
        try (FileWriter fw = new FileWriter(logPath, true);
             PrintWriter pw = new PrintWriter(fw)) {
            pw.println(logLine);
        } catch (IOException e) {
            logger.error("Failed to write log to file for build {}: {}", buildId, e.getMessage());
        }

        // 2. Broadcast to all active WebSocket sessions
        Set<WebSocketSession> sessions = buildSessions.get(buildId);
        if (sessions != null) {
            TextMessage message = new TextMessage(logLine);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                    } catch (IOException e) {
                        logger.error("Failed to stream log message to session: {}", e.getMessage());
                    }
                }
            }
        }
    }

    public String getLogFilePath(Long buildId) {
        return LOGS_DIR + "/build_" + buildId + ".log";
    }

    public String getLogsContent(Long buildId) {
        String logPath = getLogFilePath(buildId);
        File logFile = new File(logPath);
        if (!logFile.exists()) {
            return "No logs available for this build.";
        }
        try {
            return new String(Files.readAllBytes(Paths.get(logPath)));
        } catch (IOException e) {
            logger.error("Failed to read log content for build: {}", buildId, e.getMessage());
            return "Error reading log content: " + e.getMessage();
        }
    }
}
