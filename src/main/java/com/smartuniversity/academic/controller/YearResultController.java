package com.smartuniversity.academic.controller;

import com.smartuniversity.academic.dto.YearResultResponse;
import com.smartuniversity.academic.service.YearResultService;
import com.smartuniversity.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/year-results")
public class YearResultController {

    private final YearResultService yearResultService;

    public YearResultController(YearResultService yearResultService) {
        this.yearResultService = yearResultService;
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FACULTY') or @resourceSecurity.isStudentOwner(#studentId)")
    public ResponseEntity<ApiResponse<List<YearResultResponse>>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(yearResultService.getByStudent(studentId)));
    }
}
