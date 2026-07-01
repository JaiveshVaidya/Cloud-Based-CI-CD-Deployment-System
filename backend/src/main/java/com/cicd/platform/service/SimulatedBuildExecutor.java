package com.cicd.platform.service;

import com.cicd.platform.model.BuildRun;
import com.cicd.platform.model.BuildStep;
import com.cicd.platform.model.Project;
import com.cicd.platform.repository.BuildRunRepository;
import com.cicd.platform.repository.BuildStepRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service("simulatedBuildExecutor")
public class SimulatedBuildExecutor implements BuildExecutor {

    private static final Logger logger = LoggerFactory.getLogger(SimulatedBuildExecutor.class);

    @Autowired
    private BuildRunRepository buildRunRepository;

    @Autowired
    private BuildStepRepository buildStepRepository;

    @Autowired
    private LogStreamHandler logStreamHandler;

    @Override
    public void execute(BuildRun buildRun) {
        // Run in a background process
        new Thread(() -> {
            try {
                runPipeline(buildRun);
            } catch (Exception e) {
                logger.error("Simulation run failed", e);
            }
        }).start();
    }

    private void runPipeline(BuildRun buildRun) {
        Long buildId = buildRun.getId();
        Project project = buildRun.getProject();
        
        logger.info("Starting simulated build run for build ID: {}", buildId);
        
        // Update BuildRun to RUNNING
        buildRun.setStatus("RUNNING");
        buildRun.setStartTime(LocalDateTime.now());
        buildRun = buildRunRepository.save(buildRun);
        
        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;36m[SYSTEM] Starting pipeline run #" + buildRun.getBuildNumber() + "...\u001B[0m");
        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;30m[SYSTEM] Git repository: " + project.getGitRepoUrl() + " [" + project.getBranch() + "]\u001B[0m");
        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;30m[SYSTEM] Registry: " + project.getDockerRegistry() + " | K8s Namespace: " + project.getK8sNamespace() + "\u001B[0m");
        logStreamHandler.appendAndBroadcast(buildId, "--------------------------------------------------");

        List<BuildStep> steps = buildRun.getSteps();
        boolean failed = false;

        for (BuildStep step : steps) {
            if (failed) {
                step.setStatus("SKIPPED");
                buildStepRepository.save(step);
                logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;30m[INFO] [" + step.getName() + "] Step SKIPPED.\u001B[0m");
                continue;
            }

            // Execute Step
            step.setStatus("RUNNING");
            step.setStartTime(LocalDateTime.now());
            step = buildStepRepository.save(step);

            logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;33m>>> Stage: " + step.getName() + " [RUNNING]\u001B[0m");
            
            // Run the specific step logs
            boolean stepSuccess = executeStepLogic(buildId, step, project);

            step.setEndTime(LocalDateTime.now());
            step.setDuration(Duration.between(step.getStartTime(), step.getEndTime()).toSeconds());
            
            if (stepSuccess) {
                step.setStatus("SUCCESS");
                buildStepRepository.save(step);
                logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;32m<<< Stage: " + step.getName() + " [SUCCESS] (" + step.getDuration() + "s)\u001B[0m");
            } else {
                step.setStatus("FAILED");
                buildStepRepository.save(step);
                logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m<<< Stage: " + step.getName() + " [FAILED] (" + step.getDuration() + "s)\u001B[0m");
                failed = true;
            }
            logStreamHandler.appendAndBroadcast(buildId, "--------------------------------------------------");
        }

        // Finalize BuildRun
        buildRun = buildRunRepository.findById(buildId).orElse(buildRun);
        buildRun.setEndTime(LocalDateTime.now());
        buildRun.setDuration(Duration.between(buildRun.getStartTime(), buildRun.getEndTime()).toSeconds());
        
        if (failed) {
            buildRun.setStatus("FAILED");
            logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[SYSTEM] Pipeline finished with status: FAILED (Duration: " + buildRun.getDuration() + "s)\u001B[0m");
        } else {
            buildRun.setStatus("SUCCESS");
            logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;32m[SYSTEM] Pipeline finished with status: SUCCESS (Duration: " + buildRun.getDuration() + "s)\u001B[0m");
        }
        buildRunRepository.save(buildRun);
    }

    private boolean executeStepLogic(Long buildId, BuildStep step, Project project) {
        try {
            switch (step.getName()) {
                case "CLONE":
                    logStreamHandler.appendAndBroadcast(buildId, "Cloning git repository: " + project.getGitRepoUrl() + "...");
                    Thread.sleep(1000);
                    logStreamHandler.appendAndBroadcast(buildId, "VCS Credentials resolved. Using OAuth deployment token.");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "remote: Enumerating objects: 142, done.");
                    logStreamHandler.appendAndBroadcast(buildId, "remote: Counting objects: 100% (142/142), done.");
                    logStreamHandler.appendAndBroadcast(buildId, "remote: Compressing objects: 100% (89/89), done.");
                    logStreamHandler.appendAndBroadcast(buildId, "Receiving objects: 100% (142/142), 240.23 KiB | 2.12 MiB/s, done.");
                    logStreamHandler.appendAndBroadcast(buildId, "Resolving deltas: 100% (54/54), done.");
                    Thread.sleep(500);
                    logStreamHandler.appendAndBroadcast(buildId, "Checking out branch: origin/" + project.getBranch());
                    logStreamHandler.appendAndBroadcast(buildId, "HEAD is now at 8f2c3d1 Merge pull request #14 from main/feature-oauth");
                    return true;

                case "TEST":
                    logStreamHandler.appendAndBroadcast(buildId, "Running Maven test suites...");
                    Thread.sleep(1200);
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Scanning for projects...");
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] --- maven-surefire-plugin:3.2.5:test (default-test) @ platform ---");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Running com.cicd.platform.security.AuthServiceTests");
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time: 0.9s - AuthServices");
                    Thread.sleep(1000);

                    // Check if failure should be simulated (e.g. branch is 'fail')
                    if ("fail".equalsIgnoreCase(project.getBranch())) {
                        logStreamHandler.appendAndBroadcast(buildId, "[INFO] Running com.cicd.platform.deployment.DeploymentTests");
                        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[ERROR] testConnectRepository - Expected: CONNECTED, Actual: TIMEOUT\u001B[0m");
                        logStreamHandler.appendAndBroadcast(buildId, "[INFO] Tests run: 3, Failures: 1, Errors: 0, Skipped: 0, Time: 1.5s");
                        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[INFO] ------------------------------------------------------------------------\u001B[0m");
                        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[INFO] BUILD FAILURE\u001B[0m");
                        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[INFO] ------------------------------------------------------------------------\u001B[0m");
                        return false;
                    }

                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Running com.cicd.platform.controller.ProjectControllerTests");
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time: 0.4s");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] All 10 tests passed successfully.");
                    return true;

                case "BUILD":
                    logStreamHandler.appendAndBroadcast(buildId, "Compiling and packaging project binary...");
                    Thread.sleep(1000);
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] --- maven-resources-plugin:3.3.1:resources (default-resources) @ platform ---");
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] --- maven-compiler-plugin:3.13.0:compile (default-compile) @ platform ---");
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Recompiling the module");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] --- maven-jar-plugin:3.4.1:jar (default-jar) @ platform ---");
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Building jar: /workspace/target/" + project.getName().toLowerCase() + "-0.0.1-SNAPSHOT.jar");
                    Thread.sleep(500);
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] --- spring-boot-maven-plugin:3.3.4:repackage (repackage) @ platform ---");
                    logStreamHandler.appendAndBroadcast(buildId, "[INFO] Replacing main artifact with repackaged archive");
                    logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;32m[INFO] BUILD SUCCESS\u001B[0m");
                    return true;

                case "DOCKER_BUILD":
                    String imgName = project.getDockerImageName() != null ? project.getDockerImageName() : project.getName().toLowerCase();
                    String registry = project.getDockerRegistry() != null ? project.getDockerRegistry() : "docker.io/library";
                    String tag = registry + "/" + imgName + ":latest";

                    logStreamHandler.appendAndBroadcast(buildId, "Sending build context to Docker daemon 42.5MB...");
                    Thread.sleep(1000);
                    logStreamHandler.appendAndBroadcast(buildId, "Step 1/5 : FROM eclipse-temurin:21-jre-alpine");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> 3db54e58b8f2");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "Step 2/5 : COPY target/*.jar app.jar");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> 7a462edb32f1");
                    Thread.sleep(600);
                    logStreamHandler.appendAndBroadcast(buildId, "Step 3/5 : EXPOSE 8080");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> Running in a2bf12cc11e0");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> Removed intermediate container a2bf12cc11e0");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> 2f4b5ed314ab");
                    logStreamHandler.appendAndBroadcast(buildId, "Step 4/5 : ENTRYPOINT [\"java\", \"-jar\", \"/app.jar\"]");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> Running in f42db5ee5572");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> Removed intermediate container f42db5ee5572");
                    logStreamHandler.appendAndBroadcast(buildId, " ---> b4d3345efba1");
                    Thread.sleep(500);
                    logStreamHandler.appendAndBroadcast(buildId, "Successfully built image tag: " + tag);
                    return true;

                case "DOCKER_PUSH":
                    String imageTag = (project.getDockerRegistry() != null ? project.getDockerRegistry() : "docker.io/library") + "/" +
                            (project.getDockerImageName() != null ? project.getDockerImageName() : project.getName().toLowerCase()) + ":latest";
                    logStreamHandler.appendAndBroadcast(buildId, "Connecting to Docker registry: " + (project.getDockerRegistry() != null ? project.getDockerRegistry() : "docker.io"));
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "The push refers to repository [" + imageTag + "]");
                    logStreamHandler.appendAndBroadcast(buildId, "3db54e58b8f2: Preparing");
                    logStreamHandler.appendAndBroadcast(buildId, "7a462edb32f1: Preparing");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "7a462edb32f1: Pushing [=========>                                 ] 12.3MB/42.5MB");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "7a462edb32f1: Pushing [==========================>                       ] 28.5MB/42.5MB");
                    Thread.sleep(600);
                    logStreamHandler.appendAndBroadcast(buildId, "7a462edb32f1: Pushed");
                    logStreamHandler.appendAndBroadcast(buildId, "3db54e58b8f2: Pushed");
                    logStreamHandler.appendAndBroadcast(buildId, "latest: digest: sha256:d8c5f3e2b1a8d7c6f5e4d3c2b1a0e9f8... size: 1254");
                    logStreamHandler.appendAndBroadcast(buildId, "Image pushed successfully.");
                    return true;

                case "K8S_DEPLOY":
                    logStreamHandler.appendAndBroadcast(buildId, "Establishing connection to Kubernetes API Server...");
                    Thread.sleep(1000);
                    logStreamHandler.appendAndBroadcast(buildId, "Context resolved: AWS EKS Cluster (k8s.cicd-platform.com)");
                    logStreamHandler.appendAndBroadcast(buildId, "Namespace: " + project.getK8sNamespace());
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "Applying deployment manifest: k8s/deployment.yaml");
                    logStreamHandler.appendAndBroadcast(buildId, "deployment.apps/" + project.getName().toLowerCase() + "-deployment configured");
                    logStreamHandler.appendAndBroadcast(buildId, "Applying service manifest: k8s/service.yaml");
                    logStreamHandler.appendAndBroadcast(buildId, "service/" + project.getName().toLowerCase() + "-service configured");
                    Thread.sleep(1000);
                    logStreamHandler.appendAndBroadcast(buildId, "Running rollout check: kubectl rollout status deployment/" + project.getName().toLowerCase() + "-deployment -n " + project.getK8sNamespace());
                    logStreamHandler.appendAndBroadcast(buildId, "Waiting for deployment rollout to finish: 0 of 2 updated replicas are available...");
                    Thread.sleep(1000);
                    logStreamHandler.appendAndBroadcast(buildId, "Waiting for deployment rollout to finish: 1 of 2 updated replicas are available...");
                    Thread.sleep(800);
                    logStreamHandler.appendAndBroadcast(buildId, "deployment/" + project.getName().toLowerCase() + "-deployment successfully rolled out.");
                    logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;32mDeployment successfully synchronized.\u001B[0m");
                    return true;
            }
        } catch (InterruptedException e) {
            logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[ERROR] Execution interrupted: " + e.getMessage() + "\u001B[0m");
            Thread.currentThread().interrupt();
        }
        return false;
    }
}
