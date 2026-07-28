package com.smartuniversity.admission.controller;

import com.smartuniversity.admission.dto.SscResultRequest;
import com.smartuniversity.admission.dto.SscResultResponse;
import com.smartuniversity.admission.service.SscResultService;
import com.smartuniversity.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applicants/{applicantId}/ssc-results")
public class SscResultController {

    private final SscResultService sscResultService;

    public SscResultController(SscResultService sscResultService) {
        this.sscResultService = sscResultService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<SscResultResponse>> submit(
            @PathVariable Long applicantId, @Valid @RequestBody SscResultRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("SSC result submitted", sscResultService.submit(applicantId, request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<SscResultResponse>> getByApplicantId(@PathVariable Long applicantId) {
        return ResponseEntity.ok(ApiResponse.success(sscResultService.getByApplicantId(applicantId)));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<SscResultResponse>> update(
            @PathVariable Long applicantId, @Valid @RequestBody SscResultRequest request) {
        return ResponseEntity.ok(ApiResponse.success("SSC result updated", sscResultService.update(applicantId, request)));
    }

    @PutMapping("/verify")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION')")
    public ResponseEntity<ApiResponse<SscResultResponse>> verify(@PathVariable Long applicantId) {
        return ResponseEntity.ok(ApiResponse.success("SSC result verified", sscResultService.verify(applicantId)));
    }
}
