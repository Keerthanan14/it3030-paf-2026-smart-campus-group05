package com.smartcampus.ticket.attachment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    private final Path ticketUploadPath;

    public FileStorageService(@Value("${app.file.upload-dir:uploads}") String uploadRoot) {
        this.ticketUploadPath = Paths.get(uploadRoot, "tickets").toAbsolutePath().normalize();
    }

    public StoredFile storeTicketImage(MultipartFile file) {
        validateImage(file);

        try {
            Files.createDirectories(ticketUploadPath);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not initialize ticket upload directory", ex);
        }

        String extension = resolveExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + extension;
        Path target = ticketUploadPath.resolve(storedName);

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store uploaded file", ex);
        }

        return new StoredFile(
                file.getOriginalFilename(),
                storedName,
                "/uploads/tickets/" + storedName,
                file.getSize()
        );
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file must not be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !("image/jpeg".equalsIgnoreCase(contentType) || "image/png".equalsIgnoreCase(contentType))) {
            throw new IllegalArgumentException("Only JPEG and PNG images are allowed");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Each image must be 5MB or smaller");
        }
    }

    private String resolveExtension(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "";
        }

        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalName.length() - 1) {
            return "";
        }

        return originalName.substring(dotIndex).toLowerCase(Locale.ROOT);
    }

    public record StoredFile(String originalFileName, String storedName, String fileUrl, long size) {
    }
}
