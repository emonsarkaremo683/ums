package com.smartuniversity.payroll.controller;

import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.payroll.dto.*;
import com.smartuniversity.payroll.service.SalaryStructureService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/salary-structures")
public class SalaryStructureController {

    private final SalaryStructureService salaryStructureService;

    public SalaryStructureController(SalaryStructureService salaryStructureService) {
        this.salaryStructureService = salaryStructureService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PAYROLL') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SalaryStructureResponse>> create(@Valid @RequestBody SalaryStructureRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Salary structure created", salaryStructureService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SalaryStructureResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(salaryStructureService.getAll(pageable)));
    }
}
