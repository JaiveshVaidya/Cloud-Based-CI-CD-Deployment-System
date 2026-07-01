package com.cicd.platform.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "build_runs")
public class BuildRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnoreProperties({"user", "gitToken"})
    private Project project;

    @Column(name = "build_number", nullable = false)
    private Integer buildNumber;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, RUNNING, SUCCESS, FAILED

    @Column(name = "trigger_type", nullable = false)
    private String triggerType = "MANUAL"; // MANUAL, WEBHOOK

    @Column(name = "commit_hash")
    private String commitHash;

    @Column(name = "commit_message")
    private String commitMessage;

    @Column(name = "commit_author")
    private String commitAuthor;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private Long duration; // in seconds

    @OneToMany(mappedBy = "buildRun", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("orderIndex ASC")
    @JsonIgnoreProperties("buildRun")
    private List<BuildStep> steps = new ArrayList<>();

    public BuildRun() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Integer getBuildNumber() {
        return buildNumber;
    }

    public void setBuildNumber(Integer buildNumber) {
        this.buildNumber = buildNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public void setTriggerType(String triggerType) {
        this.triggerType = triggerType;
    }

    public String getCommitHash() {
        return commitHash;
    }

    public void setCommitHash(String commitHash) {
        this.commitHash = commitHash;
    }

    public String getCommitMessage() {
        return commitMessage;
    }

    public void setCommitMessage(String commitMessage) {
        this.commitMessage = commitMessage;
    }

    public String getCommitAuthor() {
        return commitAuthor;
    }

    public void setCommitAuthor(String commitAuthor) {
        this.commitAuthor = commitAuthor;
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

    public List<BuildStep> getSteps() {
        return steps;
    }

    public void setSteps(List<BuildStep> steps) {
        this.steps = steps;
    }

    public void addStep(BuildStep step) {
        steps.add(step);
        step.setBuildRun(this);
    }
}
