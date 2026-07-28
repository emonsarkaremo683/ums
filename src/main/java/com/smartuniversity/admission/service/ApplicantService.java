package com.smartuniversity.admission.service;

import com.smartuniversity.admission.dto.*;
import com.smartuniversity.admission.entity.AdmissionCircular;
import com.smartuniversity.admission.entity.Applicant;
import com.smartuniversity.admission.entity.ApplicantDocument;
import com.smartuniversity.admission.entity.Department;
import com.smartuniversity.admission.entity.HscResult;
import com.smartuniversity.admission.entity.SscResult;
import com.smartuniversity.admission.mapper.ApplicantDocumentMapper;
import com.smartuniversity.admission.mapper.ApplicantMapper;
import com.smartuniversity.admission.mapper.HscResultMapper;
import com.smartuniversity.admission.mapper.SscResultMapper;
import com.smartuniversity.admission.repository.AdmissionCircularRepository;
import com.smartuniversity.admission.repository.ApplicantDocumentRepository;
import com.smartuniversity.admission.repository.ApplicantRepository;
import com.smartuniversity.admission.repository.DepartmentRepository;
import com.smartuniversity.admission.repository.HscResultRepository;
import com.smartuniversity.admission.repository.SscResultRepository;
import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.security.entity.Role;
import com.smartuniversity.security.entity.User;
import com.smartuniversity.security.repository.RoleRepository;
import com.smartuniversity.security.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ApplicantService {

    private final ApplicantRepository applicantRepository;
    private final AdmissionCircularRepository circularRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ApplicantMapper applicantMapper;
    private final SscResultMapper sscResultMapper;
    private final HscResultMapper hscResultMapper;
    private final SscResultRepository sscResultRepository;
    private final HscResultRepository hscResultRepository;
    private final ApplicantDocumentRepository documentRepository;
    private final ApplicantDocumentMapper documentMapper;

    public ApplicantService(ApplicantRepository applicantRepository,
                            AdmissionCircularRepository circularRepository,
                            DepartmentRepository departmentRepository,
                            UserRepository userRepository,
                            RoleRepository roleRepository,
                            ApplicantMapper applicantMapper,
                            SscResultMapper sscResultMapper,
                            HscResultMapper hscResultMapper,
                            SscResultRepository sscResultRepository,
                            HscResultRepository hscResultRepository,
                            ApplicantDocumentRepository documentRepository,
                            ApplicantDocumentMapper documentMapper) {
        this.applicantRepository = applicantRepository;
        this.circularRepository = circularRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.applicantMapper = applicantMapper;
        this.sscResultMapper = sscResultMapper;
        this.hscResultMapper = hscResultMapper;
        this.sscResultRepository = sscResultRepository;
        this.hscResultRepository = hscResultRepository;
        this.documentRepository = documentRepository;
        this.documentMapper = documentMapper;
    }

    @Transactional
    public ApplicantResponse register(ApplicantRequest request, Long userId) {
        AdmissionCircular circular = circularRepository.findById(request.getCircularId())
                .orElseThrow(() -> new ResourceNotFoundException("AdmissionCircular", "id", request.getCircularId()));

        if (!circular.isActive()) {
            throw new BadRequestException("Registration is closed for this circular");
        }

        LocalDate now = LocalDate.now();
        if (now.isBefore(circular.getRegistrationStartDate()) || now.isAfter(circular.getRegistrationEndDate())) {
            throw new BadRequestException("Registration period has expired");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (applicantRepository.findByUserIdAndCircularId(userId, request.getCircularId()).isPresent()) {
            throw new BadRequestException("You have already applied for this circular");
        }

        Applicant applicant = applicantMapper.toEntity(request);
        applicant.setUser(user);
        applicant.setCircular(circular);
        applicant.setApplicationNumber("APP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        if (request.getPreferredDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getPreferredDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getPreferredDepartmentId()));
            applicant.setPreferredDepartment(dept);
        }

        applicant = applicantRepository.save(applicant);

        if (request.getSscResult() != null) {
            SscResult ssc = sscResultMapper.toEntity(request.getSscResult());
            ssc.setApplicant(applicant);
            sscResultRepository.save(ssc);
        }

        if (request.getHscResult() != null) {
            HscResult hsc = hscResultMapper.toEntity(request.getHscResult());
            hsc.setApplicant(applicant);
            hscResultRepository.save(hsc);
        }

        if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
            for (ApplicantDocumentInput docInput : request.getDocuments()) {
                ApplicantDocument doc = new ApplicantDocument();
                doc.setApplicant(applicant);
                doc.setDocumentType(docInput.getDocumentType());
                doc.setFileName(docInput.getFileName());
                doc.setFileUrl(docInput.getFileUrl());
                documentRepository.save(doc);
            }
        }

        roleRepository.findByName("APPLICANT").ifPresent(applicantRole -> {
            if (user.getRoles().stream().noneMatch(r -> r.getName().equals("APPLICANT"))) {
                user.getRoles().add(applicantRole);
                userRepository.save(user);
            }
        });

        return buildFullResponse(applicant);
    }

    public ApplicantResponse getById(Long id) {
        Applicant applicant = applicantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "id", id));
        return buildFullResponse(applicant);
    }

    public ApplicantResponse getByUserId(Long userId) {
        Applicant applicant = applicantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "userId", userId));
        return buildFullResponse(applicant);
    }

    public ApplicantResponse getByApplicationNumber(String applicationNumber) {
        Applicant applicant = applicantRepository.findByApplicationNumber(applicationNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "applicationNumber", applicationNumber));
        return buildFullResponse(applicant);
    }

    public Page<ApplicantResponse> getByCircularId(Long circularId, Pageable pageable) {
        return applicantRepository.findByCircularId(circularId, pageable).map(this::buildFullResponse);
    }

    @Transactional
    public ApplicantResponse updatePreferredDepartment(Long applicantId, Long departmentId) {
        Applicant applicant = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "id", applicantId));
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));
        applicant.setPreferredDepartment(dept);
        applicant = applicantRepository.save(applicant);
        return buildFullResponse(applicant);
    }

    @Transactional
    public ApplicantResponse updatePaymentStatus(Long applicantId, boolean completed) {
        Applicant applicant = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "id", applicantId));
        applicant.setPaymentCompleted(completed);
        if (completed) {
            applicant.setStatus(com.smartuniversity.common.enums.AdmissionStatus.PAYMENT_VERIFIED);
        }
        applicant = applicantRepository.save(applicant);
        return buildFullResponse(applicant);
    }

    @Transactional
    public ApplicantResponse updateEmailVerification(Long applicantId, boolean verified) {
        Applicant applicant = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "id", applicantId));
        applicant.setEmailVerified(verified);
        applicant = applicantRepository.save(applicant);
        return buildFullResponse(applicant);
    }

    private ApplicantResponse buildFullResponse(Applicant applicant) {
        ApplicantResponse response = applicantMapper.toResponse(applicant);

        sscResultRepository.findByApplicantId(applicant.getId())
                .ifPresent(ssc -> response.setSscResult(sscResultMapper.toResponse(ssc)));

        hscResultRepository.findByApplicantId(applicant.getId())
                .ifPresent(hsc -> response.setHscResult(hscResultMapper.toResponse(hsc)));

        List<ApplicantDocumentResponse> docs = documentRepository.findByApplicantId(applicant.getId()).stream()
                .map(documentMapper::toResponse)
                .collect(Collectors.toList());
        response.setDocuments(docs);

        return response;
    }
}
