package com.smartcampus.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ResourceTypeConstraintMigration {

    private final JdbcTemplate jdbcTemplate;

    public ResourceTypeConstraintMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureResourceTypeCheckConstraint() {
        jdbcTemplate.execute("""
                DO $$
                DECLARE
                    r RECORD;
                    schema_name TEXT := current_schema();
                BEGIN
                    FOR r IN
                        SELECT c.conname
                        FROM pg_constraint c
                        JOIN pg_class t ON t.oid = c.conrelid
                        JOIN pg_namespace n ON n.oid = t.relnamespace
                        WHERE c.contype = 'c'
                          AND t.relname = 'resources'
                          AND n.nspname = schema_name
                          AND pg_get_constraintdef(c.oid) ILIKE '%type%'
                    LOOP
                        EXECUTE format('ALTER TABLE %I.resources DROP CONSTRAINT IF EXISTS %I', schema_name, r.conname);
                    END LOOP;

                    EXECUTE format(
                        'ALTER TABLE %I.resources ADD CONSTRAINT resources_type_check CHECK (type IN (''ROOM'', ''LECTURE_HALL'', ''LAB'', ''MEETING_ROOM'', ''BOARD_ROOM'', ''STAFF_ROOM'', ''SMART_CLASSROOM'', ''EQUIPMENT'', ''STUDY_AREA'', ''LIBRARY'', ''OTHER''))',
                        schema_name
                    );
                EXCEPTION
                    WHEN duplicate_object THEN
                        NULL;
                END $$;
                """);
    }
}
