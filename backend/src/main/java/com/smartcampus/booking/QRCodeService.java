package com.smartcampus.booking;

import com.cloudinary.Cloudinary;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.smartcampus.exception.BookingBadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.time.format.DateTimeFormatter;

@Service
public class QRCodeService {

    private static final int QR_CODE_SIZE = 300;
    private static final String QR_FILE_FORMAT = "png";
    private static final String QR_DIRECTORY = "qr-codes";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEE, MMMM dd, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    /**
     * Generate QR code for a booking and save it to storage
     * @param bookingId the booking UUID
     * @return the relative URL path to the QR code image
     */
    public String generateAndStoreQRCode(UUID bookingId) {
        try {
            String qrContent = String.format("%s/booking/scan/%s", frontendBaseUrl.replaceAll("/$", ""), bookingId);
            String result = generateQRCode(qrContent, bookingId, "qr-codes");
            System.out.println("QR code generated successfully for booking: " + bookingId + " -> " + result);
            return result;
        } catch (WriterException | IOException e) {
            System.err.println("QR code generation failed for booking: " + bookingId);
            e.printStackTrace();
            throw new BookingBadRequestException("Failed to generate QR code: " + e.getMessage());
        }
    }

    public String generateAndStoreQRCodeFromBookingSummaryImage(Booking booking) {
        if (!isCloudinaryConfigured()) {
            throw new BookingBadRequestException("Cloudinary is required for booking summary QR generation");
        }

        try {
            Path summaryImagePath = renderBookingSummaryImage(booking);
            String summaryImageUrl = uploadToCloudinary(summaryImagePath, "smart-campus/booking-summaries", booking.getId().toString());
            if (summaryImageUrl == null || summaryImageUrl.isBlank()) {
                throw new IOException("Cloudinary summary image upload returned empty URL");
            }

            return generateQRCode(summaryImageUrl, booking.getId(), "qr-codes");
        } catch (IOException | WriterException ex) {
            throw new BookingBadRequestException("Failed to generate booking summary QR code: " + ex.getMessage());
        }
    }

    public String generateAndStoreQRCodeFromSummaryImageData(UUID bookingId, String imageDataUrl) {
        if (!isCloudinaryConfigured()) {
            throw new BookingBadRequestException("Cloudinary is required for booking summary QR generation");
        }

        try {
            String summaryImageUrl = uploadDataUrlToCloudinary(imageDataUrl, "smart-campus/booking-summaries", bookingId.toString());
            if (summaryImageUrl == null || summaryImageUrl.isBlank()) {
                throw new IOException("Cloudinary summary image upload returned empty URL");
            }

            return generateQRCode(summaryImageUrl, bookingId, "qr-codes");
        } catch (IOException | WriterException ex) {
            throw new BookingBadRequestException("Failed to generate booking summary QR code: " + ex.getMessage());
        }
    }

    /**
     * Generate QR code image and save to file system
     * @param qrContent the content to encode in QR code
     * @param bookingId the booking ID for file naming
     * @return the relative URL path to access the QR code
     */
    private String generateQRCode(String qrContent, UUID bookingId, String cloudinaryFolder) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(qrContent, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE);

        // Create directory structure
        Path qrDirectory = Paths.get(uploadDir, QR_DIRECTORY);
        try {
            Files.createDirectories(qrDirectory);
        } catch (IOException e) {
            System.err.println("Failed to create QR directory: " + qrDirectory);
            System.err.println("Upload dir: " + uploadDir);
            System.err.println("Current working directory: " + System.getProperty("user.dir"));
            throw new IOException("Failed to create QR code directory: " + e.getMessage(), e);
        }

        // Create file name and path
        String fileName = String.format("%s.%s", bookingId, QR_FILE_FORMAT);
        Path filePath = qrDirectory.resolve(fileName);

        // Write QR code to file
        try {
            MatrixToImageWriter.writeToPath(bitMatrix, QR_FILE_FORMAT.toUpperCase(), filePath);
            System.out.println("QR code saved to: " + filePath.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("Failed to write QR code file: " + filePath);
            throw new IOException("Failed to write QR code file: " + e.getMessage(), e);
        }

        // If Cloudinary is configured, require hosted URL and do not fall back to local path.
        if (isCloudinaryConfigured()) {
            String cloudinaryUrl = uploadToCloudinary(filePath, "smart-campus/" + cloudinaryFolder, bookingId.toString());
            if (cloudinaryUrl != null) {
                return cloudinaryUrl;
            }

            throw new IOException("Cloudinary upload failed while Cloudinary mode is enabled");
        }

        // Return the relative URL pattern for the frontend to access
        return String.format("/api/v1/qr-codes/%s.%s", bookingId, QR_FILE_FORMAT);
    }

