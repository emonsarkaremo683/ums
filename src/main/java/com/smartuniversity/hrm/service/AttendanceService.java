package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public AttendanceResponse checkIn(AttendanceRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));
        return doCheckIn(employee, request.getCheckInTime());
    }

    @Transactional
    public AttendanceResponse checkInForUser(Long userId, AttendanceRequest request) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "userId", userId));
        return doCheckIn(employee, request.getCheckInTime());
    }

    @Transactional
    public AttendanceResponse checkOut(AttendanceRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));
        return doCheckOut(employee, request.getCheckOutTime());
    }

    @Transactional
    public AttendanceResponse checkOutForUser(Long userId, AttendanceRequest request) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "userId", userId));
        return doCheckOut(employee, request.getCheckOutTime());
    }

    public List<AttendanceResponse> getByEmployeeAndDateRange(Long employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, start, end).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceResponse checkInByEmployeeId(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));
        return doCheckIn(employee, java.time.LocalTime.now());
    }

    @Transactional
    public AttendanceResponse checkOutByEmployeeId(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));
        return doCheckOut(employee, java.time.LocalTime.now());
    }

    private AttendanceResponse doCheckIn(Employee employee, java.time.LocalTime time) {
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDateWithLock(employee.getId(), LocalDate.now())
                .orElse(Attendance.builder()
                        .employee(employee)
                        .date(LocalDate.now())
                        .build());
        attendance.setCheckInTime(time);
        attendance.setStatus(com.smartuniversity.common.enums.AttendanceStatus.PRESENT);
        attendance = attendanceRepository.save(attendance);
        return toResponse(attendance);
    }

    private AttendanceResponse doCheckOut(Employee employee, java.time.LocalTime time) {
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDateWithLock(employee.getId(), LocalDate.now())
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "date", LocalDate.now()));
        attendance.setCheckOutTime(time);
        attendance = attendanceRepository.save(attendance);
        return toResponse(attendance);
    }

    private AttendanceResponse toResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .employeeId(a.getEmployee().getId())
                .date(a.getDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .status(a.getStatus().name())
                .build();
    }
}
