-- ==========================================
-- SYNC GYM WALLETS WITH BOOKINGS
-- ==========================================

-- 1. Create the wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id TEXT REFERENCES public.gyms(id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Partners can view their own wallet
DROP POLICY IF EXISTS "Partners can view own wallet" ON public.wallets;
CREATE POLICY "Partners can view own wallet" ON public.wallets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE public.gyms.id = public.wallets.gym_id 
            AND public.gyms.partner_id = auth.uid()
        )
    );

-- 4. Policy: Partners can update their own wallet (for payout requests)
DROP POLICY IF EXISTS "Partners can update own wallet" ON public.wallets;
CREATE POLICY "Partners can update own wallet" ON public.wallets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE public.gyms.id = public.wallets.gym_id 
            AND public.gyms.partner_id = auth.uid()
        )
    );

-- 5. Sync Data
DO $$
DECLARE
    gym_record RECORD;
    calculated_balance NUMERIC;
    comm_rate NUMERIC;
BEGIN
    FOR gym_record IN SELECT id, commission_rate FROM public.gyms LOOP
        -- Default commission to 10 if not set
        comm_rate := COALESCE(gym_record.commission_rate, 10);
        
        -- Calculate total net revenue for this gym
        -- Support both 'amount' and 'total_price'
        SELECT SUM((COALESCE(amount, total_price, 0)) * (1 - comm_rate / 100))
        INTO calculated_balance
        FROM public.bookings
        WHERE gym_id = gym_record.id AND status = 'completed';
        
        -- Default to 0 if no bookings
        calculated_balance := COALESCE(calculated_balance, 0);
        
        -- Update or Insert into wallets table
        IF EXISTS (SELECT 1 FROM public.wallets WHERE gym_id = gym_record.id) THEN
            UPDATE public.wallets 
            SET balance = calculated_balance, updated_at = NOW()
            WHERE gym_id = gym_record.id;
        ELSE
            INSERT INTO public.wallets (gym_id, balance, updated_at)
            VALUES (gym_record.id, calculated_balance, NOW());
        END IF;
        
        RAISE NOTICE 'Synced Gym %: New Balance %', gym_record.id, calculated_balance;
    END LOOP;
END $$;
