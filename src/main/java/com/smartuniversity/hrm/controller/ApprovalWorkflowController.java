package com.smartuniversity.hrm.controller;

import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.service.ApprovalWorkflowService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approval-workflows")
public class ApprovalWorkflowController {

    private final ApprovalWorkflowService workflowService;

    public ApprovalWorkflowController(ApprovalWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ApprovalWorkflowResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getAll(pageable)));
    }

    @GetMapping("/{entityType}/{entityId}")
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ApprovalWorkflowResponse>>> getByEntity(
            @PathVariable String entityType, @PathVariable Long entityId) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getByEntity(entityType, entityId)));
    }

    @PostMapping("/step/action")
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> processStep(@Valid @RequestBody ApprovalStepActionRequest request) {
        workflowService.processStep(request);
        return ResponseEntity.ok(ApiResponse.success("Step processed", null));
    }
}
