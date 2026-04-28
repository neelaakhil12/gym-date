-- Create partner_requests table
CREATE TABLE IF NOT EXISTS public.partner_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    gym_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (for the registration form)
CREATE POLICY "Allow public inserts" ON public.partner_requests
    FOR INSERT WITH CHECK (true);

-- Allow admins to view/update
CREATE POLICY "Allow admins to view/update" ON public.partner_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role_id = 'super_admin'
        )
    );
