package com.smartuniversity.admission.service;

import com.smartuniversity.admission.dto.*;
import com.smartuniversity.admission.entity.Applicant;
import com.smartuniversity.admission.entity.ApplicantDocument;
import com.smartuniversity.admission.mapper.ApplicantDocumentMapper;
import com.smartuniversity.admission.repository.ApplicantDocumentRepository;
import com.smartuniversity.admission.repository.ApplicantRepository;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ApplicantDocumentService {

    private static final Logger log = LoggerFactory.getLogger(ApplicantDocumentService.class);

    private final ApplicantDocumentRepository documentRepository;
    private final ApplicantRepository applicantRepository;
    private final ApplicantDocumentMapper documentMapper;

    public ApplicantDocumentService(ApplicantDocumentRepository documentRepository,
                                    ApplicantRepository applicantRepository,
                                    ApplicantDocumentMapper documentMapper) {
        this.documentRepository = documentRepository;
        this.applicantRepository = applicantRepository;
        this.documentMapper = documentMapper;
    }

    @Transactional
    public ApplicantDocumentResponse upload(ApplicantDocumentRequest request) {
        Applicant applicant = applicantRepository.findById(request.getApplicantId())
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "id", request.getApplicantId()));
        ApplicantDocument document = documentMapper.toEntity(request);
        document.setApplicant(applicant);
        document = documentRepository.save(document);
        return documentMapper.toResponse(document);
    }

    public List<ApplicantDocumentResponse> getByApplicantId(Long applicantId) {
        return documentRepository.findByApplicantId(applicantId).stream()
                .map(documentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicantDocumentResponse verify(Long documentId) {
        ApplicantDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("ApplicantDocument", "id", documentId));
        document.setVerified(true);
        document = documentRepository.save(document);
        return documentMapper.toResponse(document);
    }

    @Transactional
    public void delete(Long documentId) {
        ApplicantDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("ApplicantDocument", "id", documentId));
        Path filePath = Paths.get(document.getFileUrl());
        try {
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            log.warn("Failed to delete file {} for document {}: {}", filePath, documentId, e.getMessage());
        }
        documentRepository.delete(document);
    }
}
