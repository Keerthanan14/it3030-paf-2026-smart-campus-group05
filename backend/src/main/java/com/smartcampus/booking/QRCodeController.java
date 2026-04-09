package com.smartcampus.booking;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/qr-codes")
public class QRCodeController {

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    /**
     * Serve QR code image for a booking
     * @param fileName the QR code file name (e.g., {bookingId}.png)
     * @return the QR code image file
     */
    @GetMapping("/{fileName}")
    public ResponseEntity<byte[]> getQRCode(@PathVariable String fileName) {
        try {
            // Validate file name to prevent directory traversal attacks
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Path filePath = Paths.get(uploadDir, "qr-codes", fileName);
            File file = filePath.toFile();

            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            byte[] imageData = Files.readAllBytes(filePath);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(imageData);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
