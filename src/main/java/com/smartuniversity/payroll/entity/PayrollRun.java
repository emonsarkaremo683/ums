package com.smartuniversity.payroll.entity;

import com.smartuniversity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "payroll_runs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"month", "year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRun extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String month;

    @Column(nullable = false)
    private int year;

    @Column(nullable = false)
    private LocalDate runDate;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(nullable = false)
    private int totalEmployees;
}
