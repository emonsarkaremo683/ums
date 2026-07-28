package com.smartuniversity.student.repository;

import com.smartuniversity.student.entity.StudentAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudentAttendanceRepository extends JpaRepository<StudentAttendance, Long> {
    Optional<StudentAttendance> findByStudentIdAndDate(Long studentId, LocalDate date);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StudentAttendance s WHERE s.student.id = :studentId AND s.date = :date")
    Optional<StudentAttendance> findByStudentIdAndDateWithLock(Long studentId, LocalDate date);

    List<StudentAttendance> findByStudentIdAndDateBetween(Long studentId, LocalDate start, LocalDate end);
}
