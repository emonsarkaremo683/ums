package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.dto.*;
import com.smartuniversity.hrm.entity.*;
import com.smartuniversity.hrm.mapper.DesignationMapper;
import com.smartuniversity.hrm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DesignationService {

    private final DesignationRepository repository;
    private final DesignationMapper mapper;

    public DesignationService(DesignationRepository repository, DesignationMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional
    public DesignationResponse create(DesignationRequest request) {
        Designation d = Designation.builder()
                .name(request.getName())
                .description(request.getDescription())
                .level(request.getLevel())
                .active(true)
                .build();
        d = repository.save(d);
        return mapper.toResponse(d);
    }

    public DesignationResponse getById(Long id) {
        Designation d = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation", "id", id));
        return mapper.toResponse(d);
    }

    public Page<DesignationResponse> getAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    public List<DesignationResponse> getAllActive() {
        return repository.findByActiveTrue().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DesignationResponse update(Long id, DesignationRequest request) {
        Designation d = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation", "id", id));
        d.setName(request.getName());
        d.setDescription(request.getDescription());
        d.setLevel(request.getLevel());
        d = repository.save(d);
        return mapper.toResponse(d);
    }

    @Transactional
    public void deactivate(Long id) {
        Designation d = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation", "id", id));
        d.setActive(false);
        repository.save(d);
    }
}
