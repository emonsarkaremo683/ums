package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.mapper.GradeMapper;
import com.smartuniversity.hrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GradeService {

    private final GradeRepository repository;
    private final GradeMapper mapper;

    public GradeService(GradeRepository repository, GradeMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional
    public GradeResponse create(GradeRequest request) {
        Grade g = Grade.builder()
                .name(request.getName())
                .basicSalary(request.getBasicSalary())
                .houseAllowance(request.getHouseAllowance())
                .medicalAllowance(request.getMedicalAllowance())
                .transportAllowance(request.getTransportAllowance())
                .active(true)
                .build();
        g = repository.save(g);
        return mapper.toResponse(g);
    }

    public GradeResponse getById(Long id) {
        Grade g = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grade", "id", id));
        return mapper.toResponse(g);
    }

    public Page<GradeResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    public List<GradeResponse> getAllActive() {
        return repository.findByActiveTrue().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GradeResponse update(Long id, GradeRequest request) {
        Grade g = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grade", "id", id));
        g.setName(request.getName());
        g.setBasicSalary(request.getBasicSalary());
        g.setHouseAllowance(request.getHouseAllowance());
        g.setMedicalAllowance(request.getMedicalAllowance());
        g.setTransportAllowance(request.getTransportAllowance());
        g = repository.save(g);
        return mapper.toResponse(g);
    }

    @Transactional
    public void deactivate(Long id) {
        Grade g = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grade", "id", id));
        g.setActive(false);
        repository.save(g);
    }
}
