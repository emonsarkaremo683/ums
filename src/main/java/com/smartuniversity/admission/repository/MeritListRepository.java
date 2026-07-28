package com.smartuniversity.admission.repository;

import com.smartuniversity.admission.entity.MeritList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeritListRepository extends JpaRepository<MeritList, Long> {
    List<MeritList> findByCircularIdAndPublishedTrue(Long circularId);
    List<MeritList> findByCircularIdAndPublishedFalse(Long circularId);
    List<MeritList> findByCircularIdAndDepartmentIdAndPublishedTrue(Long circularId, Long departmentId);
    Optional<MeritList> findByApplicantId(Long applicantId);
}
