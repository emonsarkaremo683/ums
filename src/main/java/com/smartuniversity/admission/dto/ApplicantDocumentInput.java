package com.smartuniversity.admission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApplicantDocumentInput {

    @NotBlank(message = "Document type is required")
    private String documentType;

    @NotBlank(message = "File name is required")
    private String fileName;

    @NotBlank(message = "File URL is required")
    private String fileUrl;
}
