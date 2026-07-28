package com.smartuniversity.academic.service;

import com.smartuniversity.academic.dto.*;
import com.smartuniversity.academic.entity.*;
import com.smartuniversity.academic.mapper.StudentResultMapper;
import com.smartuniversity.academic.repository.*;
import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.student.entity.Student;
import com.smartuniversity.student.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentResultService {

    private final StudentResultRepository resultRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final AcademicSessionRepository sessionRepository;
    private final YearResultRepository yearResultRepository;
    private final YearLevelRepository yearLevelRepository;
    private final StudentResultMapper resultMapper;

    public StudentResultService(StudentResultRepository resultRepository,
                                CourseRepository courseRepository,
                                StudentRepository studentRepository,
                                AcademicSessionRepository sessionRepository,
                                YearResultRepository yearResultRepository,
                                YearLevelRepository yearLevelRepository,
                                StudentResultMapper resultMapper) {
        this.resultRepository = resultRepository;
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
        this.sessionRepository = sessionRepository;
        this.yearResultRepository = yearResultRepository;
        this.yearLevelRepository = yearLevelRepository;
        this.resultMapper = resultMapper;
    }

    @Transactional
    public StudentResultResponse enterResult(StudentResultRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", request.getStudentId()));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));
        AcademicSession session = sessionRepository.findById(request.getAcademicSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("AcademicSession", "id", request.getAcademicSessionId()));

        if (resultRepository.findByStudentIdAndCourseIdAndAcademicSessionId(
                request.getStudentId(), request.getCourseId(), request.getAcademicSessionId()).isPresent()) {
            throw new BadRequestException("Result already exists for this student, course, and session");
        }

        StudentResult result = StudentResult.builder()
                .student(student)
                .course(course)
                .academicSession(session)
                .gradePoint(request.getGradePoint())
                .creditHours(request.getCreditHours())
                .letterGrade(request.getLetterGrade())
                .build();
        result = resultRepository.save(result);
        return resultMapper.toResponse(result);
    }

    public Page<StudentResultResponse> getAll(Pageable pageable) {
        return resultRepository.findAll(pageable).map(resultMapper::toResponse);
    }

    public List<StudentResultResponse> getByStudentAndSession(Long studentId, Long sessionId) {
        return resultRepository.findByStudentIdAndAcademicSessionId(studentId, sessionId).stream()
                .map(resultMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<StudentResultResponse> getByCourseAndSession(Long courseId, Long sessionId) {
        return resultRepository.findByCourseIdAndAcademicSessionId(courseId, sessionId).stream()
                .map(resultMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void publishResults(Long studentId, Long sessionId) {
        List<StudentResult> results = resultRepository.findByStudentIdAndAcademicSessionId(studentId, sessionId);
        if (results.isEmpty()) {
            throw new BadRequestException("No results found for this student in this session");
        }
        for (StudentResult result : results) {
            result.setPublished(true);
        }
        resultRepository.saveAll(results);

        recalculateYearResults(studentId, sessionId);
    }

    @Transactional
    public void recalculateYearResults(Long studentId, Long sessionId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        List<StudentResult> publishedResults = resultRepository.findByStudentIdAndPublishedTrue(studentId);

        Map<Long, List<StudentResult>> byYearLevel = publishedResults.stream()
                .collect(Collectors.groupingBy(r -> r.getCourse().getYearLevel().getId()));

        for (Map.Entry<Long, List<StudentResult>> entry : byYearLevel.entrySet()) {
            Long yearLevelId = entry.getKey();
            List<StudentResult> yearResults = entry.getValue();

            double totalCredits = yearResults.stream().mapToDouble(StudentResult::getCreditHours).sum();
            double totalGradePoints = yearResults.stream()
                    .mapToDouble(r -> r.getGradePoint() * r.getCreditHours()).sum();
            double gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;

            YearLevel yearLevel = yearLevelRepository.findById(yearLevelId)
                    .orElseThrow(() -> new ResourceNotFoundException("YearLevel", "id", yearLevelId));
            AcademicSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("AcademicSession", "id", sessionId));

            YearResult yearResult = yearResultRepository
                    .findByStudentIdAndYearLevelIdAndAcademicSessionId(studentId, yearLevelId, sessionId)
                    .orElse(YearResult.builder()
                            .student(student)
                            .yearLevel(yearLevel)
                            .academicSession(session)
                            .build());

            yearResult.setGpa(gpa);
            yearResult.setTotalCreditHours(totalCredits);
            yearResult.setTotalGradePoints(totalGradePoints);
            yearResultRepository.save(yearResult);
        }

        double totalAllCredits = publishedResults.stream().mapToDouble(StudentResult::getCreditHours).sum();
        double totalAllGradePoints = publishedResults.stream()
                .mapToDouble(r -> r.getGradePoint() * r.getCreditHours()).sum();
        double cgpa = totalAllCredits > 0 ? totalAllGradePoints / totalAllCredits : 0.0;
        student.setCgpa(cgpa);
        studentRepository.save(student);
    }

}
