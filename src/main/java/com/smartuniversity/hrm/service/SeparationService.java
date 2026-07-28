package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.mapper.SeparationMapper;
import com.smartuniversity.hrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SeparationService {

    private final SeparationRepository repository;
    private final EmployeeRepository employeeRepository;
    private final ApprovalWorkflowService workflowService;
    private final SeparationMapper mapper;

    public SeparationService(SeparationRepository repository, EmployeeRepository employeeRepository,
                             ApprovalWorkflowService workflowService, SeparationMapper mapper) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.workflowService = workflowService;
        this.mapper = mapper;
    }

    @Transactional
    public SeparationResponse initiate(SeparationRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        Separation separation = Separation.builder()
                .employee(employee)
                .type(request.getType())
                .effectiveDate(request.getEffectiveDate())
                .reason(request.getReason())
                .build();
        separation = repository.save(separation);

        workflowService.createWorkflow("SEPARATION", separation.getId(),
                "Separation: " + employee.getFirstName() + " " + employee.getLastName(),
                employee, List.of("DEPT_HEAD", "HR"));

        return mapper.toResponse(separation);
    }

    public List<SeparationResponse> getByEmployee(Long employeeId) {
        return repository.findByEmployeeId(employeeId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<SeparationResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional
    public void approve(Long separationId) {
        Separation separation = repository.findById(separationId)
                .orElseThrow(() -> new ResourceNotFoundException("Separation", "id", separationId));
        separation.setApproved(true);
        repository.save(separation);

        Employee employee = separation.getEmployee();
        employee.setActive(false);
        employeeRepository.save(employee);
    }
}
