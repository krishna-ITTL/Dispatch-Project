-- =============================================
-- Phase 1: Database Schema Updates
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- work_orders table additions
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS dispatch_ref TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS packing_ref TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS loading_ref TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS delivery_deadline TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS mva TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS customer_inspection TEXT DEFAULT 'Pending';

-- packing_items table additions
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS height NUMERIC DEFAULT 0;
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS length NUMERIC DEFAULT 0;
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS width NUMERIC DEFAULT 0;
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS production_sig TEXT;
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS quality_sig TEXT;

-- loading_lists table additions
ALTER TABLE public.loading_lists ADD COLUMN IF NOT EXISTS vehicle_capacity NUMERIC DEFAULT 10000;
