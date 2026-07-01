package com.cicd.platform.repository;

import com.cicd.platform.model.BuildRun;
import com.cicd.platform.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BuildRunRepository extends JpaRepository<BuildRun, Long> {
    List<BuildRun> findByProjectOrderByBuildNumberDesc(Project project);
    Optional<BuildRun> findFirstByProjectOrderByBuildNumberDesc(Project project);
    List<BuildRun> findTop10ByOrderByStartTimeDesc();
    
    @org.springframework.data.jpa.repository.Query("SELECT b FROM BuildRun b JOIN b.project p WHERE p.user.id = :userId ORDER BY b.startTime DESC")
    List<BuildRun> findLatestBuildsByUser(Long userId);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(b) FROM BuildRun b JOIN b.project p WHERE p.user.id = :userId AND b.status = :status")
    Long countByUserIdAndStatus(Long userId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(b) FROM BuildRun b JOIN b.project p WHERE p.user.id = :userId")
    Long countByUserId(Long userId);
}
