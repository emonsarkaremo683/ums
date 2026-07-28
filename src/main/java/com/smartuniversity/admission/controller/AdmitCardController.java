package com.smartuniversity.admission.controller;

import com.smartuniversity.admission.dto.AdmitCardResponse;
import com.smartuniversity.admission.service.AdmitCardService;
import com.smartuniversity.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admit-cards")
public class AdmitCardController {

    private final AdmitCardService admitCardService;

    public AdmitCardController(AdmitCardService admitCardService) {
        this.admitCardService = admitCardService;
    }

    @PostMapping("/generate/{applicantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION')")
    public ResponseEntity<ApiResponse<AdmitCardResponse>> generate(@PathVariable Long applicantId) {
        AdmitCardResponse response = admitCardService.generate(applicantId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admit card generated", response));
    }

    @GetMapping("/applicant/{applicantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<AdmitCardResponse>> getByApplicant(@PathVariable Long applicantId) {
        return ResponseEntity.ok(ApiResponse.success(admitCardService.getByApplicantId(applicantId)));
    }
}
