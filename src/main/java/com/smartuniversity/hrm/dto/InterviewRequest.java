package com.smartuniversity.hrm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InterviewRequest {
    @NotNull(message = "Scheduled date/time is required")
    private LocalDateTime scheduledAt;

    private String location;
    private String notes;
}
