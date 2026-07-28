package com.smartuniversity.hrm.service;

import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.common.util.FaceDetector;
import com.smartuniversity.common.util.FaceEncoder;
import com.smartuniversity.common.util.FaceMatcher;
import com.smartuniversity.hrm.dto.FaceVerifyResponse;
import com.smartuniversity.hrm.entity.Employee;
import com.smartuniversity.hrm.entity.EmployeeFaceData;
import com.smartuniversity.hrm.repository.EmployeeFaceDataRepository;
import com.smartuniversity.hrm.repository.EmployeeRepository;
import org.bytedeco.opencv.opencv_core.Mat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EmployeeFaceService {

    private final EmployeeFaceDataRepository faceDataRepository;
    private final EmployeeRepository employeeRepository;
    private final FaceDetector faceDetector;
    private final FaceEncoder faceEncoder;
    private final FaceMatcher faceMatcher;

    public EmployeeFaceService(EmployeeFaceDataRepository faceDataRepository,
                                EmployeeRepository employeeRepository,
                                FaceDetector faceDetector,
                                FaceEncoder faceEncoder,
                                FaceMatcher faceMatcher) {
        this.faceDataRepository = faceDataRepository;
        this.employeeRepository = employeeRepository;
        this.faceDetector = faceDetector;
        this.faceEncoder = faceEncoder;
        this.faceMatcher = faceMatcher;
    }

    @Transactional
    public void enrollFace(Long employeeId, String base64Image) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        Optional<Mat> faceOpt = faceDetector.detectFace(base64Image);
        if (faceOpt.isEmpty()) {
            throw new BadRequestException("No face detected in the image");
        }

        Mat face = faceOpt.get();
        float[] encoding = faceEncoder.encodeFace(face);
        byte[] encodingBytes = faceEncoder.encodeToBytes(encoding);

        Optional<EmployeeFaceData> existing = faceDataRepository.findByEmployeeId(employeeId);
        EmployeeFaceData faceData = existing.orElse(
                EmployeeFaceData.builder()
                        .employee(employee)
                        .build()
        );

        faceData.setFaceEncoding(encodingBytes);
        faceData.setEnrolledAt(LocalDateTime.now());
        faceDataRepository.save(faceData);
    }

    public FaceVerifyResponse verifyFace(String base64Image) {
        Optional<Mat> faceOpt = faceDetector.detectFace(base64Image);
        if (faceOpt.isEmpty()) {
            return FaceVerifyResponse.builder()
                    .matched(false)
                    .message("No face detected in the image")
                    .build();
        }

        Mat face = faceOpt.get();
        float[] inputEncoding = faceEncoder.encodeFace(face);

        // TODO: Performance — brute-force scan of all face encodings. For production scale,
        // consider using a vector similarity search (e.g., pgvector, FAISS, or a dedicated
        // face recognition service) instead of loading all encodings into memory.
        List<EmployeeFaceData> allFaces = faceDataRepository.findAll();

        double bestDistance = Double.MAX_VALUE;
        EmployeeFaceData bestMatch = null;

        for (EmployeeFaceData faceData : allFaces) {
            float[] storedEncoding = faceEncoder.decodeFromBytes(faceData.getFaceEncoding());
            double distance = faceMatcher.calculateDistance(inputEncoding, storedEncoding);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = faceData;
            }
        }

        if (bestMatch == null || !faceMatcher.isMatch(inputEncoding, faceEncoder.decodeFromBytes(bestMatch.getFaceEncoding()))) {
            return FaceVerifyResponse.builder()
                    .matched(false)
                    .message("Face not recognized")
                    .build();
        }

        Employee employee = bestMatch.getEmployee();
        return FaceVerifyResponse.builder()
                .matched(true)
                .employeeId(employee.getId())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .confidence(1.0 - bestDistance)
                .message("Face verified successfully")
                .build();
    }

    public boolean isEnrolled(Long employeeId) {
        return faceDataRepository.existsByEmployeeId(employeeId);
    }

    public boolean isEnrolledByUserId(Long userId) {
        return faceDataRepository.findByEmployeeUserId(userId).isPresent();
    }
}
