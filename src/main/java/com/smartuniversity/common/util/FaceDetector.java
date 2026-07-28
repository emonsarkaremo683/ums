package com.smartuniversity.common.util;

import org.bytedeco.opencv.opencv_core.*;
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Base64;
import java.util.Optional;

import static org.bytedeco.opencv.global.opencv_imgcodecs.*;
import static org.bytedeco.opencv.global.opencv_imgproc.*;

@Component
public class FaceDetector {

    @Value("${face.detection.cascade.path:haarcascade_frontalface_default.xml}")
    private String cascadePath;

    private CascadeClassifier faceCascade;

    @PostConstruct
    public void init() throws IOException {
        ClassPathResource resource = new ClassPathResource(cascadePath);
        faceCascade = new CascadeClassifier(resource.getFile().getAbsolutePath());
        if (faceCascade.empty()) {
            throw new IllegalStateException("Failed to load face cascade: " + cascadePath);
        }
    }

    public Optional<Mat> detectFace(String base64Image) {
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        Mat imageData = new Mat(imageBytes);
        Mat image = imdecode(imageData, IMREAD_COLOR);

        if (image.empty()) {
            imageData.close();
            return Optional.empty();
        }

        Mat gray = new Mat();
        cvtColor(image, gray, COLOR_BGR2GRAY);
        equalizeHist(gray, gray);

        RectVector faces = new RectVector();
        faceCascade.detectMultiScale(
                gray,
                faces,
                1.1,
                3,
                0,
                new Size(100, 100),
                new Size(0, 0)
        );

        if (faces.empty()) {
            gray.close();
            faces.close();
            image.close();
            imageData.close();
            return Optional.empty();
        }

        Rect faceRect = faces.get(0);
        Mat face = new Mat(image, faceRect).clone();

        gray.close();
        faces.close();
        image.close();
        imageData.close();

        return Optional.of(face);
    }

    public Optional<Rect> detectFaceRect(String base64Image) {
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        Mat imageData = new Mat(imageBytes);
        Mat image = imdecode(imageData, IMREAD_COLOR);

        if (image.empty()) {
            imageData.close();
            return Optional.empty();
        }

        Mat gray = new Mat();
        cvtColor(image, gray, COLOR_BGR2GRAY);
        equalizeHist(gray, gray);

        RectVector faces = new RectVector();
        faceCascade.detectMultiScale(
                gray,
                faces,
                1.1,
                3,
                0,
                new Size(100, 100),
                new Size(0, 0)
        );

        if (faces.empty()) {
            gray.close();
            faces.close();
            image.close();
            imageData.close();
            return Optional.empty();
        }

        Rect faceRect = faces.get(0);
        Rect result = new Rect(faceRect.x(), faceRect.y(), faceRect.width(), faceRect.height());

        gray.close();
        faces.close();
        image.close();
        imageData.close();

        return Optional.of(result);
    }
}
