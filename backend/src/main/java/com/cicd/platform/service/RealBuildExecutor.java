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

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service("realBuildExecutor")
public class RealBuildExecutor implements BuildExecutor {

    private static final Logger logger = LoggerFactory.getLogger(RealBuildExecutor.class);

    @Autowired
    private BuildRunRepository buildRunRepository;

    @Autowired
    private BuildStepRepository buildStepRepository;

    @Autowired
    private LogStreamHandler logStreamHandler;

    @Override
    public void execute(BuildRun buildRun) {
        new Thread(() -> {
            try {
                runPipeline(buildRun);
            } catch (Exception e) {
                logger.error("Real pipeline run failed", e);
            }
        }).start();
    }

    private void runPipeline(BuildRun buildRun) {
        Long buildId = buildRun.getId();
        Project project = buildRun.getProject();

        logger.info("Starting real shell-command build run for build ID: {}", buildId);

        buildRun.setStatus("RUNNING");
        buildRun.setStartTime(LocalDateTime.now());
        buildRun = buildRunRepository.save(buildRun);

        logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;36m[SYSTEM] Starting real pipeline run #" + buildRun.getBuildNumber() + "...\u001B[0m");

        List<BuildStep> steps = buildRun.getSteps();
        boolean failed = false;

        // Base build directory
        String buildDirPath = "./builds/workspace_" + buildId;
        File buildDir = new File(buildDirPath);
        if (!buildDir.exists()) {
            buildDir.mkdirs();
        }

        for (BuildStep step : steps) {
            if (failed) {
                step.setStatus("SKIPPED");
                buildStepRepository.save(step);
                logStreamHandler.appendAndBroadcast(buildId, "[INFO] [" + step.getName() + "] Step SKIPPED.");
                continue;
            }

            step.setStatus("RUNNING");
            step.setStartTime(LocalDateTime.now());
            step = buildStepRepository.save(step);

            logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;33m>>> Stage: " + step.getName() + " [RUNNING]\u001B[0m");

            boolean stepSuccess = runShellCommand(buildId, step, project, buildDir);

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

    private boolean runShellCommand(Long buildId, BuildStep step, Project project, File workDir) {
        String[] cmd;
        String os = System.getProperty("os.name").toLowerCase();
        boolean isWindows = os.contains("win");

        // Formulate commands based on step
        switch (step.getName()) {
            case "CLONE":
                if (isWindows) {
                    cmd = new String[]{"powershell.exe", "-Command", "git clone " + project.getGitRepoUrl() + " . --branch " + project.getBranch()};
                } else {
                    cmd = new String[]{"sh", "-c", "git clone " + project.getGitRepoUrl() + " . --branch " + project.getBranch()};
                }
                break;
            case "TEST":
                if (isWindows) {
                    cmd = new String[]{"powershell.exe", "-Command", "mvn test"};
                } else {
                    cmd = new String[]{"sh", "-c", "mvn test"};
                }
                break;
            case "BUILD":
                if (isWindows) {
                    cmd = new String[]{"powershell.exe", "-Command", "mvn package -DskipTests"};
                } else {
                    cmd = new String[]{"sh", "-c", "mvn package -DskipTests"};
                }
                break;
            case "DOCKER_BUILD":
                String imgName = project.getDockerImageName() != null ? project.getDockerImageName() : project.getName().toLowerCase();
                String registry = project.getDockerRegistry() != null ? project.getDockerRegistry() : "docker.io";
                String tag = registry + "/" + imgName + ":latest";
                
                if (isWindows) {
                    cmd = new String[]{"powershell.exe", "-Command", "docker build -t " + tag + " ."};
                } else {
                    cmd = new String[]{"sh", "-c", "docker build -t " + tag + " ."};
                }
                break;
            case "DOCKER_PUSH":
                String pushTag = (project.getDockerRegistry() != null ? project.getDockerRegistry() : "docker.io") + "/" +
                        (project.getDockerImageName() != null ? project.getDockerImageName() : project.getName().toLowerCase()) + ":latest";
                if (isWindows) {
                    cmd = new String[]{"powershell.exe", "-Command", "docker push " + pushTag};
                } else {
                    cmd = new String[]{"sh", "-c", "docker push " + pushTag};
                }
                break;
            case "K8S_DEPLOY":
                if (isWindows) {
                    cmd = new String[]{"powershell.exe", "-Command", "kubectl apply -f k8s/ -n " + project.getK8sNamespace()};
                } else {
                    cmd = new String[]{"sh", "-c", "kubectl apply -f k8s/ -n " + project.getK8sNamespace()};
                }
                break;
            default:
                logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[ERROR] Unknown step: " + step.getName() + "\u001B[0m");
                return false;
        }

        try {
            logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;30mExecuting command: " + String.join(" ", cmd) + "\u001B[0m");
            
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(workDir);
            pb.redirectErrorStream(true); // combine stdout and stderr
            
            Process process = pb.start();
            
            // Read output stream
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logStreamHandler.appendAndBroadcast(buildId, line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                return true;
            } else {
                logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[ERROR] Command exited with non-zero exit code: " + exitCode + "\u001B[0m");
                return false;
            }
        } catch (Exception e) {
            logStreamHandler.appendAndBroadcast(buildId, "\u001B[1;31m[ERROR] Process execution failed: " + e.getMessage() + "\u001B[0m");
            return false;
        }
    }
}
