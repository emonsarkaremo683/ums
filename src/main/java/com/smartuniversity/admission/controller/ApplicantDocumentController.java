package com.smartuniversity.admission.controller;

import com.smartuniversity.admission.dto.*;
import com.smartuniversity.admission.service.ApplicantDocumentService;
import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.common.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/applicant-documents")
public class ApplicantDocumentController {

    private final ApplicantDocumentService documentService;
    private final FileStorageService fileStorageService;

    public ApplicantDocumentController(ApplicantDocumentService documentService,
                                        FileStorageService fileStorageService) {
        this.documentService = documentService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ApplicantDocumentResponse>> upload(
            @RequestParam Long applicantId,
            @RequestParam String documentType,
            @RequestParam("file") MultipartFile file) {

        FileStorageService.StoredFile storedFile = fileStorageService.store(file, "applicant-documents");

        ApplicantDocumentRequest request = new ApplicantDocumentRequest();
        request.setApplicantId(applicantId);
        request.setDocumentType(documentType);
        request.setFileName(storedFile.fileName());
        request.setFileUrl(storedFile.fileUrl());

        ApplicantDocumentResponse response = documentService.upload(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded", response));
    }

    @GetMapping("/applicant/{applicantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION') or @resourceSecurity.isApplicantOwner(#applicantId)")
    public ResponseEntity<ApiResponse<List<ApplicantDocumentResponse>>> getByApplicantId(
            @PathVariable Long applicantId) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getByApplicantId(applicantId)));
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION')")
    public ResponseEntity<ApiResponse<ApplicantDocumentResponse>> verify(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Document verified", documentService.verify(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ADMISSION')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }
}
