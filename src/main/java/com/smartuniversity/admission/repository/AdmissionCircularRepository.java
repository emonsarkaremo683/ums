package com.smartuniversity.admission.repository;

import com.smartuniversity.admission.entity.AdmissionCircular;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdmissionCircularRepository extends JpaRepository<AdmissionCircular, Long> {
    List<AdmissionCircular> findByActiveTrue();
    Page<AdmissionCircular> findByFacultyId(Long facultyId, Pageable pageable);
    List<AdmissionCircular> findBySessionAndActiveTrue(String session);
    List<AdmissionCircular> findByFacultyIdAndSessionAndActiveTrue(Long facultyId, String session);
}
