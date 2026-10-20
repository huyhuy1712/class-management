ALTER TABLE materials
    DROP CONSTRAINT IF EXISTS fk_materials_class,
    DROP COLUMN IF EXISTS class_id;
