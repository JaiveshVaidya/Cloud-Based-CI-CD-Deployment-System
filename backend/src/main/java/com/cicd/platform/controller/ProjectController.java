package com.cicd.platform.controller;

import com.cicd.platform.model.Project;
import com.cicd.platform.model.User;
import com.cicd.platform.repository.ProjectRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findByUser(getCurrentUser());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));

        // Security check
        if (!project.getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(project);
    }

    @PostMapping
    public Project createProject(@Valid @RequestBody Project project) {
        project.setUser(getCurrentUser());
        return projectRepository.save(project);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));

        // Security check
        if (!project.getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.status(403).build();
        }

        projectRepository.delete(project);
        return ResponseEntity.ok().build();
    }
}
