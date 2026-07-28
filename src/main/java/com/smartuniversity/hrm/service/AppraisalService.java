package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.mapper.AppraisalMapper;
import com.smartuniversity.hrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppraisalService {

    private final AppraisalRepository repository;
    private final EmployeeRepository employeeRepository;
    private final AppraisalMapper mapper;

    public AppraisalService(AppraisalRepository repository, EmployeeRepository employeeRepository,
                            AppraisalMapper mapper) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.mapper = mapper;
    }

    @Transactional
    public AppraisalResponse create(AppraisalRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));
        Employee reviewer = request.getReviewerId() != null
                ? employeeRepository.findById(request.getReviewerId()).orElse(null) : null;

        Appraisal appraisal = Appraisal.builder()
                .employee(employee)
                .appraisalDate(request.getAppraisalDate())
                .reviewYear(request.getReviewYear())
                .rating(request.getRating())
                .comments(request.getComments())
                .reviewer(reviewer)
                .build();
        appraisal = repository.save(appraisal);
        return mapper.toResponse(appraisal);
    }

    public List<AppraisalResponse> getByEmployee(Long employeeId) {
        return repository.findByEmployeeId(employeeId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<AppraisalResponse> getByYear(int year) {
        return repository.findByReviewYear(year).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<AppraisalResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }
}
