-- =============================================
-- ScalpScan AI — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- Notes:
-- - If you see: "new row violates row-level security policy" while saving a scan,
--   it means the required RLS policies were not applied in your Supabase project yet.
-- - This file is written to be re-runnable (idempotent-ish) using DO blocks.

-- 1. Create scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  image_url     TEXT,
  disease       TEXT        NOT NULL,
  confidence    FLOAT       NOT NULL,
  severity_score FLOAT      NOT NULL,
  all_predictions JSONB,
  notes         TEXT
);

-- 2. Enable Row Level Security
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (users can only access their own scans)
DO $$
BEGIN
  CREATE POLICY "Users can view own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can insert own scans"
    ON public.scans FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can update own scans"
    ON public.scans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can delete own scans"
    ON public.scans FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 4. Index for faster queries per user
CREATE INDEX IF NOT EXISTS idx_scans_user_created
  ON public.scans(user_id, created_at DESC);

-- 5. Storage bucket + policies for uploaded scalp images
-- The frontend uploads to bucket: 'scalp-images'
-- Path format: `${auth.uid()}/${Date.now()}.ext`
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('scalp-images', 'scalp-images', false);
EXCEPTION WHEN unique_violation THEN
  NULL;
END $$;

-- Allow authenticated users to manage only their own folder in this bucket.
DO $$
BEGIN
  CREATE POLICY "Scalp images: users can upload to own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'scalp-images'
      AND split_part(name, '/', 1) = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Scalp images: users can read own files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'scalp-images'
      AND split_part(name, '/', 1) = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Scalp images: users can delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'scalp-images'
      AND split_part(name, '/', 1) = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
