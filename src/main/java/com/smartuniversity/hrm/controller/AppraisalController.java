package com.smartuniversity.hrm.controller;

import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.service.AppraisalService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appraisals")
public class AppraisalController {

    private final AppraisalService service;

    public AppraisalController(AppraisalService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AppraisalResponse>> create(@Valid @RequestBody AppraisalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appraisal created", service.create(request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AppraisalResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.getAll(pageable)));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN') or @resourceSecurity.isEmployeeOwner(#employeeId)")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(service.getByEmployee(employeeId)));
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<ApiResponse<List<AppraisalResponse>>> getByYear(@PathVariable int year) {
        return ResponseEntity.ok(ApiResponse.success(service.getByYear(year)));
    }
}
