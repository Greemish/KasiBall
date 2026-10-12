-- Step 1: create club table
CREATE TABLE "club" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "short_name" VARCHAR(50),
    "logo_url" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "club_name_key" ON "club"("name");

-- Step 2: add nullable club_id to manager
ALTER TABLE "manager" ADD COLUMN "club_id" UUID;
CREATE INDEX "idx_manager_club_id" ON "manager"("club_id");
ALTER TABLE "manager" ADD CONSTRAINT "fk_manager_club"
    FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Step 3: add nullable club_id to team
ALTER TABLE "team" ADD COLUMN "club_id" UUID;
CREATE INDEX "idx_team_club_id" ON "team"("club_id");

-- Step 4: backfill clubs from distinct team names
INSERT INTO "club" ("id", "name", "short_name", "created_at", "updated_at")
SELECT gen_random_uuid(), t."name", MAX(t."short_name"), now(), now()
FROM "team" t
GROUP BY t."name";

-- Step 5: backfill team.club_id
UPDATE "team"
SET "club_id" = c."id"
FROM "club" c
WHERE c."name" = "team"."name";

-- Step 6: backfill manager.club_id via their team
UPDATE "manager"
SET "club_id" = t."club_id"
FROM "team" t
WHERE t."manager_id" = "manager"."id";

-- Step 7: make team.club_id required + FK
ALTER TABLE "team" ALTER COLUMN "club_id" SET NOT NULL;
ALTER TABLE "team" ADD CONSTRAINT "fk_team_club"
    FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Step 8: swap team unique constraints (CONSTRAINT FIRST — this was the bug)
ALTER TABLE "team" DROP CONSTRAINT IF EXISTS "unique_team_manager";
ALTER TABLE "team" DROP CONSTRAINT IF EXISTS "unique_team_name_per_age_group";
CREATE UNIQUE INDEX IF NOT EXISTS "unique_team_per_club_age_group"
    ON "team"("club_id", "age_group_id");

-- Step 9: add club_name to team_application
ALTER TABLE "team_application" ADD COLUMN "club_name" VARCHAR(150);