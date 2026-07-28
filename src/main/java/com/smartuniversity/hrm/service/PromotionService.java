package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PromotionService {

    private final PromotionHistoryRepository promotionRepository;
    private final EmployeeRepository employeeRepository;
    private final DesignationRepository designationRepository;
    private final GradeRepository gradeRepository;
    private final ApprovalWorkflowService workflowService;

    public PromotionService(PromotionHistoryRepository promotionRepository,
                            EmployeeRepository employeeRepository,
                            DesignationRepository designationRepository,
                            GradeRepository gradeRepository,
                            ApprovalWorkflowService workflowService) {
        this.promotionRepository = promotionRepository;
        this.employeeRepository = employeeRepository;
        this.designationRepository = designationRepository;
        this.gradeRepository = gradeRepository;
        this.workflowService = workflowService;
    }

    @Transactional
    public PromotionResponse initiate(PromotionRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        Designation fromDesig = request.getFromDesignationId() != null
                ? designationRepository.findById(request.getFromDesignationId()).orElse(null)
                : employee.getDesignation();
        Designation toDesig = designationRepository.findById(request.getToDesignationId())
                .orElseThrow(() -> new ResourceNotFoundException("Designation", "id", request.getToDesignationId()));
        Grade fromGrade = request.getFromGradeId() != null
                ? gradeRepository.findById(request.getFromGradeId()).orElse(null)
                : employee.getGrade();
        Grade toGrade = request.getToGradeId() != null
                ? gradeRepository.findById(request.getToGradeId()).orElse(null) : null;

        PromotionHistory promotion = PromotionHistory.builder()
                .employee(employee)
                .fromDesignation(fromDesig)
                .toDesignation(toDesig)
                .fromGrade(fromGrade)
                .toGrade(toGrade)
                .type(request.getType())
                .effectiveDate(request.getEffectiveDate())
                .remarks(request.getRemarks())
                .build();
        promotion = promotionRepository.save(promotion);

        workflowService.createWorkflow("PROMOTION", promotion.getId(),
                "Promotion/Demotion: " + employee.getFirstName() + " " + employee.getLastName(),
                employee, List.of("DEPT_HEAD", "HR_COMMITTEE", "VC"));

        return toResponse(promotion);
    }

    public List<PromotionResponse> getByEmployee(Long employeeId) {
        return promotionRepository.findByEmployeeId(employeeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<PromotionResponse> getAll(Pageable pageable) {
        return promotionRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public void applyPromotion(Long promotionId) {
        ApprovalWorkflowResponse workflow = workflowService.getByEntity("PROMOTION", promotionId).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "entityId", promotionId));

        if (!"APPROVED".equals(workflow.getStatus())) {
            throw new BadRequestException("Workflow not yet approved");
        }

        PromotionHistory promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("PromotionHistory", "id", promotionId));

        Employee employee = promotion.getEmployee();
        if (promotion.getToDesignation() != null) {
            employee.setDesignation(promotion.getToDesignation());
        }
        if (promotion.getToGrade() != null) {
            employee.setGrade(promotion.getToGrade());
        }
        employeeRepository.save(employee);
    }

    private PromotionResponse toResponse(PromotionHistory p) {
        return PromotionResponse.builder()
                .id(p.getId())
                .employeeId(p.getEmployee().getId())
                .employeeName(p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName())
                .fromDesignation(p.getFromDesignation() != null ? p.getFromDesignation().getName() : null)
                .toDesignation(p.getToDesignation() != null ? p.getToDesignation().getName() : null)
                .fromGrade(p.getFromGrade() != null ? p.getFromGrade().getName() : null)
                .toGrade(p.getToGrade() != null ? p.getToGrade().getName() : null)
                .type(p.getType().name())
                .effectiveDate(p.getEffectiveDate())
                .remarks(p.getRemarks())
                .build();
    }
}
