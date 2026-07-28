package com.smartuniversity.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/files")
public class FileController {

    private final Path uploadRoot;

    public FileController(@Value("${image.upload.dir}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping("/{pathToFile:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String pathToFile) {
        Path filePath = uploadRoot.resolve(pathToFile).normalize();
        if (!filePath.startsWith(uploadRoot)) {
            return ResponseEntity.badRequest().build();
        }
        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = determineContentType(pathToFile);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    private String determineContentType(String pathToFile) {
        if (pathToFile.endsWith(".pdf")) return "application/pdf";
        if (pathToFile.endsWith(".doc")) return "application/msword";
        if (pathToFile.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (pathToFile.endsWith(".jpg") || pathToFile.endsWith(".jpeg")) return "image/jpeg";
        if (pathToFile.endsWith(".png")) return "image/png";
        if (pathToFile.endsWith(".gif")) return "image/gif";
        if (pathToFile.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
