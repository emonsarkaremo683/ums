package com.smartuniversity.admission.service;

import com.smartuniversity.admission.dto.MeritListResponse;
import com.smartuniversity.admission.entity.AdmissionCircular;
import com.smartuniversity.admission.entity.Applicant;
import com.smartuniversity.admission.entity.Department;
import com.smartuniversity.admission.entity.MeritList;
import com.smartuniversity.admission.mapper.MeritListMapper;
import com.smartuniversity.admission.repository.AdmissionCircularRepository;
import com.smartuniversity.admission.repository.ApplicantRepository;
import com.smartuniversity.admission.repository.DepartmentRepository;
import com.smartuniversity.admission.repository.MeritListRepository;
import com.smartuniversity.common.enums.AdmissionStatus;
import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MeritListService {

    private final MeritListRepository meritListRepository;
    private final AdmissionCircularRepository circularRepository;
    private final ApplicantRepository applicantRepository;
    private final DepartmentRepository departmentRepository;
    private final MeritListMapper meritListMapper;

    public MeritListService(MeritListRepository meritListRepository,
                            AdmissionCircularRepository circularRepository,
                            ApplicantRepository applicantRepository,
                            DepartmentRepository departmentRepository,
                            MeritListMapper meritListMapper) {
        this.meritListRepository = meritListRepository;
        this.circularRepository = circularRepository;
        this.applicantRepository = applicantRepository;
        this.departmentRepository = departmentRepository;
        this.meritListMapper = meritListMapper;
    }

    @Transactional
    public List<MeritListResponse> generateForCircular(Long circularId) {
        AdmissionCircular circular = circularRepository.findById(circularId)
                .orElseThrow(() -> new ResourceNotFoundException("AdmissionCircular", "id", circularId));

        List<Applicant> verifiedApplicants = applicantRepository
                .findByCircularIdAndStatus(circularId, AdmissionStatus.PAYMENT_VERIFIED, org.springframework.data.domain.Pageable.unpaged())
                .getContent();

        meritListRepository.deleteAll(meritListRepository.findByCircularIdAndPublishedTrue(circularId));

        List<MeritList> meritEntries = verifiedApplicants.stream()
                .sorted(Comparator.comparing(Applicant::getMeritScore, Comparator.reverseOrder())
                        .thenComparing(Applicant::getId))
                .map(applicant -> MeritList.builder()
                        .circular(circular)
                        .department(applicant.getPreferredDepartment())
                        .applicant(applicant)
                        .meritScore(applicant.getMeritScore() != null ? applicant.getMeritScore() : 0.0)
                        .build())
                .collect(Collectors.toList());

        int position = 1;
        for (MeritList entry : meritEntries) {
            entry.setMeritPosition(position++);
        }

        meritEntries = meritListRepository.saveAll(meritEntries);
        return meritEntries.stream().map(meritListMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void publish(Long circularId) {
        List<MeritList> entries = meritListRepository.findByCircularIdAndPublishedFalse(circularId);
        if (entries.isEmpty()) {
            throw new BadRequestException("No merit list generated for this circular");
        }
        for (MeritList entry : entries) {
            entry.setPublished(true);
            entry.setPublishedAt(LocalDateTime.now());
        }
        meritListRepository.saveAll(entries);
    }

    public List<MeritListResponse> getPublishedByCircular(Long circularId) {
        return meritListRepository.findByCircularIdAndPublishedTrue(circularId).stream()
                .map(meritListMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<MeritListResponse> getPublishedByCircularAndDepartment(Long circularId, Long departmentId) {
        return meritListRepository.findByCircularIdAndDepartmentIdAndPublishedTrue(circularId, departmentId).stream()
                .map(meritListMapper::toResponse)
                .collect(Collectors.toList());
    }

    public MeritListResponse getByApplicantId(Long applicantId) {
        MeritList merit = meritListRepository.findByApplicantId(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("MeritList", "applicantId", applicantId));
        return meritListMapper.toResponse(merit);
    }
}
