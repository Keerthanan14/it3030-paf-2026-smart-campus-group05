package com.smartcampus.audit;

import com.smartcampus.audit.dto.AuditLogResponse;
import com.smartcampus.audit.dto.PaginatedAuditLogResponse;
import com.smartcampus.user.User;
import com.smartcampus.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void logAction(UUID actorUserId,
                          String action,
                          String entityType,
                          UUID entityId,
                          Map<String, Object> oldValue,
                          Map<String, Object> newValue) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setOldValue(oldValue);
        auditLog.setNewValue(newValue);

        if (actorUserId != null) {
            userRepository.findById(actorUserId).ifPresent(auditLog::setUser);
        }

        auditLogRepository.save(auditLog);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedAuditLogResponse getAuditLogs(String entityType,
                                                  String action,
                                                  UUID userId,
                                                  LocalDateTime from,
                                                  LocalDateTime to,
                                                  int page,
                                                  int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must be greater than or equal to 0");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }

        Specification<AuditLog> spec = Specification.where(AuditLogSpecifications.hasEntityType(entityType))
                .and(AuditLogSpecifications.hasAction(action))
            .and(AuditLogSpecifications.hasUserId(userId))
            .and(AuditLogSpecifications.createdAtFrom(from))
            .and(AuditLogSpecifications.createdAtTo(to));

        Page<AuditLogResponse> result = auditLogRepository
                .findAll(spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);

        return new PaginatedAuditLogResponse(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    private AuditLogResponse toResponse(AuditLog log) {
        User user = log.getUser();

        return new AuditLogResponse(
                log.getId(),
                user == null ? null : user.getId(),
                user == null ? null : user.getEmail(),
                user == null ? null : user.getName(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOldValue(),
                log.getNewValue(),
                log.getCreatedAt()
        );
    }
}
