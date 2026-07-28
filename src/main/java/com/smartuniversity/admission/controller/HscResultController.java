package com.smartuniversity.admission.controller;

import com.smartuniversity.admission.dto.HscResultRequest;
import com.smartuniversity.admission.dto.HscResultResponse;
import com.smartuniversity.admission.service.HscResultService;
import com.smartuniversity.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applicants/{applicantId}/hsc-results")
public class HscResultController {

    private final HscResultService hscResultService;

    public HscResultController(HscResultService hscResultService) {
        this.hscResultService = hscResultService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<HscResultResponse>> submit(
            @PathVariable Long applicantId, @Valid @RequestBody HscResultRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("HSC result submitted", hscResultService.submit(applicantId, request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<HscResultResponse>> getByApplicantId(@PathVariable Long applicantId) {
        return ResponseEntity.ok(ApiResponse.success(hscResultService.getByApplicantId(applicantId)));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<HscResultResponse>> update(
            @PathVariable Long applicantId, @Valid @RequestBody HscResultRequest request) {
        return ResponseEntity.ok(ApiResponse.success("HSC result updated", hscResultService.update(applicantId, request)));
    }

    @PutMapping("/verify")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION')")
    public ResponseEntity<ApiResponse<HscResultResponse>> verify(@PathVariable Long applicantId) {
        return ResponseEntity.ok(ApiResponse.success("HSC result verified", hscResultService.verify(applicantId)));
    }
}
