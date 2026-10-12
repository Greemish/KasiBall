-- ============================================================
-- KASIBALL - COMMUNITY YOUTH SOCCER LEAGUE MANAGEMENT SYSTEM
-- PostgreSQL / Neon Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'MANAGER',
    'REFEREE'
);

CREATE TYPE season_status AS ENUM (
    'PLANNED',
    'ACTIVE',
    'COMPLETED'
);

CREATE TYPE team_status AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'REJECTED',
    'INACTIVE'
);

CREATE TYPE application_status AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE verification_status AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);

CREATE TYPE fixture_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'FORFEITED',
    'CANCELLED',
    'POSTPONED',
    'ABANDONED',
    'NO_RESULT'
);

CREATE TYPE match_status AS ENUM (
    'IN_PROGRESS',
    'COMPLETED',
    'FORFEITED',
    'ABANDONED',
    'NO_RESULT'
);

CREATE TYPE match_event_type AS ENUM (
    'GOAL',
    'YELLOW_CARD',
    'RED_CARD',
    'OWN_GOAL'
);

CREATE TYPE document_type AS ENUM (
    'IDENTITY_DOCUMENT',
    'BIRTH_CERTIFICATE',
    'PROOF_OF_AGE',
    'MEDICAL_DOCUMENT',
    'CONSENT_FORM',
    'OTHER'
);

CREATE TYPE audit_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'VERIFY',
    'LOGIN',
    'LOGOUT',
    'GENERATE_FIXTURES',
    'ASSIGN_REFEREE',
    'SUBMIT_RESULT'
);


-- ============================================================
-- 1. USER
-- ============================================================

CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role user_role NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. MANAGER
-- ============================================================

