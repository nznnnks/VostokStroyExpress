-- Seed default filter group "Основные параметры" and base numeric parameters.
-- This makes the group visible in admin panel -> Settings -> "Группы фильтрации".

WITH upsert_group AS (
  INSERT INTO "FilterGroup" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
  VALUES (
    '0e2d0f5f-4c7a-4d7b-9d9f-0ad4a4f3f0c8',
    'Основные параметры',
    'osnovnye-parametry',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("slug") DO UPDATE
    SET "name" = EXCLUDED."name",
        "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id"
)
INSERT INTO "FilterParameter" ("id", "groupId", "name", "slug", "type", "unit", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT
  'b6a7e616-7c2c-4c55-8b6d-fd2a2d52c2c1',
  upsert_group."id",
  'Мощность',
  'power',
  'NUMBER',
  'кВт',
  0,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM upsert_group
ON CONFLICT ("groupId", "slug") DO UPDATE
  SET "name" = EXCLUDED."name",
      "type" = EXCLUDED."type",
      "unit" = EXCLUDED."unit",
      "sortOrder" = EXCLUDED."sortOrder",
      "isActive" = EXCLUDED."isActive",
      "updatedAt" = CURRENT_TIMESTAMP;

WITH upsert_group AS (
  SELECT "id" FROM "FilterGroup" WHERE "slug" = 'osnovnye-parametry'
)
INSERT INTO "FilterParameter" ("id", "groupId", "name", "slug", "type", "unit", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT
  'e3c1b3b6-7d9d-44b3-9d73-6cccd1f5aab0',
  upsert_group."id",
  'Объём',
  'volume',
  'NUMBER',
  'л',
  1,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM upsert_group
ON CONFLICT ("groupId", "slug") DO UPDATE
  SET "name" = EXCLUDED."name",
      "type" = EXCLUDED."type",
      "unit" = EXCLUDED."unit",
      "sortOrder" = EXCLUDED."sortOrder",
      "isActive" = EXCLUDED."isActive",
      "updatedAt" = CURRENT_TIMESTAMP;

