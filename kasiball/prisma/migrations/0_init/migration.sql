-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VERIFY', 'LOGIN', 'LOGOUT', 'GENERATE_FIXTURES', 'ASSIGN_REFEREE', 'SUBMIT_RESULT');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('IDENTITY_DOCUMENT', 'BIRTH_CERTIFICATE', 'PROOF_OF_AGE', 'MEDICAL_DOCUMENT', 'CONSENT_FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "fixture_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FORFEITED', 'CANCELLED', 'POSTPONED', 'ABANDONED', 'NO_RESULT');

-- CreateEnum
CREATE TYPE "match_event_type" AS ENUM ('GOAL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FORFEITED', 'ABANDONED', 'NO_RESULT');

-- CreateEnum
CREATE TYPE "season_status" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "team_status" AS ENUM ('PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'MANAGER', 'REFEREE');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "license_number" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "season_status" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_group" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "season_id" UUID NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "age_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "short_name" VARCHAR(50),
    "manager_id" UUID NOT NULL,
    "age_group_id" UUID NOT NULL,
    "logo_url" TEXT,
    "status" "team_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_application" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "manager_id" UUID NOT NULL,
    "age_group_id" UUID NOT NULL,
    "team_name" VARCHAR(150) NOT NULL,
    "kit_description" TEXT,
    "notes" TEXT,
    "status" "application_status" NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "approved_team_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "photo_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_registration" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "shirt_number" INTEGER,
    "registration_status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_registration_id" UUID NOT NULL,
    "document_type" "document_type" NOT NULL,
    "file_url" TEXT NOT NULL,
    "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ground" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "location" VARCHAR(255),
    "address" TEXT,
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ground_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixture" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "season_id" UUID NOT NULL,
    "age_group_id" UUID NOT NULL,
    "home_team_id" UUID NOT NULL,
    "away_team_id" UUID NOT NULL,
    "ground_id" UUID,
    "referee_id" UUID,
    "round_number" INTEGER NOT NULL,
    "scheduled_date" DATE,
    "kickoff_time" TIME(6),
    "status" "fixture_status" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fixture_id" UUID NOT NULL,
    "home_score" INTEGER NOT NULL DEFAULT 0,
    "away_score" INTEGER NOT NULL DEFAULT 0,
    "status" "match_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "submitted_by" UUID,
    "submitted_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchday_squad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "player_registration_id" UUID NOT NULL,
    "starting" BOOLEAN NOT NULL DEFAULT false,
    "substitute" BOOLEAN NOT NULL DEFAULT false,
    "goalkeeper" BOOLEAN NOT NULL DEFAULT false,
    "shirt_number" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matchday_squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "player_registration_id" UUID,
    "assist_player_registration_id" UUID,
    "event_type" "match_event_type" NOT NULL,
    "minute" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forfeit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID,
    "notes" TEXT,

    CONSTRAINT "forfeit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" "audit_action" NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "manager_user_id_key" ON "manager"("user_id");

-- CreateIndex
CREATE INDEX "idx_manager_user_id" ON "manager"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referee_user_id_key" ON "referee"("user_id");

-- CreateIndex
CREATE INDEX "idx_referee_user_id" ON "referee"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_name_key" ON "season"("name");

-- CreateIndex
CREATE INDEX "idx_age_group_season_id" ON "age_group"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_age_group_per_season" ON "age_group"("season_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_team_manager" ON "team"("manager_id");

-- CreateIndex
CREATE INDEX "idx_team_age_group_id" ON "team"("age_group_id");

-- CreateIndex
CREATE INDEX "idx_team_manager_id" ON "team"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_team_name_per_age_group" ON "team"("age_group_id", "name");

-- CreateIndex
CREATE INDEX "idx_team_application_manager_id" ON "team_application"("manager_id");

-- CreateIndex
CREATE INDEX "idx_team_application_status" ON "team_application"("status");

-- CreateIndex
CREATE INDEX "idx_player_registration_player_id" ON "player_registration"("player_id");

-- CreateIndex
CREATE INDEX "idx_player_registration_season_id" ON "player_registration"("season_id");

-- CreateIndex
CREATE INDEX "idx_player_registration_team_id" ON "player_registration"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_player_registration" ON "player_registration"("player_id", "team_id", "season_id");

-- CreateIndex
CREATE INDEX "idx_player_document_registration_id" ON "player_document"("player_registration_id");

-- CreateIndex
CREATE INDEX "idx_fixture_age_group_id" ON "fixture"("age_group_id");

-- CreateIndex
CREATE INDEX "idx_fixture_away_team_id" ON "fixture"("away_team_id");

-- CreateIndex
CREATE INDEX "idx_fixture_ground_id" ON "fixture"("ground_id");

-- CreateIndex
CREATE INDEX "idx_fixture_home_team_id" ON "fixture"("home_team_id");

-- CreateIndex
CREATE INDEX "idx_fixture_referee_id" ON "fixture"("referee_id");

-- CreateIndex
CREATE INDEX "idx_fixture_scheduled_date" ON "fixture"("scheduled_date");

-- CreateIndex
CREATE INDEX "idx_fixture_season_id" ON "fixture"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_fixture_id_key" ON "match"("fixture_id");

-- CreateIndex
CREATE INDEX "idx_match_fixture_id" ON "match"("fixture_id");

-- CreateIndex
CREATE INDEX "idx_matchday_squad_match_id" ON "matchday_squad"("match_id");

-- CreateIndex
CREATE INDEX "idx_matchday_squad_team_id" ON "matchday_squad"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_player_per_match" ON "matchday_squad"("match_id", "player_registration_id");

-- CreateIndex
CREATE INDEX "idx_match_event_match_id" ON "match_event"("match_id");

-- CreateIndex
CREATE INDEX "idx_match_event_player_id" ON "match_event"("player_registration_id");

-- CreateIndex
CREATE INDEX "idx_match_event_team_id" ON "match_event"("team_id");

-- CreateIndex
CREATE INDEX "idx_forfeit_match_id" ON "forfeit"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_forfeit_per_team_match" ON "forfeit"("match_id", "team_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_created_at" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_log_entity" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_log_user_id" ON "audit_log"("user_id");

-- AddForeignKey
ALTER TABLE "manager" ADD CONSTRAINT "fk_manager_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referee" ADD CONSTRAINT "fk_referee_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "age_group" ADD CONSTRAINT "fk_age_group_season" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "fk_team_age_group" FOREIGN KEY ("age_group_id") REFERENCES "age_group"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "fk_team_manager" FOREIGN KEY ("manager_id") REFERENCES "manager"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_application" ADD CONSTRAINT "fk_team_application_age_group" FOREIGN KEY ("age_group_id") REFERENCES "age_group"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_application" ADD CONSTRAINT "fk_team_application_manager" FOREIGN KEY ("manager_id") REFERENCES "manager"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_application" ADD CONSTRAINT "fk_team_application_reviewer" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_application" ADD CONSTRAINT "fk_team_application_team" FOREIGN KEY ("approved_team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "fk_player_registration_player" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "fk_player_registration_season" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "fk_player_registration_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "fk_player_registration_verifier" FOREIGN KEY ("verified_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_document" ADD CONSTRAINT "fk_player_document_registration" FOREIGN KEY ("player_registration_id") REFERENCES "player_registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_document" ADD CONSTRAINT "fk_player_document_verifier" FOREIGN KEY ("verified_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fk_fixture_age_group" FOREIGN KEY ("age_group_id") REFERENCES "age_group"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fk_fixture_away_team" FOREIGN KEY ("away_team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fk_fixture_ground" FOREIGN KEY ("ground_id") REFERENCES "ground"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fk_fixture_home_team" FOREIGN KEY ("home_team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fk_fixture_referee" FOREIGN KEY ("referee_id") REFERENCES "referee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fk_fixture_season" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "fk_match_fixture" FOREIGN KEY ("fixture_id") REFERENCES "fixture"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "fk_match_submitter" FOREIGN KEY ("submitted_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "matchday_squad" ADD CONSTRAINT "fk_matchday_squad_match" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "matchday_squad" ADD CONSTRAINT "fk_matchday_squad_player" FOREIGN KEY ("player_registration_id") REFERENCES "player_registration"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "matchday_squad" ADD CONSTRAINT "fk_matchday_squad_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_event" ADD CONSTRAINT "fk_match_event_assist_player" FOREIGN KEY ("assist_player_registration_id") REFERENCES "player_registration"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_event" ADD CONSTRAINT "fk_match_event_match" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_event" ADD CONSTRAINT "fk_match_event_player" FOREIGN KEY ("player_registration_id") REFERENCES "player_registration"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_event" ADD CONSTRAINT "fk_match_event_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forfeit" ADD CONSTRAINT "fk_forfeit_match" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forfeit" ADD CONSTRAINT "fk_forfeit_recorder" FOREIGN KEY ("recorded_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forfeit" ADD CONSTRAINT "fk_forfeit_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "fk_audit_log_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
