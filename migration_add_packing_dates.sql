-- Migration: Add packing start and end date columns
ALTER TABLE public.packing_items
  ADD COLUMN IF NOT EXISTS packing_start_date DATE NULL,
  ADD COLUMN IF NOT EXISTS packing_end_date DATE NULL;
