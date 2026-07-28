package com.smartuniversity.academic.service;

import com.smartuniversity.academic.dto.YearResultResponse;
import com.smartuniversity.academic.mapper.YearResultMapper;
import com.smartuniversity.academic.repository.YearResultRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class YearResultService {

    private final YearResultRepository yearResultRepository;
    private final YearResultMapper yearResultMapper;

    public YearResultService(YearResultRepository yearResultRepository, YearResultMapper yearResultMapper) {
        this.yearResultRepository = yearResultRepository;
        this.yearResultMapper = yearResultMapper;
    }

    public List<YearResultResponse> getByStudent(Long studentId) {
        return yearResultRepository.findByStudentId(studentId).stream()
                .map(yearResultMapper::toResponse)
                .collect(Collectors.toList());
    }
}
