package com.smartuniversity.admission.mapper;

import com.smartuniversity.admission.dto.ApplicantRequest;
import com.smartuniversity.admission.dto.ApplicantResponse;
import com.smartuniversity.admission.entity.Applicant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ApplicantMapper {

    @Mapping(target = "circularId", source = "circular.id")
    @Mapping(target = "circularTitle", source = "circular.title")
    @Mapping(target = "preferredDepartmentId", expression = "java(applicant.getPreferredDepartment() != null ? applicant.getPreferredDepartment().getId() : null)")
    @Mapping(target = "preferredDepartmentName", expression = "java(applicant.getPreferredDepartment() != null ? applicant.getPreferredDepartment().getName() : null)")
    @Mapping(target = "sscResult", ignore = true)
    @Mapping(target = "hscResult", ignore = true)
    @Mapping(target = "documents", ignore = true)
    ApplicantResponse toResponse(Applicant applicant);

    @Mapping(target = "circular", ignore = true)
    @Mapping(target = "preferredDepartment", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "paymentCompleted", ignore = true)
    @Mapping(target = "applicationNumber", ignore = true)
    @Mapping(target = "meritScore", ignore = true)
    Applicant toEntity(ApplicantRequest request);
}
