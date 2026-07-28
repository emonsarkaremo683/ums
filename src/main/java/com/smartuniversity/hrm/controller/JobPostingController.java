package com.smartuniversity.hrm.controller;

import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.mapper.EmployeeMapper;
import com.smartuniversity.hrm.service.JobPostingService;
import com.smartuniversity.hrm.repository.EmployeeRepository;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/job-postings")
public class JobPostingController {

    private final JobPostingService jobPostingService;
    private final EmployeeMapper employeeMapper;

    public JobPostingController(JobPostingService jobPostingService, EmployeeMapper employeeMapper) {
        this.jobPostingService = jobPostingService;
        this.employeeMapper = employeeMapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<JobPostingResponse>> create(@Valid @RequestBody JobPostingRequest request) {
        JobPosting posting = jobPostingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Job posting created", toPostingResponse(posting)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobPostingResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                jobPostingService.getAll(pageable).map(this::toPostingResponse)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<JobPostingResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(
                jobPostingService.getActive().stream().map(this::toPostingResponse).collect(Collectors.toList())));
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<ApiResponse<JobApplicationResponse>> apply(
            @PathVariable Long id, @Valid @RequestBody JobApplicationRequest request) {
        JobApplication application = JobApplication.builder()
                .applicantName(request.getApplicantName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .resumeUrl(request.getResumeUrl())
                .build();
        JobApplication saved = jobPostingService.apply(id, application);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Application submitted", toApplicationResponse(saved, id)));
    }

    @GetMapping("/{id}/applications")
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<JobApplicationResponse>>> getApplications(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                jobPostingService.getApplications(id).stream()
                        .map(a -> toApplicationResponse(a, id))
                        .collect(Collectors.toList())));
    }

    @PostMapping("/applications/{applicationId}/interview")
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InterviewResponse>> scheduleInterview(
            @PathVariable Long applicationId, @Valid @RequestBody InterviewRequest request) {
        Interview interview = Interview.builder()
                .scheduledAt(request.getScheduledAt())
                .location(request.getLocation())
                .notes(request.getNotes())
                .build();
        Interview saved = jobPostingService.scheduleInterview(applicationId, interview);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interview scheduled", toInterviewResponse(saved, applicationId)));
    }

    private JobPostingResponse toPostingResponse(JobPosting p) {
        return JobPostingResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .department(p.getDepartment())
                .vacancies(p.getVacancies())
                .postingDate(p.getPostingDate())
                .closingDate(p.getClosingDate())
                .active(p.isActive())
                .build();
    }

    private JobApplicationResponse toApplicationResponse(JobApplication a, Long jobPostingId) {
        return JobApplicationResponse.builder()
                .id(a.getId())
                .jobPostingId(jobPostingId)
                .applicantName(a.getApplicantName())
                .email(a.getEmail())
                .phone(a.getPhone())
                .resumeUrl(a.getResumeUrl())
                .status(a.getStatus() != null ? a.getStatus().name() : "PENDING")
                .build();
    }

    private InterviewResponse toInterviewResponse(Interview i, Long jobApplicationId) {
        return InterviewResponse.builder()
                .id(i.getId())
                .jobApplicationId(jobApplicationId)
                .scheduledAt(i.getScheduledAt())
                .location(i.getLocation())
                .notes(i.getNotes())
                .completed(i.isCompleted())
                .score(i.getScore())
                .build();
    }
}
