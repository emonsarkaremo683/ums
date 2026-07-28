package com.smartuniversity.admission.repository;

import com.smartuniversity.admission.entity.Applicant;
import com.smartuniversity.common.enums.AdmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicantRepository extends JpaRepository<Applicant, Long> {
    Optional<Applicant> findByUserId(Long userId);
    Optional<Applicant> findByUserIdAndCircularId(Long userId, Long circularId);
    Optional<Applicant> findByApplicationNumber(String applicationNumber);
    Page<Applicant> findByCircularId(Long circularId, Pageable pageable);
    Page<Applicant> findByCircularIdAndStatus(Long circularId, AdmissionStatus status, Pageable pageable);
    long countByCircularIdAndStatus(Long circularId, AdmissionStatus status);
}
