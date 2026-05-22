-- Work Orders Updates
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS export_domestic TEXT DEFAULT 'Domestic';
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS delivery_deadline TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS dispatch_ref TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS packing_ref TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS loading_ref TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Packing Items Updates
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2);
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS length DECIMAL(10,2);
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS width DECIMAL(10,2);
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS height DECIMAL(10,2);
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS production_sig TEXT;
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS quality_sig TEXT;
ALTER TABLE public.packing_items ADD COLUMN IF NOT EXISTS gross_weight DECIMAL(10,2);

-- Loading Lists Updates
ALTER TABLE public.loading_lists ADD COLUMN IF NOT EXISTS vehicle_capacity DECIMAL(10,2);

-- Reload PostgREST schema cache
NOTIFY pgrst, reload_schema;
