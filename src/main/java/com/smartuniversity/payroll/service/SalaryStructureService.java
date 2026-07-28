package com.smartuniversity.payroll.service;

import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.entity.Grade;
import com.smartuniversity.hrm.repository.GradeRepository;
import com.smartuniversity.payroll.dto.SalaryStructureRequest;
import com.smartuniversity.payroll.dto.SalaryStructureResponse;
import com.smartuniversity.payroll.entity.SalaryStructure;
import com.smartuniversity.payroll.repository.SalaryStructureRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SalaryStructureService {

    private final SalaryStructureRepository repository;
    private final GradeRepository gradeRepository;

    public SalaryStructureService(SalaryStructureRepository repository, GradeRepository gradeRepository) {
        this.repository = repository;
        this.gradeRepository = gradeRepository;
    }

    @Transactional
    public SalaryStructureResponse create(SalaryStructureRequest request) {
        Grade grade = gradeRepository.findById(request.getGradeId())
                .orElseThrow(() -> new ResourceNotFoundException("Grade", "id", request.getGradeId()));

        SalaryStructure ss = SalaryStructure.builder()
                .grade(grade)
                .basicSalary(request.getBasicSalary())
                .houseAllowance(request.getHouseAllowance())
                .medicalAllowance(request.getMedicalAllowance())
                .transportAllowance(request.getTransportAllowance())
                .taxRate(request.getTaxRate())
                .providentFundRate(request.getProvidentFundRate())
                .build();
        ss = repository.save(ss);
        return toResponse(ss);
    }

    public Page<SalaryStructureResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    private SalaryStructureResponse toResponse(SalaryStructure ss) {
        return SalaryStructureResponse.builder()
                .id(ss.getId())
                .gradeId(ss.getGrade().getId())
                .gradeName(ss.getGrade().getName())
                .basicSalary(ss.getBasicSalary())
                .houseAllowance(ss.getHouseAllowance())
                .medicalAllowance(ss.getMedicalAllowance())
                .transportAllowance(ss.getTransportAllowance())
                .taxRate(ss.getTaxRate())
                .providentFundRate(ss.getProvidentFundRate())
                .build();
    }
}
