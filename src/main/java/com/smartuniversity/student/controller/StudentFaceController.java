package com.smartuniversity.student.controller;

import com.smartuniversity.common.ApiResponse;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.security.entity.User;
import com.smartuniversity.security.repository.UserRepository;
import com.smartuniversity.student.dto.StudentFaceEnrollRequest;
import com.smartuniversity.student.dto.StudentFaceVerifyRequest;
import com.smartuniversity.student.dto.StudentFaceVerifyResponse;
import com.smartuniversity.student.entity.Student;
import com.smartuniversity.student.repository.StudentRepository;
import com.smartuniversity.student.service.StudentAttendanceService;
import com.smartuniversity.student.service.StudentFaceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student/face")
public class StudentFaceController {

    private final StudentFaceService studentFaceService;
    private final StudentAttendanceService studentAttendanceService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    public StudentFaceController(StudentFaceService studentFaceService,
                                  StudentAttendanceService studentAttendanceService,
                                  UserRepository userRepository,
                                  StudentRepository studentRepository) {
        this.studentFaceService = studentFaceService;
        this.studentAttendanceService = studentAttendanceService;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    @PostMapping("/enroll")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> enrollFace(
            @RequestParam Long studentId,
            @Valid @RequestBody StudentFaceEnrollRequest request) {
        studentFaceService.enrollFace(studentId, request.getBase64Image());
        return ResponseEntity.ok(ApiResponse.success("Face enrolled successfully", null));
    }

    @PostMapping("/enroll/self")
    public ResponseEntity<ApiResponse<String>> enrollOwnFace(
            @Valid @RequestBody StudentFaceEnrollRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "userId", user.getId()));
        studentFaceService.enrollFace(student.getId(), request.getBase64Image());
        return ResponseEntity.ok(ApiResponse.success("Face enrolled successfully", null));
    }

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<StudentFaceVerifyResponse>> verifyAndCheckIn(
            @Valid @RequestBody StudentFaceVerifyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));
        Student authenticatedStudent = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "userId", user.getId()));

        StudentFaceVerifyResponse response = studentFaceService.verifyFace(request.getBase64Image());
        if (!response.isMatched()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
        }
        if (!authenticatedStudent.getId().equals(response.getStudentId())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Face does not match your enrolled face"));
        }
        studentAttendanceService.checkIn(response.getStudentId());
        return ResponseEntity.ok(ApiResponse.success("Face verified and checked in", response));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getEnrollmentStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));
        boolean enrolled = studentFaceService.isEnrolledByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("enrolled", enrolled)));
    }
}
