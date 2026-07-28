package com.smartuniversity.hrm.service;

import com.smartuniversity.common.enums.LeaveStatus;
import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;

    public LeaveService(LeaveRequestRepository leaveRequestRepository, LeaveTypeRepository leaveTypeRepository,
                        LeaveBalanceRepository leaveBalanceRepository, EmployeeRepository employeeRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.employeeRepository = employeeRepository;
    }

    public Page<LeaveRequestResponse> list(Pageable pageable, String status) {
        Page<LeaveRequest> page;
        if (status != null && !status.isBlank()) {
            try {
                LeaveStatus leaveStatus = LeaveStatus.valueOf(status.toUpperCase());
                page = leaveRequestRepository.findByStatus(leaveStatus, pageable);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid leave status: " + status);
            }
        } else {
            page = leaveRequestRepository.findAll(pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional
    public LeaveRequestResponse request(LeaveRequestDto dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", dto.getEmployeeId()));
        LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("LeaveType", "id", dto.getLeaveTypeId()));

        int totalDays = (int) ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;

        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveType_IdAndYear(dto.getEmployeeId(), dto.getLeaveTypeId(), LocalDate.now().getYear())
                .orElse(LeaveBalance.builder()
                        .employee(employee)
                        .leaveType(leaveType)
                        .year(LocalDate.now().getYear())
                        .totalDays(leaveType.getDefaultDaysPerYear())
                        .usedDays(0)
                        .build());

        if (balance.getRemainingDays() < totalDays) {
            throw new BadRequestException("Insufficient leave balance. Remaining: " + balance.getRemainingDays());
        }
        balance.setUsedDays(balance.getUsedDays() + totalDays);
        leaveBalanceRepository.save(balance);

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .totalDays(totalDays)
                .reason(dto.getReason())
                .build();
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        balance.setUsedDays(balance.getUsedDays() + leaveRequest.getTotalDays());
        leaveBalanceRepository.save(balance);

        return toResponse(leaveRequest);
    }

    public List<LeaveRequestResponse> getByEmployee(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approve(Long leaveId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Leave request is not in PENDING status");
        }
        leave.setStatus(LeaveStatus.APPROVED);
        leaveRequestRepository.save(leave);
    }

    @Transactional
    public void reject(Long leaveId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Leave request is not in PENDING status");
        }
        leave.setStatus(LeaveStatus.REJECTED);
        leaveRequestRepository.save(leave);

        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveType_IdAndYear(
                        leave.getEmployee().getId(), leave.getLeaveType().getId(), leave.getStartDate().getYear())
                .orElseThrow(() -> new ResourceNotFoundException("LeaveBalance"));
        balance.setUsedDays(Math.max(0, balance.getUsedDays() - leave.getTotalDays()));
        leaveBalanceRepository.save(balance);
    }

    public List<LeaveType> listLeaveTypes() {
        return leaveTypeRepository.findByActiveTrue();
    }

    private LeaveRequestResponse toResponse(LeaveRequest lr) {
        return LeaveRequestResponse.builder()
                .id(lr.getId())
                .employeeId(lr.getEmployee().getId())
                .employeeName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName())
                .leaveTypeName(lr.getLeaveType().getName())
                .startDate(lr.getStartDate())
                .endDate(lr.getEndDate())
                .totalDays(lr.getTotalDays())
                .reason(lr.getReason())
                .status(lr.getStatus().name())
                .build();
    }
}
