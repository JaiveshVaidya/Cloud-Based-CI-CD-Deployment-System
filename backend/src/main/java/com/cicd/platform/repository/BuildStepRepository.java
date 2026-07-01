package com.cicd.platform.repository;

import com.cicd.platform.model.BuildStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildStepRepository extends JpaRepository<BuildStep, Long> {
}
