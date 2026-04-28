-- ==========================================
-- FIX: Partner Access to Bookings & Data
-- ==========================================

-- 1. Enable RLS on bookings if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow Partners to view bookings for their own gyms
-- A partner can see a booking if the gym_id in the booking 
-- belongs to a gym where partner_id = their user id.
DROP POLICY IF EXISTS "Partners can view their own gym bookings" ON public.bookings;
CREATE POLICY "Partners can view their own gym bookings" ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms 
      WHERE public.gyms.id = public.bookings.gym_id 
      AND public.gyms.partner_id = auth.uid()
    )
  );

-- 3. Policy: Allow Users to view their own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: Allow Super Admins to view ALL bookings
DROP POLICY IF EXISTS "Super admins can view all bookings" ON public.bookings;
CREATE POLICY "Super admins can view all bookings" ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() 
      AND public.profiles.role_id = 'super_admin'
    )
  );

-- 5. Ensure gyms table also has correct policies for partners
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners can view own gym" ON public.gyms;
CREATE POLICY "Partners can view own gym" ON public.gyms
  FOR SELECT
  USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "Partners can update own gym" ON public.gyms;
CREATE POLICY "Partners can update own gym" ON public.gyms
  FOR UPDATE
  USING (partner_id = auth.uid());

-- 6. PUBLIC ACCESS: Allow everyone to see gyms (for the explore page)
DROP POLICY IF EXISTS "Anyone can view gyms" ON public.gyms;
CREATE POLICY "Anyone can view gyms" ON public.gyms
  FOR SELECT
  USING (true);

-- 7. Payout Requests RLS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners can view own payouts" ON public.payout_requests;
CREATE POLICY "Partners can view own payouts" ON public.payout_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms 
      WHERE public.gyms.id = public.payout_requests.gym_id 
      AND public.gyms.partner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partners can insert own payouts" ON public.payout_requests;
CREATE POLICY "Partners can insert own payouts" ON public.payout_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gyms 
      WHERE public.gyms.id = gym_id 
      AND public.gyms.partner_id = auth.uid()
    )
  );
