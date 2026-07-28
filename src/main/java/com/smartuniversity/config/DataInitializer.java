package com.smartuniversity.config;

import com.smartuniversity.academic.entity.AcademicSession;
import com.smartuniversity.academic.repository.AcademicSessionRepository;
import com.smartuniversity.admission.entity.AdmissionCircular;
import com.smartuniversity.admission.entity.Department;
import com.smartuniversity.admission.entity.DocumentType;
import com.smartuniversity.admission.entity.Faculty;
import com.smartuniversity.admission.repository.AdmissionCircularRepository;
import com.smartuniversity.admission.repository.DepartmentRepository;
import com.smartuniversity.admission.repository.DocumentTypeRepository;
import com.smartuniversity.admission.repository.FacultyRepository;
import com.smartuniversity.common.enums.Permission;
import com.smartuniversity.hrm.entity.Designation;
import com.smartuniversity.hrm.entity.Grade;
import com.smartuniversity.hrm.repository.DesignationRepository;
import com.smartuniversity.hrm.repository.GradeRepository;
import com.smartuniversity.security.entity.Role;
import com.smartuniversity.security.entity.User;
import com.smartuniversity.security.repository.RoleRepository;
import com.smartuniversity.security.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Component
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final AdmissionCircularRepository circularRepository;
    private final DesignationRepository designationRepository;
    private final GradeRepository gradeRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final AcademicSessionRepository sessionRepository;

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository,
                           PasswordEncoder passwordEncoder, FacultyRepository facultyRepository,
                           DepartmentRepository departmentRepository,
                           AdmissionCircularRepository circularRepository,
                           DesignationRepository designationRepository,
                           GradeRepository gradeRepository,
                           DocumentTypeRepository documentTypeRepository,
                           AcademicSessionRepository sessionRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.circularRepository = circularRepository;
        this.designationRepository = designationRepository;
        this.gradeRepository = gradeRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting database seeding...");
        seedRoles();
        seedUsers();
        seedFacultiesAndDepartments();
        seedDesignationsAndGrades();
        seedDocumentTypes();
        seedAdmissionCirculars();
        seedAcademicSession();
        log.info("Database seeding complete.");
    }

    private void seedRoles() {
        createRoleIfNotExists("ADMIN", "System Administrator", Set.of(Permission.values()));
        createRoleIfNotExists("STUDENT", "Student", Set.of(Permission.USER_READ));
        createRoleIfNotExists("EMPLOYEE", "University Employee", Set.of(Permission.USER_READ, Permission.HRM_READ));
        createRoleIfNotExists("FACULTY", "Faculty Member", Set.of(Permission.USER_READ, Permission.ACADEMIC_READ, Permission.ACADEMIC_WRITE));
        createRoleIfNotExists("HR", "Human Resources", Set.of(Permission.USER_READ, Permission.HRM_READ, Permission.HRM_WRITE, Permission.HRM_APPROVE));
        createRoleIfNotExists("PAYROLL", "Payroll Officer", Set.of(Permission.USER_READ, Permission.PAYROLL_READ, Permission.PAYROLL_WRITE));
        createRoleIfNotExists("ADMISSION", "Admission Officer", Set.of(Permission.USER_READ, Permission.ADMISSION_READ, Permission.ADMISSION_WRITE, Permission.ADMISSION_APPROVE));
        createRoleIfNotExists("APPLICANT", "Applicant", Set.of(Permission.USER_READ, Permission.ADMISSION_READ));
        createRoleIfNotExists("REGISTRAR", "University Registrar", Set.of(Permission.USER_READ, Permission.STUDENT_READ, Permission.STUDENT_WRITE, Permission.ACADEMIC_READ, Permission.ACADEMIC_WRITE));
        createRoleIfNotExists("SUPER_ADMIN", "Super Administrator", Set.of(Permission.values()));
    }

    private void seedUsers() {
        Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        Role superAdminRole = roleRepository.findByName("SUPER_ADMIN").orElseThrow();
        Role hrRole = roleRepository.findByName("HR").orElseThrow();
        Role admissionRole = roleRepository.findByName("ADMISSION").orElseThrow();

        createUserIfNotExists("admin@smartuniversity.edu", "admin123", Set.of(adminRole));
        createUserIfNotExists("superadmin@smartuniversity.edu", "admin123", Set.of(superAdminRole, adminRole));
        createUserIfNotExists("hr@smartuniversity.edu", "admin123", Set.of(hrRole));
        createUserIfNotExists("admission@smartuniversity.edu", "admin123", Set.of(admissionRole));
    }

    private void seedFacultiesAndDepartments() {
        if (facultyRepository.count() > 0) return;

        Faculty sciTech = Faculty.builder().name("Faculty of Science & Technology").code("FST").description("Science and technology programs").active(true).build();
        Faculty business = Faculty.builder().name("Faculty of Business & Economics").code("FBE").description("Business and economics programs").active(true).build();
        Faculty arts = Faculty.builder().name("Faculty of Arts & Humanities").code("FAH").description("Arts and humanities programs").active(true).build();
        Faculty medicine = Faculty.builder().name("Faculty of Medicine").code("FMD").description("Medical and health science programs").active(true).build();

        sciTech = facultyRepository.save(sciTech);
        business = facultyRepository.save(business);
        arts = facultyRepository.save(arts);
        medicine = facultyRepository.save(medicine);

        departmentRepository.save(Department.builder().name("Computer Science & Engineering").code("CSE").faculty(sciTech).active(true).build());
        departmentRepository.save(Department.builder().name("Electrical & Electronic Engineering").code("EEE").faculty(sciTech).active(true).build());
        departmentRepository.save(Department.builder().name("Mathematics & Physics").code("MPH").faculty(sciTech).active(true).build());
        departmentRepository.save(Department.builder().name("Business Administration").code("BBA").faculty(business).active(true).build());
        departmentRepository.save(Department.builder().name("Accounting & Finance").code("ACF").faculty(business).active(true).build());
        departmentRepository.save(Department.builder().name("Economics").code("ECO").faculty(business).active(true).build());
        departmentRepository.save(Department.builder().name("English Literature").code("ENL").faculty(arts).active(true).build());
        departmentRepository.save(Department.builder().name("Bangla").code("BAN").faculty(arts).active(true).build());
        departmentRepository.save(Department.builder().name("History & Civilization").code("HIS").faculty(arts).active(true).build());
        departmentRepository.save(Department.builder().name("Medicine & Surgery").code("MED").faculty(medicine).active(true).build());
        departmentRepository.save(Department.builder().name("Pharmacy").code("PHR").faculty(medicine).active(true).build());

        log.info("Seeded {} faculties and their departments.", 4);
    }

    private void seedDesignationsAndGrades() {
        if (designationRepository.count() > 0) return;

        designationRepository.save(Designation.builder().name("Professor").description("Full Professor").level(1).active(true).build());
        designationRepository.save(Designation.builder().name("Associate Professor").description("Associate Professor").level(2).active(true).build());
        designationRepository.save(Designation.builder().name("Assistant Professor").description("Assistant Professor").level(3).active(true).build());
        designationRepository.save(Designation.builder().name("Lecturer").description("Lecturer").level(4).active(true).build());
        designationRepository.save(Designation.builder().name("Senior Lecturer").description("Senior Lecturer").level(3).active(true).build());
        designationRepository.save(Designation.builder().name("Director").description("Director").level(1).active(true).build());
        designationRepository.save(Designation.builder().name("Officer").description("Officer").level(5).active(true).build());
        designationRepository.save(Designation.builder().name("Assistant Officer").description("Assistant Officer").level(6).active(true).build());
        designationRepository.save(Designation.builder().name("Admin Assistant").description("Administrative Assistant").level(7).active(true).build());

        gradeRepository.save(Grade.builder().name("G1").basicSalary(new BigDecimal("80000")).houseAllowance(new BigDecimal("16000")).medicalAllowance(new BigDecimal("5000")).transportAllowance(new BigDecimal("5000")).active(true).build());
        gradeRepository.save(Grade.builder().name("G2").basicSalary(new BigDecimal("60000")).houseAllowance(new BigDecimal("12000")).medicalAllowance(new BigDecimal("4000")).transportAllowance(new BigDecimal("4000")).active(true).build());
        gradeRepository.save(Grade.builder().name("G3").basicSalary(new BigDecimal("45000")).houseAllowance(new BigDecimal("9000")).medicalAllowance(new BigDecimal("3000")).transportAllowance(new BigDecimal("3000")).active(true).build());
        gradeRepository.save(Grade.builder().name("G4").basicSalary(new BigDecimal("35000")).houseAllowance(new BigDecimal("7000")).medicalAllowance(new BigDecimal("2500")).transportAllowance(new BigDecimal("2500")).active(true).build());
        gradeRepository.save(Grade.builder().name("G5").basicSalary(new BigDecimal("25000")).houseAllowance(new BigDecimal("5000")).medicalAllowance(new BigDecimal("2000")).transportAllowance(new BigDecimal("2000")).active(true).build());

        log.info("Seeded {} designations and {} grades.", 9, 5);
    }

    private void seedDocumentTypes() {
        if (documentTypeRepository.count() > 0) return;

        documentTypeRepository.save(DocumentType.builder().name("SSC Certificate").description("Secondary School Certificate").required(true).allowedFormats("pdf,jpg,png").active(true).build());
        documentTypeRepository.save(DocumentType.builder().name("HSC Certificate").description("Higher Secondary Certificate").required(true).allowedFormats("pdf,jpg,png").active(true).build());
        documentTypeRepository.save(DocumentType.builder().name("Transcript").description("Academic transcript").required(false).allowedFormats("pdf").active(true).build());
        documentTypeRepository.save(DocumentType.builder().name("National ID").description("National ID card copy").required(false).allowedFormats("pdf,jpg,png").active(true).build());
        documentTypeRepository.save(DocumentType.builder().name("Photo").description("Passport size photograph").required(true).allowedFormats("jpg,png").active(true).build());

        log.info("Seeded {} document types.", 5);
    }

    private void seedAdmissionCirculars() {
        if (circularRepository.count() > 0) return;

        Faculty sciTech = facultyRepository.findByCode("FST").orElse(null);
        Faculty business = facultyRepository.findByCode("FBE").orElse(null);

        if (sciTech != null) {
            circularRepository.save(AdmissionCircular.builder()
                    .title("Spring 2026 Admission — Science & Technology")
                    .session("Spring 2026")
                    .faculty(sciTech)
                    .registrationStartDate(LocalDate.now().minusDays(10))
                    .registrationEndDate(LocalDate.now().plusDays(30))
                    .applicationFee(new BigDecimal("1500"))
                    .totalSeats(120)
                    .active(true)
                    .build());
        }

        if (business != null) {
            circularRepository.save(AdmissionCircular.builder()
                    .title("Spring 2026 Admission — Business & Economics")
                    .session("Spring 2026")
                    .faculty(business)
                    .registrationStartDate(LocalDate.now().minusDays(10))
                    .registrationEndDate(LocalDate.now().plusDays(30))
                    .applicationFee(new BigDecimal("1500"))
                    .totalSeats(100)
                    .active(true)
                    .build());
        }

        if (sciTech != null) {
            circularRepository.save(AdmissionCircular.builder()
                    .title("Summer 2026 Admission — Science & Technology")
                    .session("Summer 2026")
                    .faculty(sciTech)
                    .registrationStartDate(LocalDate.now().minusDays(5))
                    .registrationEndDate(LocalDate.now().plusDays(15))
                    .applicationFee(new BigDecimal("1500"))
                    .totalSeats(80)
                    .active(true)
                    .build());
        }

        log.info("Seeded {} admission circulars.", 3);
    }

    private void seedAcademicSession() {
        if (sessionRepository.count() > 0) return;

        sessionRepository.save(AcademicSession.builder()
                .name("Spring 2026")
                .startYear(2026)
                .endYear(2026)
                .active(true)
                .build());

        log.info("Seeded academic session: Spring 2026");
    }

    private void createRoleIfNotExists(String name, String description, Set<Permission> permissions) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = Role.builder()
                    .name(name)
                    .description(description)
                    .permissions(permissions)
                    .build();
            roleRepository.save(role);
            log.info("Created role: {}", name);
        }
    }

    private void createUserIfNotExists(String email, String password, Set<Role> roles) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .enabled(true)
                    .accountNonLocked(true)
                    .roles(roles)
                    .build();
            userRepository.save(user);
            log.info("Created user: {} with roles: {}", email, roles.stream().map(Role::getName).toList());
        }
    }
}
