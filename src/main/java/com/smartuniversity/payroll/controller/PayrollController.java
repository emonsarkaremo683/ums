package com.smartuniversity.payroll.controller;

import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.payroll.dto.*;
import com.smartuniversity.payroll.entity.PayrollRun;
import com.smartuniversity.payroll.mapper.PayrollMapper;
import com.smartuniversity.payroll.service.PayrollService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;
    private final PayrollMapper payrollMapper;

    public PayrollController(PayrollService payrollService, PayrollMapper payrollMapper) {
        this.payrollService = payrollService;
        this.payrollMapper = payrollMapper;
    }

    @GetMapping("/runs")
    @PreAuthorize("hasRole('PAYROLL') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PayrollRunResponse>>> listRuns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<PayrollRun> runs = payrollService.getAllRuns(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<PayrollRunResponse> response = runs.map(run -> PayrollRunResponse.builder()
                .id(run.getId())
                .month(run.getMonth())
                .year(run.getYear())
                .completed(run.isCompleted())
                .totalEmployees(run.getTotalEmployees())
                .build());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/run")
    @PreAuthorize("hasRole('PAYROLL') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunResponse>> runPayroll(@RequestParam String month, @RequestParam int year) {
        PayrollRun run = payrollService.runPayroll(month, year);
        PayrollRunResponse response = PayrollRunResponse.builder()
                .id(run.getId())
                .month(run.getMonth())
                .year(run.getYear())
                .completed(run.isCompleted())
                .totalEmployees(run.getTotalEmployees())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payroll processed", response));
    }

    @PostMapping("/run-v2")
    @PreAuthorize("hasRole('PAYROLL') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunResponse>> runPayrollBody(@RequestBody PayrollRunRequest request) {
        PayrollRun run = payrollService.runPayroll(request.getMonth(), request.getYear());
        PayrollRunResponse response = PayrollRunResponse.builder()
                .id(run.getId())
                .month(run.getMonth())
                .year(run.getYear())
                .completed(run.isCompleted())
                .totalEmployees(run.getTotalEmployees())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payroll processed", response));
    }

    @GetMapping("/runs/{runId}/payslips")
    @PreAuthorize("hasRole('PAYROLL') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> getPayslipsByRun(@PathVariable Long runId) {
        List<PayslipResponse> payslips = payrollService.getPayslipsByRun(runId).stream()
                .map(payrollMapper::toPayslipResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(payslips));
    }

    @GetMapping("/employee/{employeeId}/payslips")
    @PreAuthorize("hasRole('PAYROLL') or hasRole('ADMIN') or @resourceSecurity.isEmployeeOwner(#employeeId)")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> getPayslipsByEmployee(@PathVariable Long employeeId) {
        List<PayslipResponse> payslips = payrollService.getPayslipsByEmployee(employeeId).stream()
                .map(payrollMapper::toPayslipResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(payslips));
    }
}
