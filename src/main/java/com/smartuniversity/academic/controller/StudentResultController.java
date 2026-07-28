package com.smartuniversity.academic.controller;

import com.smartuniversity.academic.dto.*;
import com.smartuniversity.academic.service.StudentResultService;
import com.smartuniversity.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-results")
public class StudentResultController {

    private final StudentResultService resultService;

    public StudentResultController(StudentResultService resultService) {
        this.resultService = resultService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<StudentResultResponse>> enterResult(@Valid @RequestBody StudentResultRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Result entered", resultService.enterResult(request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FACULTY') or hasRole('REGISTRAR')")
    public ResponseEntity<ApiResponse<Page<StudentResultResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(resultService.getAll(pageable)));
    }

    @GetMapping("/student/{studentId}/session/{sessionId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FACULTY') or hasRole('REGISTRAR') or @resourceSecurity.isStudentOwner(#studentId)")
    public ResponseEntity<ApiResponse<List<StudentResultResponse>>> getByStudentAndSession(
            @PathVariable Long studentId, @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(resultService.getByStudentAndSession(studentId, sessionId)));
    }

    @GetMapping("/course/{courseId}/session/{sessionId}")
    public ResponseEntity<ApiResponse<List<StudentResultResponse>>> getByCourseAndSession(
            @PathVariable Long courseId, @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(resultService.getByCourseAndSession(courseId, sessionId)));
    }

    @PostMapping("/publish/student/{studentId}/session/{sessionId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<Void>> publishResults(
            @PathVariable Long studentId, @PathVariable Long sessionId) {
        resultService.publishResults(studentId, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Results published and GPA recalculated", null));
    }
}
