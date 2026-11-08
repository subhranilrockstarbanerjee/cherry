-- Cherry Movies Database Schema
-- Run this in your Supabase SQL Editor if you want to initialize the 'movies' table directly in Supabase

CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_format TEXT DEFAULT 'mp4',
  thumbnail_url TEXT NOT NULL,
  subtitle_url TEXT,
  subtitle_label TEXT DEFAULT 'English',
  genre TEXT,
  duration TEXT,
  release_year INT DEFAULT 2026,
  rating TEXT DEFAULT 'PG-13',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/anon) to read movies (Requirement: Movies can be seen without logging in)
CREATE POLICY "Allow public read access to movies"
  ON public.movies FOR SELECT
  USING (true);

-- Allow authenticated users / admins to insert movies
CREATE POLICY "Allow authenticated users to insert movies"
  ON public.movies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users / admins to update movies
CREATE POLICY "Allow authenticated users to update movies"
  ON public.movies FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users / admins to delete movies
CREATE POLICY "Allow authenticated users to delete movies"
  ON public.movies FOR DELETE
  TO authenticated
  USING (true);

