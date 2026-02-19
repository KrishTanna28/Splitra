-- =============================================================
-- Splitra – Complete Database Schema
-- PostgreSQL
-- Generated: 2026-02-19
-- =============================================================
-- Run this file on a fresh database to recreate the full schema.
-- Tables are created in dependency order (no forward references).
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
-- (Uncomment if your hosting provider does not enable these by default)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255)        NOT NULL,
    email            VARCHAR(255)        NOT NULL UNIQUE,
    password         TEXT                NOT NULL,
    upi_id           VARCHAR(255),
    profile_picture  TEXT,               -- Cloudinary URL
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);


-- ─────────────────────────────────────────────────────────────
-- 2. OTP CODES  (login two-factor verification)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255)  NOT NULL,
    otp         VARCHAR(10)   NOT NULL,
    expires_at  TIMESTAMPTZ   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes (email);


-- ─────────────────────────────────────────────────────────────
-- 3. GROUPS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255)  NOT NULL,
    description     TEXT,
    created_by_id   INTEGER       REFERENCES users (id) ON DELETE SET NULL,
    created_by      VARCHAR(255),          -- denormalised display name
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_created_by_id ON groups (created_by_id);


-- ─────────────────────────────────────────────────────────────
-- 4. GROUP MEMBERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
    id          SERIAL PRIMARY KEY,
    group_id    INTEGER  NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    user_id     INTEGER  NOT NULL REFERENCES users  (id) ON DELETE CASCADE,
    user_email  VARCHAR(255),              -- cached for quick look-up
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id  ON group_members (user_id);


-- ─────────────────────────────────────────────────────────────
-- 5. GROUP BUDGETS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_budgets (
    id             SERIAL PRIMARY KEY,
    group_id       INTEGER        NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    monthly_limit  NUMERIC(12,2)  NOT NULL CHECK (monthly_limit > 0),
    active         BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_budgets_group_id ON group_budgets (group_id);


-- ─────────────────────────────────────────────────────────────
-- 6. EXPENSES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
    id           SERIAL PRIMARY KEY,
    group_id     INTEGER        NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    paid_by_id   INTEGER        NOT NULL REFERENCES users  (id) ON DELETE CASCADE,
    paid_by      VARCHAR(255)   NOT NULL,   -- denormalised display name
    amount       NUMERIC(12,2)  NOT NULL CHECK (amount > 0),
    category     VARCHAR(100),
    description  TEXT,
    receipt_url  TEXT,                      -- Cloudinary URL
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_group_id   ON expenses (group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_id ON expenses (paid_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses (created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 7. EXPENSE SHARES  (who owes what for each expense)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_shares (
    id          SERIAL PRIMARY KEY,
    expense_id  INTEGER        NOT NULL REFERENCES expenses (id) ON DELETE CASCADE,
    user_id     INTEGER        NOT NULL REFERENCES users    (id) ON DELETE CASCADE,
    amount      NUMERIC(12,2)  NOT NULL CHECK (amount >= 0),
    UNIQUE (expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_shares_expense_id ON expense_shares (expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_user_id    ON expense_shares (user_id);


-- ─────────────────────────────────────────────────────────────
-- 8. EXPENSE COMMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_comments (
    id          SERIAL PRIMARY KEY,
    expense_id  INTEGER  NOT NULL REFERENCES expenses (id) ON DELETE CASCADE,
    user_id     INTEGER  NOT NULL REFERENCES users    (id) ON DELETE CASCADE,
    comment     TEXT,
    emoji       VARCHAR(10),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_comments_expense_id ON expense_comments (expense_id);


-- ─────────────────────────────────────────────────────────────
-- 9. SETTLEMENTS  (manual / confirmed payments between members)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlements (
    id          SERIAL PRIMARY KEY,
    group_id    INTEGER        NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    paid_by     INTEGER        NOT NULL REFERENCES users  (id) ON DELETE CASCADE,  -- the person who paid
    paid_to     INTEGER        NOT NULL REFERENCES users  (id) ON DELETE CASCADE,  -- the person receiving
    amount      NUMERIC(12,2)  NOT NULL CHECK (amount > 0),
    note        TEXT,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements (group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_paid_by  ON settlements (paid_by);
CREATE INDEX IF NOT EXISTS idx_settlements_paid_to  ON settlements (paid_to);


-- ─────────────────────────────────────────────────────────────
-- 10. RECURRING CONTRIBUTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_contributions (
    id           SERIAL PRIMARY KEY,
    group_id     INTEGER        NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    user_id      INTEGER        NOT NULL REFERENCES users  (id) ON DELETE CASCADE,
    amount       NUMERIC(12,2)  NOT NULL CHECK (amount > 0),
    start_date   DATE           NOT NULL,
    frequency    VARCHAR(20)    NOT NULL DEFAULT 'monthly'
                                CHECK (frequency IN ('daily','weekly','monthly','quarterly','yearly')),
    description  TEXT,
    category     VARCHAR(100),
    active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_contributions_group_id ON recurring_contributions (group_id);
CREATE INDEX IF NOT EXISTS idx_recurring_contributions_user_id  ON recurring_contributions (user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_contributions_active   ON recurring_contributions (active) WHERE active = TRUE;


-- ─────────────────────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────────────────────

-- Total expenses per group  (used by getTotalExpenses)
CREATE OR REPLACE VIEW group_total_expenses AS
SELECT
    group_id,
    COUNT(*)          AS expense_count,
    COALESCE(SUM(amount), 0) AS total_expenses
FROM expenses
GROUP BY group_id;


-- Groups with member count  (used by getGroupMemberCount)
CREATE OR REPLACE VIEW group_with_member_count AS
SELECT
    g.*,
    COUNT(gm.user_id) AS member_count
FROM groups g
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id;


-- Comment counts per expense  (used by getCommentCount)
CREATE OR REPLACE VIEW expense_comment_counts AS
SELECT
    expense_id,
    COUNT(*) AS comment_count
FROM expense_comments
GROUP BY expense_id;


-- ─────────────────────────────────────────────────────────────
-- END OF SCHEMA
-- ─────────────────────────────────────────────────────────────