package com.smartuniversity.hrm.service;

import com.smartuniversity.common.enums.ApprovalStatus;
import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApprovalWorkflowService {

    private final ApprovalWorkflowRepository workflowRepository;
    private final ApprovalStepRepository stepRepository;

    public ApprovalWorkflowService(ApprovalWorkflowRepository workflowRepository, ApprovalStepRepository stepRepository) {
        this.workflowRepository = workflowRepository;
        this.stepRepository = stepRepository;
    }

    @Transactional
    public ApprovalWorkflow createWorkflow(String entityType, Long entityId, String name,
                                            Employee initiatedBy, List<String> approverRoles) {
        ApprovalWorkflow workflow = ApprovalWorkflow.builder()
                .entityType(entityType)
                .entityId(entityId)
                .name(name)
                .initiatedBy(initiatedBy)
                .build();
        workflow = workflowRepository.save(workflow);

        for (int i = 0; i < approverRoles.size(); i++) {
            ApprovalStep step = ApprovalStep.builder()
                    .workflow(workflow)
                    .stepOrder(i + 1)
                    .approverRole(approverRoles.get(i))
                    .build();
            stepRepository.save(step);
        }

        return workflow;
    }

    public List<ApprovalWorkflowResponse> getByEntity(String entityType, Long entityId) {
        return workflowRepository.findByEntityTypeAndEntityId(entityType, entityId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<ApprovalWorkflowResponse> getAll(Pageable pageable) {
        return workflowRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public void processStep(ApprovalStepActionRequest request) {
        ApprovalStep step = stepRepository.findById(request.getStepId())
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalStep", "id", request.getStepId()));

        if (step.getStatus() != ApprovalStatus.PENDING) {
            throw new BadRequestException("This step has already been processed");
        }

        step.setStatus(request.getAction());
        step.setComments(request.getComments());
        step.setDecidedAt(LocalDateTime.now());
        stepRepository.save(step);

        ApprovalWorkflow workflow = step.getWorkflow();
        if (request.getAction() == ApprovalStatus.REJECTED) {
            workflow.setStatus(ApprovalStatus.REJECTED);
            workflow.setComments("Rejected at step " + step.getStepOrder() + ": " + request.getComments());
            workflowRepository.save(workflow);
        } else {
            List<ApprovalStep> steps = stepRepository.findByWorkflowIdOrderByStepOrder(workflow.getId());
            boolean allApproved = steps.stream().allMatch(s -> s.getStatus() == ApprovalStatus.APPROVED);
            if (allApproved) {
                workflow.setStatus(ApprovalStatus.APPROVED);
                workflow.setComments("All steps approved");
                workflowRepository.save(workflow);
            }
        }
    }

    private ApprovalWorkflowResponse toResponse(ApprovalWorkflow workflow) {
        List<ApprovalStepResponse> stepResponses = stepRepository.findByWorkflowIdOrderByStepOrder(workflow.getId())
                .stream().map(step -> ApprovalStepResponse.builder()
                        .id(step.getId())
                        .workflowId(workflow.getId())
                        .stepOrder(step.getStepOrder())
                        .approverRole(step.getApproverRole())
                        .approverId(step.getApprover() != null ? step.getApprover().getId() : null)
                        .status(step.getStatus().name())
                        .comments(step.getComments())
                        .decidedAt(step.getDecidedAt())
                        .build()).collect(Collectors.toList());

        return ApprovalWorkflowResponse.builder()
                .id(workflow.getId())
                .entityType(workflow.getEntityType())
                .entityId(workflow.getEntityId())
                .name(workflow.getName())
                .status(workflow.getStatus().name())
                .steps(stepResponses)
                .build();
    }
}
