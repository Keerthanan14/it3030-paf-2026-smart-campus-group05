package com.smartcampus.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class AuthProviderConstraintMigration {

    private final JdbcTemplate jdbcTemplate;

    public AuthProviderConstraintMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureAuthProviderCheckConstraint() {
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
                          AND t.relname = 'users'
                          AND n.nspname = schema_name
                          AND pg_get_constraintdef(c.oid) ILIKE '%auth_provider%'
                    LOOP
                        EXECUTE format('ALTER TABLE %I.users DROP CONSTRAINT IF EXISTS %I', schema_name, r.conname);
                    END LOOP;

                    EXECUTE format(
                        'ALTER TABLE %I.users ADD CONSTRAINT users_auth_provider_check CHECK (auth_provider IN (''LOCAL'', ''GOOGLE'', ''BOTH''))',
                        schema_name
                    );
                EXCEPTION
                    WHEN duplicate_object THEN
                        NULL;
                END $$;
                """);
    }
}
