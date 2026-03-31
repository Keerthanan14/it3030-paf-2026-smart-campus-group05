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

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final boolean mailEnabled;
    private final boolean authDebug;
    private final String fromAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("") boolean mailEnabled,
            @Value("") boolean authDebug,
            @Value("") String fromAddress) {
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