    public boolean isCloudinaryConfigured() {
        return !cloudinaryCloudName.isBlank() && !cloudinaryApiKey.isBlank() && !cloudinaryApiSecret.isBlank();
    }

    private String uploadToCloudinary(Path filePath, String folder, String publicId) {
        if (!isCloudinaryConfigured()) {
            return null;
        }

        try {
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudinaryCloudName);
            config.put("api_key", cloudinaryApiKey);
            config.put("api_secret", cloudinaryApiSecret);

            Cloudinary cloudinary = new Cloudinary(config);
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    filePath.toFile(),
                    Map.of(
                        "folder", folder,
                        "public_id", publicId,
                            "overwrite", true,
                            "resource_type", "image"
                    )
            );

            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl instanceof String secureUrlValue && !secureUrlValue.isBlank()) {
                return secureUrlValue;
            }

            return null;
        } catch (Exception ex) {
            System.err.println("Cloudinary upload failed for " + publicId + ": " + ex.getMessage());
            return null;
        }
    }

    private Path renderBookingSummaryImage(Booking booking) throws IOException {
        final int width = 1360;
        final int height = 900;

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        try {
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            Color pageBg = new Color(255, 255, 255);
            Color cardBg = new Color(255, 255, 255);
            Color border = new Color(220, 224, 230);
            Color textPrimary = new Color(17, 24, 39);
            Color textMuted = new Color(98, 107, 120);

            Color statusPillBg;
            Color statusPillText;
            switch (booking.getStatus()) {
                case APPROVED -> {
                    statusPillBg = new Color(209, 250, 229);
                    statusPillText = new Color(4, 120, 87);
                }
                case REJECTED -> {
                    statusPillBg = new Color(255, 228, 230);
                    statusPillText = new Color(159, 18, 57);
                }
                case PENDING -> {
                    statusPillBg = new Color(254, 243, 199);
                    statusPillText = new Color(161, 98, 7);
                }
                default -> {
                    statusPillBg = new Color(226, 232, 240);
                    statusPillText = new Color(51, 65, 85);
                }
            }

            g2d.setColor(pageBg);
            g2d.fillRect(0, 0, width, height);

            int outerX = 42;
            int outerY = 36;
            int outerW = width - 84;
            int outerH = height - 72;
            g2d.setColor(cardBg);
            g2d.fill(new RoundRectangle2D.Float(outerX, outerY, outerW, outerH, 36, 36));
            g2d.setColor(border);
            g2d.setStroke(new BasicStroke(2f));
            g2d.draw(new RoundRectangle2D.Float(outerX, outerY, outerW, outerH, 36, 36));

            int innerX = outerX + 24;
            int innerY = outerY + 24;
            int innerW = outerW - 48;
            int innerH = outerH - 48;

            g2d.setFont(new Font("SansSerif", Font.BOLD, 46));
            g2d.setColor(textPrimary);
            g2d.drawString("BOOKING SUMMARY", innerX + 36, innerY + 62);

            g2d.setFont(new Font("SansSerif", Font.PLAIN, 44));
            g2d.drawString("Review the selected booking request details", innerX + 36, innerY + 118);

            int pillW = 220;
            int pillH = 62;
            int pillX = innerX + innerW - pillW - 30;
            int pillY = innerY + 26;
            g2d.setColor(statusPillBg);
            g2d.fill(new RoundRectangle2D.Float(pillX, pillY, pillW, pillH, 30, 30));
            g2d.setColor(statusPillText);
            g2d.setFont(new Font("SansSerif", Font.BOLD, 33));
            drawCenteredText(g2d, booking.getStatus().name(), pillX, pillY, pillW, pillH);

            int detailsX = innerX + 16;
            int detailsY = innerY + 138;
            int detailsW = innerW - 32;
            int detailsH = innerH - 160;
            g2d.setColor(cardBg);
            g2d.fill(new RoundRectangle2D.Float(detailsX, detailsY, detailsW, detailsH, 34, 34));
            g2d.setColor(border);
            g2d.draw(new RoundRectangle2D.Float(detailsX, detailsY, detailsW, detailsH, 34, 34));

            String dateTime = booking.getBookingDate().format(DATE_FORMATTER) + " "
                    + booking.getStartTime().format(TIME_FORMATTER) + " - "
                    + booking.getEndTime().format(TIME_FORMATTER);

                int rowTop = detailsY + 40;
                int rowBottom = detailsY + detailsH - 24;
                int rows = 7;
                int rowHeight = (rowBottom - rowTop) / rows;
            String[] labels = {"BOOKING ID", "REQUESTER", "RESOURCE", "DATE & TIME", "COUNT", "STATUS", "PURPOSE"};
            String[] values = {
                    booking.getId().toString(),
                    booking.getUser().getName(),
                    booking.getResource().getName(),
                    dateTime,
                    String.valueOf(booking.getAttendeesCount()),
                    booking.getStatus().name(),
                    booking.getPurpose() == null ? "-" : booking.getPurpose()
            };

            for (int i = 0; i < labels.length; i++) {
                int y = rowTop + (i * rowHeight);
                if (i > 0) {
                    g2d.setColor(new Color(230, 233, 238));
                    g2d.drawLine(detailsX + 26, y - 14, detailsX + detailsW - 26, y - 14);
                }

                g2d.setColor(textMuted);
                g2d.setFont(new Font("SansSerif", Font.BOLD, 20));
                g2d.drawString(labels[i], detailsX + 36, y);

                g2d.setColor(textPrimary);
                g2d.setFont(new Font("SansSerif", Font.BOLD, 32));
                g2d.drawString(truncateForWidth(g2d, values[i], detailsW - 72), detailsX + 36, y + 50);
            }

            Path summaryDirectory = Paths.get(uploadDir, "booking-summaries");
            Files.createDirectories(summaryDirectory);
            Path summaryImagePath = summaryDirectory.resolve(booking.getId() + ".png");
            ImageIO.write(image, "png", summaryImagePath.toFile());
            return summaryImagePath;
        } finally {
            g2d.dispose();
        }
    }

    private void drawCenteredText(Graphics2D g2d, String text, int x, int y, int w, int h) {
        FontMetrics metrics = g2d.getFontMetrics(g2d.getFont());
        int textX = x + (w - metrics.stringWidth(text)) / 2;
        int textY = y + ((h - metrics.getHeight()) / 2) + metrics.getAscent();
        g2d.drawString(text, textX, textY);
    }

    private String truncateForWidth(Graphics2D g2d, String text, int maxWidth) {
        if (text == null) {
            return "-";
        }

        FontMetrics metrics = g2d.getFontMetrics(g2d.getFont());
        if (metrics.stringWidth(text) <= maxWidth) {
            return text;
        }

        String ellipsis = "...";
        int targetWidth = maxWidth - metrics.stringWidth(ellipsis);
        if (targetWidth <= 0) {
            return ellipsis;
        }

        StringBuilder builder = new StringBuilder();
        for (char ch : text.toCharArray()) {
            if (metrics.stringWidth(builder.toString() + ch) > targetWidth) {
                break;
            }
            builder.append(ch);
        }
        return builder + ellipsis;
    }

    private String uploadDataUrlToCloudinary(String imageDataUrl, String folder, String publicId) throws IOException {
        if (!isCloudinaryConfigured()) {
            return null;
        }

        if (imageDataUrl == null || imageDataUrl.isBlank()) {
            throw new IOException("Summary image data URL is empty");
        }

        String trimmedDataUrl = imageDataUrl.trim();
        if (!trimmedDataUrl.startsWith("data:image/") || !trimmedDataUrl.contains(";base64,")) {
            throw new IOException("Invalid summary image data URL format");
        }

        try {
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudinaryCloudName);
            config.put("api_key", cloudinaryApiKey);
            config.put("api_secret", cloudinaryApiSecret);

            Cloudinary cloudinary = new Cloudinary(config);
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    trimmedDataUrl,
                    Map.of(
                        "folder", folder,
                        "public_id", publicId,
                        "overwrite", true,
                        "resource_type", "image"
                    )
            );

            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl instanceof String secureUrlValue && !secureUrlValue.isBlank()) {
                return secureUrlValue;
            }

            throw new IOException("Cloudinary summary image upload returned empty URL");
        } catch (Exception ex) {
            throw new IOException("Cloudinary summary image upload failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Delete QR code file (if booking is cancelled)
     * @param bookingId the booking ID
     */
    public void deleteQRCode(UUID bookingId) {
        if (isCloudinaryConfigured()) {
            try {
                Map<String, String> config = new HashMap<>();
                config.put("cloud_name", cloudinaryCloudName);
                config.put("api_key", cloudinaryApiKey);
                config.put("api_secret", cloudinaryApiSecret);

                Cloudinary cloudinary = new Cloudinary(config);
                cloudinary.uploader().destroy(
                        "smart-campus/qr-codes/" + bookingId,
                        Map.of("resource_type", "image")
                );
            } catch (Exception ex) {
                System.err.println("Failed to delete Cloudinary QR code: " + ex.getMessage());
            }
        }

        try {
            String fileName = String.format("%s.%s", bookingId, QR_FILE_FORMAT);
            Path filePath = Paths.get(uploadDir, QR_DIRECTORY, fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't throw - file deletion failure shouldn't fail the booking operation
            System.err.println("Failed to delete QR code file: " + e.getMessage());
        }
    }
}
