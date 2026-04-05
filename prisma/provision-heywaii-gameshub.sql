-- Run in Aliyun RDS / DMS with a high-privilege account (not the app account).
-- Creates an isolated database for HeyWaii Gameshub, separate from database01 (Ourea / SengokuBattle).

CREATE DATABASE IF NOT EXISTS heywaii_gameshub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Grant the existing app user access only to this database (adjust host '%' if you use fixed IPs).
GRANT ALL PRIVILEGES ON heywaii_gameshub.* TO 'lantu_ai_bot_workbuddy'@'%';

FLUSH PRIVILEGES;
