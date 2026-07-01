package com.cicd.platform.service;

import com.cicd.platform.model.BuildRun;

public interface BuildExecutor {
    void execute(BuildRun buildRun);
}
