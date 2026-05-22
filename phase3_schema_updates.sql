
-- Add approval fields to work_orders
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
