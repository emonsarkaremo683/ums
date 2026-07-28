package com.smartuniversity.admission.service;

import com.smartuniversity.admission.dto.*;
import com.smartuniversity.admission.entity.AdmissionCircular;
import com.smartuniversity.admission.entity.Faculty;
import com.smartuniversity.admission.mapper.AdmissionCircularMapper;
import com.smartuniversity.admission.repository.AdmissionCircularRepository;
import com.smartuniversity.admission.repository.FacultyRepository;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdmissionCircularService {

    private final AdmissionCircularRepository circularRepository;
    private final FacultyRepository facultyRepository;
    private final AdmissionCircularMapper circularMapper;

    public AdmissionCircularService(AdmissionCircularRepository circularRepository,
                                    FacultyRepository facultyRepository,
                                    AdmissionCircularMapper circularMapper) {
        this.circularRepository = circularRepository;
        this.facultyRepository = facultyRepository;
        this.circularMapper = circularMapper;
    }

    @Transactional
    public AdmissionCircularResponse create(AdmissionCircularRequest request) {
        Faculty faculty = facultyRepository.findById(request.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.getFacultyId()));
        AdmissionCircular circular = circularMapper.toEntity(request);
        circular.setFaculty(faculty);
        circular = circularRepository.save(circular);
        return circularMapper.toResponse(circular);
    }

    public AdmissionCircularResponse getById(Long id) {
        AdmissionCircular circular = circularRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AdmissionCircular", "id", id));
        return circularMapper.toResponse(circular);
    }

    public Page<AdmissionCircularResponse> getAll(Pageable pageable) {
        return circularRepository.findAll(pageable).map(circularMapper::toResponse);
    }

    public List<AdmissionCircularResponse> getByFacultyAndSession(Long facultyId, String session) {
        return circularRepository.findByFacultyIdAndSessionAndActiveTrue(facultyId, session).stream()
                .map(circularMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdmissionCircularResponse update(Long id, AdmissionCircularRequest request) {
        AdmissionCircular circular = circularRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AdmissionCircular", "id", id));
        if (request.getFacultyId() != null) {
            Faculty faculty = facultyRepository.findById(request.getFacultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.getFacultyId()));
            circular.setFaculty(faculty);
        }
        circularMapper.updateFromRequest(request, circular);
        circular = circularRepository.save(circular);
        return circularMapper.toResponse(circular);
    }

    @Transactional
    public void deactivate(Long id) {
        AdmissionCircular circular = circularRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AdmissionCircular", "id", id));
        circular.setActive(false);
        circularRepository.save(circular);
    }
}
