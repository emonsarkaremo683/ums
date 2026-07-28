package com.smartuniversity.hrm.repository;

import com.smartuniversity.hrm.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByActiveTrue();
}
