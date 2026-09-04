-- ============================================================
-- Extend rescue_incidents to capture what calculate_priority()
-- actually returns (children/elderly/injured/mobility_impaired,
-- flood_risk). Module 5 doesn't use these yet, but they're free
-- to store now and will matter for smarter prioritization later
-- (e.g. weighting injured/mobility_impaired groups higher).
-- ============================================================

alter table rescue_incidents add column if not exists children integer;
alter table rescue_incidents add column if not exists elderly integer;
alter table rescue_incidents add column if not exists injured integer;
alter table rescue_incidents add column if not exists mobility_impaired integer;
alter table rescue_incidents add column if not exists flood_risk numeric(5,2);
