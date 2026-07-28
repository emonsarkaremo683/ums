package com.smartuniversity.admission.service;

import com.smartuniversity.admission.dto.AdmitCardResponse;
import com.smartuniversity.admission.entity.AdmitCard;
import com.smartuniversity.admission.entity.Applicant;
import com.smartuniversity.admission.mapper.AdmitCardMapper;
import com.smartuniversity.admission.repository.AdmitCardRepository;
import com.smartuniversity.admission.repository.ApplicantRepository;
import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AdmitCardService {

    private final AdmitCardRepository admitCardRepository;
    private final ApplicantRepository applicantRepository;
    private final AdmitCardMapper admitCardMapper;

    public AdmitCardService(AdmitCardRepository admitCardRepository,
                            ApplicantRepository applicantRepository,
                            AdmitCardMapper admitCardMapper) {
        this.admitCardRepository = admitCardRepository;
        this.applicantRepository = applicantRepository;
        this.admitCardMapper = admitCardMapper;
    }

    @Transactional
    public AdmitCardResponse generate(Long applicantId) {
        Applicant applicant = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant", "id", applicantId));

        if (!applicant.isPaymentCompleted()) {
            throw new BadRequestException("Payment not completed. Cannot generate admit card.");
        }

        if (admitCardRepository.findByApplicantId(applicantId).isPresent()) {
            throw new BadRequestException("Admit card already generated for this applicant");
        }

        AdmitCard admitCard = AdmitCard.builder()
                .applicant(applicant)
                .admitCardNumber("AC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        admitCard = admitCardRepository.save(admitCard);
        return admitCardMapper.toResponse(admitCard);
    }

    public AdmitCardResponse getByApplicantId(Long applicantId) {
        AdmitCard admitCard = admitCardRepository.findByApplicantId(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("AdmitCard", "applicantId", applicantId));
        return admitCardMapper.toResponse(admitCard);
    }
}
