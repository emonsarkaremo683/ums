package com.smartuniversity.hrm.controller;

import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.FaceEnrollRequest;
import com.smartuniversity.hrm.dto.FaceVerifyRequest;
import com.smartuniversity.hrm.dto.FaceVerifyResponse;
import com.smartuniversity.hrm.entity.Employee;
import com.smartuniversity.hrm.repository.EmployeeRepository;
import com.smartuniversity.hrm.service.AttendanceService;
import com.smartuniversity.hrm.service.EmployeeFaceService;
import com.smartuniversity.security.entity.User;
import com.smartuniversity.security.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/employee/face")
public class EmployeeFaceController {

    private final EmployeeFaceService employeeFaceService;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceService attendanceService;

    public EmployeeFaceController(EmployeeFaceService employeeFaceService, UserRepository userRepository,
                                   EmployeeRepository employeeRepository, AttendanceService attendanceService) {
        this.employeeFaceService = employeeFaceService;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceService = attendanceService;
    }

    @PostMapping("/enroll")
    @PreAuthorize("hasRole('HR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> enrollFace(
            @RequestParam Long employeeId,
            @Valid @RequestBody FaceEnrollRequest request) {
        employeeFaceService.enrollFace(employeeId, request.getBase64Image());
        return ResponseEntity.ok(ApiResponse.success("Face enrolled successfully", null));
    }

    @PostMapping("/enroll/self")
    public ResponseEntity<ApiResponse<String>> enrollOwnFace(
            @Valid @RequestBody FaceEnrollRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));
        Employee employee = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "userId", user.getId()));
        employeeFaceService.enrollFace(employee.getId(), request.getBase64Image());
        return ResponseEntity.ok(ApiResponse.success("Face enrolled successfully", null));
    }

    @PostMapping("/verify-check-in")
    public ResponseEntity<ApiResponse<FaceVerifyResponse>> verifyAndCheckIn(
            @Valid @RequestBody FaceVerifyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        FaceVerifyResponse response = employeeFaceService.verifyFace(request.getBase64Image());
        if (!response.isMatched()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
        }
        attendanceService.checkInByEmployeeId(response.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.success("Face verified and checked in", response));
    }

    @PostMapping("/verify-check-out")
    public ResponseEntity<ApiResponse<FaceVerifyResponse>> verifyAndCheckOut(
            @Valid @RequestBody FaceVerifyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        FaceVerifyResponse response = employeeFaceService.verifyFace(request.getBase64Image());
        if (!response.isMatched()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
        }
        attendanceService.checkOutByEmployeeId(response.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.success("Face verified and checked out", response));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getEnrollmentStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));
        boolean enrolled = employeeFaceService.isEnrolledByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("enrolled", enrolled)));
    }
}
