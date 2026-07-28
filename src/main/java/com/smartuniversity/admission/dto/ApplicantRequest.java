package com.smartuniversity.admission.dto;

import com.smartuniversity.common.enums.Gender;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ApplicantRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    private String middleName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
    private String phone;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    private String address;

    @NotNull(message = "Circular ID is required")
    private Long circularId;

    private Long preferredDepartmentId;

    @Valid
    private SscResultRequest sscResult;

    @Valid
    private HscResultRequest hscResult;

    @Valid
    private List<ApplicantDocumentInput> documents;
}
