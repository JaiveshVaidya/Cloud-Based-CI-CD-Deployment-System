package com.cicd.platform.service;

import com.cicd.platform.model.BuildRun;
import com.cicd.platform.model.BuildStep;
import com.cicd.platform.model.Project;
import com.cicd.platform.repository.BuildRunRepository;
import com.cicd.platform.repository.BuildStepRepository;
import com.cicd.platform.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class BuildService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private BuildRunRepository buildRunRepository;

    @Autowired
    private BuildStepRepository buildStepRepository;

    @Autowired
    @Qualifier("simulatedBuildExecutor")
    private BuildExecutor simulatedBuildExecutor;

    @Autowired
    @Qualifier("realBuildExecutor")
    private BuildExecutor realBuildExecutor;

    @Value("${app.cicd.executor:simulated}")
    private String configuredExecutor;

    @Transactional
    public BuildRun triggerBuild(Long projectId, String triggerType) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // Get latest build number for project
        Integer nextBuildNumber = buildRunRepository.findFirstByProjectOrderByBuildNumberDesc(project)
                .map(lastRun -> lastRun.getBuildNumber() + 1)
                .orElse(1);

        BuildRun buildRun = new BuildRun();
        buildRun.setProject(project);
        buildRun.setBuildNumber(nextBuildNumber);
        buildRun.setStatus("PENDING");
        buildRun.setTriggerType(triggerType);
        buildRun.setStartTime(LocalDateTime.now());

        // Generate dummy commit details for logs
        buildRun.setCommitHash(UUID.randomUUID().toString().substring(0, 7));
        buildRun.setCommitMessage("Deploy build updates for project pipeline #" + nextBuildNumber);
        buildRun.setCommitAuthor(project.getUser().getUsername());

        // Define pipeline steps
        String[] stepNames = {"CLONE", "TEST", "BUILD", "DOCKER_BUILD", "DOCKER_PUSH", "K8S_DEPLOY"};
        for (int i = 0; i < stepNames.length; i++) {
            BuildStep step = new BuildStep(stepNames[i], i);
            step.setStatus("PENDING");
            buildRun.addStep(step);
        }

        buildRun = buildRunRepository.save(buildRun);

        // Run the appropriate executor
        if ("real".equalsIgnoreCase(configuredExecutor) || "real".equalsIgnoreCase(project.getBranch())) {
            realBuildExecutor.execute(buildRun);
        } else {
            simulatedBuildExecutor.execute(buildRun);
        }

        return buildRun;
    }
}
