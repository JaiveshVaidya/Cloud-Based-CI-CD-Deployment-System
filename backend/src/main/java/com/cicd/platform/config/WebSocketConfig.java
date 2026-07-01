package com.cicd.platform.config;

import com.cicd.platform.service.LogStreamHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final LogStreamHandler logStreamHandler;

    public WebSocketConfig(LogStreamHandler logStreamHandler) {
        this.logStreamHandler = logStreamHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(logStreamHandler, "/ws/logs")
                .setAllowedOrigins("*");
    }
}
