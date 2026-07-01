package com.cicd.platform.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "build_steps")
public class BuildStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "build_run_id", nullable = false)
    @JsonIgnoreProperties("steps")
    private BuildRun buildRun;

    @Column(nullable = false)
    private String name; // CLONE, TEST, BUILD, DOCKER_BUILD, DOCKER_PUSH, K8S_DEPLOY

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, RUNNING, SUCCESS, FAILED, SKIPPED

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private Long duration; // in seconds

    @Column(name = "log_path")
    private String logPath;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    public BuildStep() {
    }

    public BuildStep(String name, Integer orderIndex) {
        this.name = name;
        this.orderIndex = orderIndex;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BuildRun getBuildRun() {
        return buildRun;
    }

    public void setBuildRun(BuildRun buildRun) {
        this.buildRun = buildRun;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Long getDuration() {
        return duration;
    }

    public void setDuration(Long duration) {
        this.duration = duration;
    }

    public String getLogPath() {
        return logPath;
    }

    public void setLogPath(String logPath) {
        this.logPath = logPath;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
}
