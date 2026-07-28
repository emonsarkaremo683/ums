package com.smartuniversity.student.service;

import com.smartuniversity.common.exception.BadRequestException;
import com.smartuniversity.common.exception.ResourceNotFoundException;
import com.smartuniversity.common.util.FaceDetector;
import com.smartuniversity.common.util.FaceEncoder;
import com.smartuniversity.common.util.FaceMatcher;
import com.smartuniversity.student.dto.StudentFaceVerifyResponse;
import com.smartuniversity.student.entity.Student;
import com.smartuniversity.student.entity.StudentFaceData;
import com.smartuniversity.student.repository.StudentFaceDataRepository;
import com.smartuniversity.student.repository.StudentRepository;
import org.bytedeco.opencv.opencv_core.Mat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StudentFaceService {

    private final StudentFaceDataRepository faceDataRepository;
    private final StudentRepository studentRepository;
    private final FaceDetector faceDetector;
    private final FaceEncoder faceEncoder;
    private final FaceMatcher faceMatcher;

    public StudentFaceService(StudentFaceDataRepository faceDataRepository,
                               StudentRepository studentRepository,
                               FaceDetector faceDetector,
                               FaceEncoder faceEncoder,
                               FaceMatcher faceMatcher) {
        this.faceDataRepository = faceDataRepository;
        this.studentRepository = studentRepository;
        this.faceDetector = faceDetector;
        this.faceEncoder = faceEncoder;
        this.faceMatcher = faceMatcher;
    }

    @Transactional
    public void enrollFace(Long studentId, String base64Image) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        Optional<Mat> faceOpt = faceDetector.detectFace(base64Image);
        if (faceOpt.isEmpty()) {
            throw new BadRequestException("No face detected in the image");
        }

        Mat face = faceOpt.get();
        float[] encoding = faceEncoder.encodeFace(face);
        byte[] encodingBytes = faceEncoder.encodeToBytes(encoding);

        Optional<StudentFaceData> existing = faceDataRepository.findByStudentId(studentId);
        StudentFaceData faceData = existing.orElse(
                StudentFaceData.builder()
                        .student(student)
                        .build()
        );

        faceData.setFaceEncoding(encodingBytes);
        faceData.setEnrolledAt(LocalDateTime.now());
        faceDataRepository.save(faceData);
    }

    public StudentFaceVerifyResponse verifyFace(String base64Image) {
        Optional<Mat> faceOpt = faceDetector.detectFace(base64Image);
        if (faceOpt.isEmpty()) {
            return StudentFaceVerifyResponse.builder()
                    .matched(false)
                    .message("No face detected in the image")
                    .build();
        }

        Mat face = faceOpt.get();
        float[] inputEncoding = faceEncoder.encodeFace(face);

        // TODO: Performance — brute-force scan of all face encodings. For production scale,
        // consider using a vector similarity search (e.g., pgvector, FAISS, or a dedicated
        // face recognition service) instead of loading all encodings into memory.
        List<StudentFaceData> allFaces = faceDataRepository.findAll();

        double bestDistance = Double.MAX_VALUE;
        StudentFaceData bestMatch = null;

        for (StudentFaceData faceData : allFaces) {
            float[] storedEncoding = faceEncoder.decodeFromBytes(faceData.getFaceEncoding());
            double distance = faceMatcher.calculateDistance(inputEncoding, storedEncoding);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = faceData;
            }
        }

        if (bestMatch == null || !faceMatcher.isMatch(inputEncoding, faceEncoder.decodeFromBytes(bestMatch.getFaceEncoding()))) {
            return StudentFaceVerifyResponse.builder()
                    .matched(false)
                    .message("Face not recognized")
                    .build();
        }

        Student student = bestMatch.getStudent();
        return StudentFaceVerifyResponse.builder()
                .matched(true)
                .studentId(student.getId())
                .studentName(student.getFirstName() + " " + student.getLastName())
                .confidence(1.0 - bestDistance)
                .message("Face verified successfully")
                .build();
    }

    public boolean isEnrolled(Long studentId) {
        return faceDataRepository.existsByStudentId(studentId);
    }

    public boolean isEnrolledByUserId(Long userId) {
        return faceDataRepository.findByStudentUserId(userId).isPresent();
    }
}
