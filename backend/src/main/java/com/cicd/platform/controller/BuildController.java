package com.cicd.platform.controller;

import com.cicd.platform.model.BuildRun;
import com.cicd.platform.model.Project;
import com.cicd.platform.model.User;
import com.cicd.platform.repository.BuildRunRepository;
import com.cicd.platform.repository.ProjectRepository;
import com.cicd.platform.service.BuildService;
import com.cicd.platform.service.LogStreamHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/builds")
public class BuildController {

    @Autowired
    private BuildService buildService;

    @Autowired
    private BuildRunRepository buildRunRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private LogStreamHandler logStreamHandler;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/trigger")
    public ResponseEntity<BuildRun> triggerBuild(@RequestParam Long projectId, @RequestParam(defaultValue = "MANUAL") String triggerType) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (!project.getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.status(403).build();
        }

        BuildRun run = buildService.triggerBuild(projectId, triggerType);
        return ResponseEntity.ok(run);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<BuildRun>> getBuildsForProject(@PathVariable Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (!project.getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.status(403).build();
        }

        List<BuildRun> runs = buildRunRepository.findByProjectOrderByBuildNumberDesc(project);
        return ResponseEntity.ok(runs);
    }

    @GetMapping("/{buildId}")
    public ResponseEntity<BuildRun> getBuildById(@PathVariable Long buildId) {
        BuildRun run = buildRunRepository.findById(buildId)
                .orElseThrow(() -> new IllegalArgumentException("Build run not found: " + buildId));

        if (!run.getProject().getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(run);
    }

    @GetMapping("/{buildId}/logs")
    public ResponseEntity<String> getBuildLogs(@PathVariable Long buildId) {
        BuildRun run = buildRunRepository.findById(buildId)
                .orElseThrow(() -> new IllegalArgumentException("Build run not found: " + buildId));

        if (!run.getProject().getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.status(403).build();
        }

        String logs = logStreamHandler.getLogsContent(buildId);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getBuildStats() {
        Long userId = getCurrentUser().getId();

        Long totalBuilds = buildRunRepository.countByUserId(userId);
        Long successBuilds = buildRunRepository.countByUserIdAndStatus(userId, "SUCCESS");
        Long failedBuilds = buildRunRepository.countByUserIdAndStatus(userId, "FAILED");
        Long runningBuilds = buildRunRepository.countByUserIdAndStatus(userId, "RUNNING");
        Long pendingBuilds = buildRunRepository.countByUserIdAndStatus(userId, "PENDING");

        List<BuildRun> latestRuns = buildRunRepository.findLatestBuildsByUser(userId);
        if (latestRuns.size() > 5) {
            latestRuns = latestRuns.subList(0, 5);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBuilds", totalBuilds);
        stats.put("successBuilds", successBuilds);
        stats.put("failedBuilds", failedBuilds);
        stats.put("activeBuilds", runningBuilds + pendingBuilds);
        stats.put("latestRuns", latestRuns);

        return ResponseEntity.ok(stats);
    }
}
