package com.smartuniversity.student.service;

import com.smartuniversity.common.enums.AttendanceStatus;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.student.dto.StudentAttendanceResponse;
import com.smartuniversity.student.entity.Student;
import com.smartuniversity.student.entity.StudentAttendance;
import com.smartuniversity.student.repository.StudentAttendanceRepository;
import com.smartuniversity.student.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentAttendanceService {

    private final StudentAttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public StudentAttendanceService(StudentAttendanceRepository attendanceRepository, StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional
    public StudentAttendanceResponse checkIn(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        StudentAttendance attendance = attendanceRepository.findByStudentIdAndDateWithLock(student.getId(), LocalDate.now())
                .orElse(StudentAttendance.builder()
                        .student(student)
                        .date(LocalDate.now())
                        .build());

        attendance.setCheckInTime(LocalTime.now());
        attendance.setStatus(AttendanceStatus.PRESENT);
        attendance = attendanceRepository.save(attendance);
        return toResponse(attendance);
    }

    @Transactional
    public StudentAttendanceResponse checkOut(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        StudentAttendance attendance = attendanceRepository.findByStudentIdAndDateWithLock(student.getId(), LocalDate.now())
                .orElseThrow(() -> new ResourceNotFoundException("Student Attendance", "date", LocalDate.now()));

        attendance.setCheckOutTime(LocalTime.now());
        attendance = attendanceRepository.save(attendance);
        return toResponse(attendance);
    }

    public List<StudentAttendanceResponse> getByStudentAndDateRange(Long studentId, LocalDate start, LocalDate end) {
        return attendanceRepository.findByStudentIdAndDateBetween(studentId, start, end).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private StudentAttendanceResponse toResponse(StudentAttendance a) {
        return StudentAttendanceResponse.builder()
                .id(a.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFirstName() + " " + a.getStudent().getLastName())
                .date(a.getDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .status(a.getStatus().name())
                .build();
    }
}
