-- Make every current and future direct foreign key to classes cascade on deletion.
-- This avoids depending on generated constraint names.
DO $$
DECLARE
    foreign_key RECORD;
BEGIN
    FOR foreign_key IN
        SELECT
            ns.nspname AS schema_name,
            child.relname AS child_table,
            con.conname AS constraint_name,
            regexp_replace(
                pg_get_constraintdef(con.oid),
                '\s+ON DELETE\s+(NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)',
                '',
                'gi'
            ) AS constraint_definition
        FROM pg_constraint con
        JOIN pg_class child ON child.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = child.relnamespace
        JOIN pg_class parent ON parent.oid = con.confrelid
        WHERE con.contype = 'f'
          AND ns.nspname = 'public'
          AND parent.relname = 'classes'
          AND confdeltype <> 'c'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I.%I DROP CONSTRAINT %I',
            foreign_key.schema_name,
            foreign_key.child_table,
            foreign_key.constraint_name
        );

        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I %s ON DELETE CASCADE',
            foreign_key.schema_name,
            foreign_key.child_table,
            foreign_key.constraint_name,
            foreign_key.constraint_definition
        );
    END LOOP;
END $$;
