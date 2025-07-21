-- BrokerAI - Database Setup per Sistema Billing e Monitoraggio Limiti
-- Eseguire in Supabase SQL Editor

-- Tabella subscriptions per gestire i piani utente
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    autumn_customer_id TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'professional', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired')),
    billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id), -- Un utente può avere solo una subscription attiva
    UNIQUE(stripe_customer_id),
    UNIQUE(stripe_subscription_id)
);

-- Tabella usage per tracciare l'utilizzo mensile
CREATE TABLE IF NOT EXISTS usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    analyses_used INTEGER DEFAULT 0 CHECK (analyses_used >= 0),
    companies_active INTEGER DEFAULT 0 CHECK (companies_active >= 0),
    ai_analyses_used INTEGER DEFAULT 0 CHECK (ai_analyses_used >= 0),
    exports_generated INTEGER DEFAULT 0 CHECK (exports_generated >= 0),
    api_calls_made INTEGER DEFAULT 0 CHECK (api_calls_made >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, subscription_id, period_start), -- Un record usage per utente per periodo
    CHECK (period_end > period_start)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_subscription_id ON usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_period ON usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_current_period ON usage(period_start) WHERE period_end >= NOW();

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at 
    BEFORE UPDATE ON usage 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Policy per subscriptions: utenti possono vedere solo le proprie subscription
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy per usage: utenti possono vedere solo il proprio usage
CREATE POLICY "Users can view own usage" ON usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Funzione helper per ottenere il piano corrente di un utente
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    plan_type TEXT;
BEGIN
    SELECT s.plan_type INTO plan_type
    FROM subscriptions s
    WHERE s.user_id = user_uuid
    AND s.status = 'active'
    LIMIT 1;
    
    RETURN COALESCE(plan_type, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione helper per ottenere l'utilizzo corrente del mese
CREATE OR REPLACE FUNCTION get_current_month_usage(user_uuid UUID)
RETURNS TABLE(
    analyses_used INTEGER,
    companies_active INTEGER,
    ai_analyses_used INTEGER,
    exports_generated INTEGER,
    api_calls_made INTEGER
) AS $$
DECLARE
    current_period_start TIMESTAMPTZ;
    current_period_end TIMESTAMPTZ;
BEGIN
    -- Calcola inizio e fine del mese corrente
    current_period_start := date_trunc('month', NOW());
    current_period_end := (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day');
    
    RETURN QUERY
    SELECT 
        COALESCE(u.analyses_used, 0)::INTEGER,
        COALESCE(u.companies_active, 0)::INTEGER,
        COALESCE(u.ai_analyses_used, 0)::INTEGER,
        COALESCE(u.exports_generated, 0)::INTEGER,
        COALESCE(u.api_calls_made, 0)::INTEGER
    FROM usage u
    WHERE u.user_id = user_uuid
    AND u.period_start >= current_period_start
    AND u.period_end <= current_period_end
    LIMIT 1;
    
    -- Se non esiste record per il mese corrente, ritorna zeri
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, 0, 0, 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserisci dati di esempio per testing (opzionale)
-- NOTA: Sostituire con veri UUID utente per il testing
/*
INSERT INTO subscriptions (user_id, plan_type, status) VALUES
('46c40c11-3bee-4180-95c5-3773230c8c42', 'free', 'active');

INSERT INTO usage (user_id, subscription_id, period_start, period_end, analyses_used, companies_active) 
SELECT 
    '46c40c11-3bee-4180-95c5-3773230c8c42',
    s.id,
    date_trunc('month', NOW()),
    (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day'),
    2,
    1
FROM subscriptions s 
WHERE s.user_id = '46c40c11-3bee-4180-95c5-3773230c8c42';
*/

-- Verifica che tutto sia stato creato correttamente
SELECT 
    'subscriptions' as table_name,
    COUNT(*) as record_count
FROM subscriptions
UNION ALL
SELECT 
    'usage' as table_name,
    COUNT(*) as record_count
FROM usage;

-- Fine setup database