CREATE TABLE manager (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    phone VARCHAR(30),

    address TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_manager_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 3. REFEREE
-- ============================================================

CREATE TABLE referee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    phone VARCHAR(30),

    license_number VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_referee_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 4. SEASON
-- ============================================================

CREATE TABLE season (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status season_status NOT NULL DEFAULT 'PLANNED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_season_dates
        CHECK (end_date >= start_date)
);


-- ============================================================
-- 5. AGE GROUP
-- ============================================================

CREATE TABLE age_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    season_id UUID NOT NULL,

    name VARCHAR(20) NOT NULL,

    min_age INTEGER,
    max_age INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_age_group_season
        FOREIGN KEY (season_id)
        REFERENCES season(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_age_range
        CHECK (
            min_age IS NULL
            OR max_age IS NULL
            OR max_age >= min_age
        ),

    CONSTRAINT unique_age_group_per_season
        UNIQUE (season_id, name)
);


-- ============================================================
-- 6. TEAM
-- ============================================================

CREATE TABLE team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    short_name VARCHAR(50),

    manager_id UUID NOT NULL,

    age_group_id UUID NOT NULL,

    logo_url TEXT,

    status team_status NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_team_manager
        FOREIGN KEY (manager_id)
        REFERENCES manager(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_team_age_group
        FOREIGN KEY (age_group_id)
        REFERENCES age_group(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_team_name_per_age_group
        UNIQUE (age_group_id, name)
);


-- ============================================================
-- 7. TEAM APPLICATION
-- ============================================================

CREATE TABLE team_application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    manager_id UUID NOT NULL,

    age_group_id UUID NOT NULL,

    team_name VARCHAR(150) NOT NULL,

    kit_description TEXT,

    notes TEXT,

    status application_status NOT NULL DEFAULT 'PENDING',

    review_notes TEXT,

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    reviewed_at TIMESTAMPTZ,

    reviewed_by UUID,

    approved_team_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_team_application_manager
        FOREIGN KEY (manager_id)
        REFERENCES manager(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_team_application_age_group
        FOREIGN KEY (age_group_id)
        REFERENCES age_group(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_team_application_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES "user"(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_team_application_team
        FOREIGN KEY (approved_team_id)
        REFERENCES team(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 8. PLAYER
-- ============================================================

CREATE TABLE player (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    date_of_birth DATE NOT NULL,

    photo_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. PLAYER REGISTRATION
-- ============================================================

CREATE TABLE player_registration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    player_id UUID NOT NULL,

    team_id UUID NOT NULL,

    season_id UUID NOT NULL,

    shirt_number INTEGER,

    registration_status verification_status NOT NULL DEFAULT 'PENDING',

    verified_by UUID,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_player_registration_player
        FOREIGN KEY (player_id)
        REFERENCES player(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_player_registration_team
        FOREIGN KEY (team_id)
        REFERENCES team(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_player_registration_season
        FOREIGN KEY (season_id)
        REFERENCES season(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_player_registration_verifier
        FOREIGN KEY (verified_by)
        REFERENCES "user"(id)
        ON DELETE SET NULL,

    CONSTRAINT valid_shirt_number
        CHECK (
            shirt_number IS NULL
            OR shirt_number BETWEEN 1 AND 99
        ),

    CONSTRAINT unique_player_registration
        UNIQUE (player_id, team_id, season_id)
);


-- ============================================================
-- 10. PLAYER DOCUMENT
-- ============================================================

CREATE TABLE player_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    player_registration_id UUID NOT NULL,

    document_type document_type NOT NULL,

    file_url TEXT NOT NULL,

    verification_status verification_status NOT NULL DEFAULT 'PENDING',

    verified_by UUID,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_player_document_registration
        FOREIGN KEY (player_registration_id)
        REFERENCES player_registration(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_player_document_verifier
        FOREIGN KEY (verified_by)
        REFERENCES "user"(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 11. GROUND
-- ============================================================

CREATE TABLE ground (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    location VARCHAR(255),

    address TEXT,

    capacity INTEGER,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_ground_capacity
        CHECK (
            capacity IS NULL OR capacity >= 0
        )
);


-- ============================================================
-- 12. FIXTURE
-- ============================================================

CREATE TABLE fixture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    season_id UUID NOT NULL,

    age_group_id UUID NOT NULL,

    home_team_id UUID NOT NULL,

    away_team_id UUID NOT NULL,

    ground_id UUID,

    referee_id UUID,

    round_number INTEGER NOT NULL,

    scheduled_date DATE,

    kickoff_time TIME,

    status fixture_status NOT NULL DEFAULT 'SCHEDULED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_fixture_season
        FOREIGN KEY (season_id)
        REFERENCES season(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_fixture_age_group
        FOREIGN KEY (age_group_id)
        REFERENCES age_group(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_fixture_home_team
        FOREIGN KEY (home_team_id)
        REFERENCES team(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_fixture_away_team
        FOREIGN KEY (away_team_id)
        REFERENCES team(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_fixture_ground
        FOREIGN KEY (ground_id)
        REFERENCES ground(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_fixture_referee
        FOREIGN KEY (referee_id)
        REFERENCES referee(id)
        ON DELETE SET NULL,

    CONSTRAINT valid_fixture_teams
        CHECK (home_team_id <> away_team_id),

    CONSTRAINT valid_round_number
        CHECK (round_number > 0)
);


-- ============================================================
-- 13. MATCH
-- ============================================================

CREATE TABLE match (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fixture_id UUID NOT NULL UNIQUE,

    home_score INTEGER NOT NULL DEFAULT 0,

    away_score INTEGER NOT NULL DEFAULT 0,

    status match_status NOT NULL DEFAULT 'IN_PROGRESS',

    submitted_by UUID,

    submitted_at TIMESTAMPTZ,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_match_fixture
        FOREIGN KEY (fixture_id)
        REFERENCES fixture(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_match_submitter
        FOREIGN KEY (submitted_by)
        REFERENCES "user"(id)
        ON DELETE SET NULL,

    CONSTRAINT valid_home_score
        CHECK (home_score >= 0),

    CONSTRAINT valid_away_score
        CHECK (away_score >= 0)
);


-- ============================================================
-- 14. MATCHDAY SQUAD
-- ============================================================

CREATE TABLE matchday_squad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    match_id UUID NOT NULL,

    team_id UUID NOT NULL,

    player_registration_id UUID NOT NULL,

    starting BOOLEAN NOT NULL DEFAULT FALSE,

    substitute BOOLEAN NOT NULL DEFAULT FALSE,

    goalkeeper BOOLEAN NOT NULL DEFAULT FALSE,

    shirt_number INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_matchday_squad_match
        FOREIGN KEY (match_id)
        REFERENCES match(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_matchday_squad_team
        FOREIGN KEY (team_id)
        REFERENCES team(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_matchday_squad_player
        FOREIGN KEY (player_registration_id)
        REFERENCES player_registration(id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_matchday_role
        CHECK (
            starting = TRUE
            OR substitute = TRUE
        ),

    CONSTRAINT valid_matchday_shirt_number
        CHECK (
            shirt_number IS NULL
            OR shirt_number BETWEEN 1 AND 99
        ),

    CONSTRAINT unique_player_per_match
        UNIQUE (match_id, player_registration_id)
);


-- ============================================================
-- 15. MATCH EVENT
-- ============================================================

CREATE TABLE match_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    match_id UUID NOT NULL,

    team_id UUID NOT NULL,

    player_registration_id UUID,

    assist_player_registration_id UUID,

    event_type match_event_type NOT NULL,

    minute INTEGER,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_match_event_match
        FOREIGN KEY (match_id)
        REFERENCES match(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_match_event_team
        FOREIGN KEY (team_id)
        REFERENCES team(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_match_event_player
        FOREIGN KEY (player_registration_id)
        REFERENCES player_registration(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_match_event_assist_player
        FOREIGN KEY (assist_player_registration_id)
        REFERENCES player_registration(id)
        ON DELETE RESTRICT,

    CONSTRAINT valid_event_minute
        CHECK (
            minute IS NULL OR minute >= 0
        ),

    CONSTRAINT valid_assist
        CHECK (
            event_type = 'GOAL'
            OR assist_player_registration_id IS NULL
        ),

    CONSTRAINT own_goal_has_no_player
        CHECK (
            event_type <> 'OWN_GOAL'
            OR player_registration_id IS NULL
        )
);


-- ============================================================
-- 16. FORFEIT
-- ============================================================

CREATE TABLE forfeit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    match_id UUID NOT NULL,

    team_id UUID NOT NULL,

    reason TEXT NOT NULL,

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    recorded_by UUID,

    notes TEXT,

    CONSTRAINT fk_forfeit_match
        FOREIGN KEY (match_id)
        REFERENCES match(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forfeit_team
        FOREIGN KEY (team_id)
        REFERENCES team(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_forfeit_recorder
        FOREIGN KEY (recorded_by)
        REFERENCES "user"(id)
        ON DELETE SET NULL,

    CONSTRAINT unique_forfeit_per_team_match
        UNIQUE (match_id, team_id)
);


-- ============================================================
-- 17. AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    action audit_action NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID,

    old_values JSONB,

    new_values JSONB,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_log_user
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE SET NULL
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_manager_user_id
    ON manager(user_id);

CREATE INDEX idx_referee_user_id
    ON referee(user_id);

CREATE INDEX idx_age_group_season_id
    ON age_group(season_id);

CREATE INDEX idx_team_manager_id
    ON team(manager_id);

CREATE INDEX idx_team_age_group_id
    ON team(age_group_id);

CREATE INDEX idx_team_application_manager_id
    ON team_application(manager_id);

CREATE INDEX idx_team_application_status
    ON team_application(status);

CREATE INDEX idx_player_registration_player_id
    ON player_registration(player_id);

CREATE INDEX idx_player_registration_team_id
    ON player_registration(team_id);

CREATE INDEX idx_player_registration_season_id
    ON player_registration(season_id);

CREATE INDEX idx_player_document_registration_id
    ON player_document(player_registration_id);

CREATE INDEX idx_fixture_season_id
    ON fixture(season_id);

CREATE INDEX idx_fixture_age_group_id
    ON fixture(age_group_id);

CREATE INDEX idx_fixture_home_team_id
    ON fixture(home_team_id);

CREATE INDEX idx_fixture_away_team_id
    ON fixture(away_team_id);

CREATE INDEX idx_fixture_ground_id
    ON fixture(ground_id);

CREATE INDEX idx_fixture_referee_id
    ON fixture(referee_id);

CREATE INDEX idx_fixture_scheduled_date
    ON fixture(scheduled_date);

CREATE INDEX idx_match_fixture_id
    ON match(fixture_id);

CREATE INDEX idx_matchday_squad_match_id
    ON matchday_squad(match_id);

CREATE INDEX idx_matchday_squad_team_id
    ON matchday_squad(team_id);

CREATE INDEX idx_match_event_match_id
    ON match_event(match_id);

CREATE INDEX idx_match_event_player_id
    ON match_event(player_registration_id);

CREATE INDEX idx_match_event_team_id
    ON match_event(team_id);

CREATE INDEX idx_forfeit_match_id
    ON forfeit(match_id);

CREATE INDEX idx_audit_log_user_id
    ON audit_log(user_id);

CREATE INDEX idx_audit_log_entity
    ON audit_log(entity_type, entity_id);

CREATE INDEX idx_audit_log_created_at
    ON audit_log(created_at);


-- ============================================================
-- END OF KASIBALL DATABASE SCHEMA
-- ============================================================