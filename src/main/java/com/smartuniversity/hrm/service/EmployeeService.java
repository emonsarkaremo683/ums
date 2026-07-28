package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.mapper.EmployeeMapper;
import com.smartuniversity.hrm.repository.*;
import com.smartuniversity.security.entity.User;
import com.smartuniversity.security.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DesignationRepository designationRepository;
    private final GradeRepository gradeRepository;
    private final UserRepository userRepository;
    private final EmployeeMapper mapper;

    public EmployeeService(EmployeeRepository employeeRepository, DesignationRepository designationRepository,
                           GradeRepository gradeRepository, UserRepository userRepository, EmployeeMapper mapper) {
        this.employeeRepository = employeeRepository;
        this.designationRepository = designationRepository;
        this.gradeRepository = gradeRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        Employee employee = Employee.builder()
                .user(user)
                .employeeId("EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .firstName(request.getFirstName())
                .middleName(request.getMiddleName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .employeeType(request.getEmployeeType())
                .department(request.getDepartment())
                .active(true)
                .build();

        if (request.getDesignationId() != null) {
            employee.setDesignation(designationRepository.findById(request.getDesignationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Designation", "id", request.getDesignationId())));
        }
        if (request.getGradeId() != null) {
            employee.setGrade(gradeRepository.findById(request.getGradeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Grade", "id", request.getGradeId())));
        }

        employee = employeeRepository.save(employee);
        return mapper.toResponse(employee);
    }

    public EmployeeResponse getById(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return mapper.toResponse(emp);
    }

    public EmployeeResponse getByUserId(Long userId) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "userId", userId));
        return mapper.toResponse(emp);
    }

    public Page<EmployeeResponse> getAll(Pageable pageable) {
        return employeeRepository.findAll(pageable).map(mapper::toResponse);
    }

    public List<EmployeeResponse> getAllActive() {
        return employeeRepository.findByActiveTrue().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        emp.setFirstName(request.getFirstName());
        emp.setMiddleName(request.getMiddleName());
        emp.setLastName(request.getLastName());
        emp.setPhone(request.getPhone());
        emp.setDepartment(request.getDepartment());
        if (request.getDesignationId() != null) {
            emp.setDesignation(designationRepository.findById(request.getDesignationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Designation", "id", request.getDesignationId())));
        }
        if (request.getGradeId() != null) {
            emp.setGrade(gradeRepository.findById(request.getGradeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Grade", "id", request.getGradeId())));
        }
        emp = employeeRepository.save(emp);
        return mapper.toResponse(emp);
    }

    @Transactional
    public void deactivate(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        emp.setActive(false);
        employeeRepository.save(emp);
    }
}
