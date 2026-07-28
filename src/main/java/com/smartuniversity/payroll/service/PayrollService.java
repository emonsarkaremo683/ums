package com.smartuniversity.payroll.service;

import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.hrm.entity.Employee;
import com.smartuniversity.hrm.entity.Grade;
import com.smartuniversity.hrm.repository.EmployeeRepository;
import com.smartuniversity.payroll.entity.PayrollRun;
import com.smartuniversity.payroll.entity.Payslip;
import com.smartuniversity.payroll.entity.SalaryStructure;
import com.smartuniversity.payroll.repository.PayrollRunRepository;
import com.smartuniversity.payroll.repository.PayslipRepository;
import com.smartuniversity.payroll.repository.SalaryStructureRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PayrollService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayslipRepository payslipRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final EmployeeRepository employeeRepository;

    public PayrollService(PayrollRunRepository payrollRunRepository, PayslipRepository payslipRepository,
                          SalaryStructureRepository salaryStructureRepository, EmployeeRepository employeeRepository) {
        this.payrollRunRepository = payrollRunRepository;
        this.payslipRepository = payslipRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.employeeRepository = employeeRepository;
    }

    public Page<PayrollRun> getAllRuns(Pageable pageable) {
        return payrollRunRepository.findAll(pageable);
    }

    @Transactional
    public PayrollRun runPayroll(String month, int year) {
        if (payrollRunRepository.findByMonthAndYear(month, year).isPresent()) {
            throw new BadRequestException("Payroll already run for " + month + " " + year);
        }

        List<Employee> activeEmployees = employeeRepository.findByActiveTrue();

        PayrollRun payrollRun = PayrollRun.builder()
                .month(month)
                .year(year)
                .runDate(LocalDate.now())
                .totalEmployees(activeEmployees.size())
                .build();
        payrollRun = payrollRunRepository.save(payrollRun);

        List<Payslip> payslips = new ArrayList<>();
        for (Employee emp : activeEmployees) {
            if (emp.getGrade() == null) continue;

            SalaryStructure structure = salaryStructureRepository.findByGradeId(emp.getGrade().getId()).orElse(null);
            if (structure == null) continue;

            BigDecimal gross = structure.getBasicSalary()
                    .add(structure.getHouseAllowance())
                    .add(structure.getMedicalAllowance())
                    .add(structure.getTransportAllowance());

            BigDecimal tax = gross.multiply(structure.getTaxRate()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal pf = gross.multiply(structure.getProvidentFundRate()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal net = gross.subtract(tax).subtract(pf);

            Payslip payslip = Payslip.builder()
                    .payrollRun(payrollRun)
                    .employee(emp)
                    .basicSalary(structure.getBasicSalary())
                    .houseAllowance(structure.getHouseAllowance())
                    .medicalAllowance(structure.getMedicalAllowance())
                    .transportAllowance(structure.getTransportAllowance())
                    .grossSalary(gross)
                    .taxDeduction(tax)
                    .providentFundDeduction(pf)
                    .netSalary(net)
                    .build();
            payslips.add(payslip);
        }
        payslipRepository.saveAll(payslips);

        payrollRun.setCompleted(true);
        payrollRunRepository.save(payrollRun);

        return payrollRun;
    }

    public List<Payslip> getPayslipsByRun(Long payrollRunId) {
        return payslipRepository.findByPayrollRunId(payrollRunId);
    }

    public List<Payslip> getPayslipsByEmployee(Long employeeId) {
        return payslipRepository.findByEmployeeId(employeeId);
    }
}
