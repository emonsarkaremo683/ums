package com.smartuniversity.academic.repository;

import com.smartuniversity.academic.entity.StudentResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentResultRepository extends JpaRepository<StudentResult, Long> {
    List<StudentResult> findByStudentIdAndAcademicSessionId(Long studentId, Long sessionId);
    List<StudentResult> findByCourseIdAndAcademicSessionId(Long courseId, Long sessionId);
    List<StudentResult> findByStudentIdAndPublishedTrue(Long studentId);
    Optional<StudentResult> findByStudentIdAndCourseIdAndAcademicSessionId(Long studentId, Long courseId, Long sessionId);
}
