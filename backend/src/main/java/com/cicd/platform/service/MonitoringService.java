package com.cicd.platform.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class MonitoringService {

    private final Random random = new Random();

    // DTO records
    public record SystemMetrics(double cpuUsage, double memoryUsage, double diskUsage, double networkRx, double networkTx) {}
    public record PodStatus(String name, String status, int restarts, String age, String cpu, String memory) {}

    public SystemMetrics getLiveSystemMetrics() {
        // Mocking dynamic values that fluctuate realistically
        double cpu = 20.0 + random.nextDouble() * 15.0; // 20% - 35%
        double memory = 55.0 + random.nextDouble() * 5.0; // 55% - 60%
        double disk = 42.1; // static mostly
        double rx = 1.5 + random.nextDouble() * 2.0; // MB/s
        double tx = 0.8 + random.nextDouble() * 1.5; // MB/s

        return new SystemMetrics(
                Math.round(cpu * 100.0) / 100.0,
                Math.round(memory * 100.0) / 100.0,
                Math.round(disk * 100.0) / 100.0,
                Math.round(rx * 100.0) / 100.0,
                Math.round(tx * 100.0) / 100.0
        );
    }

    public List<PodStatus> getKubernetesPods(String namespace, String projectName) {
        String baseName = (projectName != null ? projectName.toLowerCase() : "app");
        List<PodStatus> pods = new ArrayList<>();
        
        // Add frontend pod
        pods.add(new PodStatus(
                baseName + "-frontend-" + generateRandomHash(),
                "Running",
                0,
                "2d 4h",
                (10 + random.nextInt(15)) + "m",
                (45 + random.nextInt(10)) + "Mi"
        ));

        // Add backend pods (2 replicas)
        pods.add(new PodStatus(
                baseName + "-backend-" + generateRandomHash(),
                "Running",
                1,
                "5d 12h",
                (40 + random.nextInt(30)) + "m",
                (180 + random.nextInt(30)) + "Mi"
        ));
        
        pods.add(new PodStatus(
                baseName + "-backend-" + generateRandomHash(),
                "Running",
                0,
                "2d 4h",
                (35 + random.nextInt(25)) + "m",
                (175 + random.nextInt(20)) + "Mi"
        ));

        // Add database pod
        pods.add(new PodStatus(
                baseName + "-postgres-0",
                "Running",
                0,
                "10d",
                (15 + random.nextInt(10)) + "m",
                (256 + random.nextInt(40)) + "Mi"
        ));

        return pods;
    }

    private String generateRandomHash() {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        sb.append("-");
        for (int i = 0; i < 5; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
