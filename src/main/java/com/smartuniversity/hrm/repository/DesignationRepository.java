package com.smartuniversity.hrm.repository;

import com.smartuniversity.hrm.entity.Designation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DesignationRepository extends JpaRepository<Designation, Long> {
    List<Designation> findByActiveTrue();
}
