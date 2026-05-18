-- Hardening RES-002: prevent permissive access integrations without secret
UPDATE "access_devices"
SET "secretHash" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "secretHash" IS NULL OR btrim("secretHash") = '';

ALTER TABLE "access_devices"
ALTER COLUMN "secretHash" SET NOT NULL;