package com.smartcampus.notification;

import com.smartcampus.user.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final boolean mailEnabled;
    private final boolean authDebug;
    private final String fromAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.auth.debug:false}") boolean authDebug,
            @Value("${app.mail.from:}") String fromAddress) {
        this.mailSender = mailSender;
        this.mailEnabled = mailEnabled;
        this.authDebug = authDebug;
        this.fromAddress = fromAddress;
    }

    public void sendRegistrationCode(String email, String name, String code) {  
        String subject = "Smart Campus verification code";
        String body = "Hi " + name + ",\n\n"
                + "Your verification code is: " + code + "\n"
                + "This code will expire in 10 minutes.\n\n"
                + "Smart Campus Operations Hub";
        send(email, subject, body, code, "verification-code");
    }

    public void sendStaffTemporaryPassword(String email, String name, String temporaryPassword, Role role) {
        String subject = "Smart Campus staff account created";
        String body = "Hi " + name + ",\n\n"
                + "An account has been created for you.\n"
                + "Role: " + role.name() + "\n"
                + "Username: " + email + "\n"
                + "Temporary password: " + temporaryPassword + "\n\n"
                + "Please log in and change your password immediately.\n\n"     
                + "Smart Campus Operations Hub";
        send(email, subject, body, temporaryPassword, "temporary-password");    
    }

    public void sendEmail(String to, String subject, String body) {
        send(to, subject, body, "generic", "generic-email");
    }

    public void sendBookingConfirmation(String email, String userName, String resourceName, 
                                       LocalDate bookingDate, LocalTime startTime, LocalTime endTime,
                                       String bookingId, String qrCodeUrl, String baseUrl) {
        String subject = "Smart Campus - Booking Confirmed";
        
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        
        String formattedDate = bookingDate.format(dateFormatter);
        String formattedStartTime = startTime.format(timeFormatter);
        String formattedEndTime = endTime.format(timeFormatter);

        String qrDownloadLink = null;
        if (StringUtils.hasText(qrCodeUrl)) {
            if (qrCodeUrl.startsWith("http://") || qrCodeUrl.startsWith("https://")) {
                qrDownloadLink = qrCodeUrl;
            } else {
                qrDownloadLink = baseUrl + qrCodeUrl;
            }
        }
        
        String body = "Hi " + userName + ",\n\n"
                + "Your booking has been confirmed!\n\n"
                + "Resource: " + resourceName + "\n"
                + "Date: " + formattedDate + "\n"
                + "Time: " + formattedStartTime + " - " + formattedEndTime + "\n"
                + "Booking ID: " + bookingId + "\n\n";

        if (StringUtils.hasText(qrDownloadLink)) {
            body += "Your QR Code:\n"
                + "Download: " + qrDownloadLink + "\n\n"
                + "Please present this QR code when using the resource.\n\n";
        }

        body += "Smart Campus Operations Hub";
        
        send(email, subject, body, bookingId, "booking-confirmation");
    }

    private void send(String to, String subject, String body, String debugSecret, String debugType) {
        if (!mailEnabled) {
            if (authDebug) {
                log.info("Mail disabled. [{}] to {} value={}", debugType, to, debugSecret);
            }
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (StringUtils.hasText(fromAddress)) {
                message.setFrom(fromAddress);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (MailException ex) {
            throw new IllegalStateException("Failed to send email to " + to, ex);
        }
    }
}