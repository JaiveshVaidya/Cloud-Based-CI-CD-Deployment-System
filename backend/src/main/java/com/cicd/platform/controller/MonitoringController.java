package com.cicd.platform.controller;

import com.cicd.platform.service.MonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/monitoring")
public class MonitoringController {

    @Autowired
    private MonitoringService monitoringService;

    @GetMapping("/metrics")
    public ResponseEntity<MonitoringService.SystemMetrics> getMetrics() {
        return ResponseEntity.ok(monitoringService.getLiveSystemMetrics());
    }

    @GetMapping("/pods")
    public ResponseEntity<List<MonitoringService.PodStatus>> getPods(
            @RequestParam(defaultValue = "default") String namespace,
            @RequestParam(required = false) String projectName) {
        return ResponseEntity.ok(monitoringService.getKubernetesPods(namespace, projectName));
    }
}
