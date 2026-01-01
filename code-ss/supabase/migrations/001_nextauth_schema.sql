-- =====================================================
-- NextAuth Schema 和认证表
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 NextAuth Schema
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- =====================================================
-- 用户表（扩展 NextAuth 标准字段）
-- =====================================================
CREATE TABLE IF NOT EXISTS next_auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ,
    image TEXT,
    -- 扩展字段
    username TEXT UNIQUE,
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
    completed_tasks INTEGER DEFAULT 0 CHECK (completed_tasks >= 0),
    hours_focused DECIMAL(10,2) DEFAULT 0 CHECK (hours_focused >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 会话表
-- =====================================================
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expires TIMESTAMPTZ NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 账户表（OAuth）
-- =====================================================
CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    oauth_token_secret TEXT,
    oauth_token TEXT,
    user_id UUID REFERENCES next_auth.users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_account_id)
);

-- =====================================================
-- 验证令牌表
-- =====================================================
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier TEXT,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (token),
    UNIQUE(token, identifier)
);

-- =====================================================
-- 授权权限
-- =====================================================
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- =====================================================
-- RLS 辅助函数：获取当前用户 ID
-- =====================================================
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- =====================================================
-- 索引优化
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON next_auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON next_auth.users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON next_auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON next_auth.accounts(user_id);

-- =====================================================
-- 自动更新 updated_at 字段的函数
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 users 表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON next_auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
