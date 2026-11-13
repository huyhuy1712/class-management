CREATE TABLE teacher_mission_claims (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_code VARCHAR(60) NOT NULL,
    reward_points INTEGER NOT NULL CHECK (reward_points > 0),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (teacher_id, mission_code)
);

CREATE INDEX idx_teacher_mission_claims_teacher
    ON teacher_mission_claims (teacher_id, claimed_at DESC);
