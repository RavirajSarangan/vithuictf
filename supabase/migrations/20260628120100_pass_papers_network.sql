-- Pass papers network: folder tree + Google Drive links (no file uploads)
CREATE TYPE public.pass_paper_layout AS ENUM ('grid', 'list', 'folder');
CREATE TYPE public.pass_paper_medium AS ENUM ('sinhala', 'tamil', 'english');
CREATE TYPE public.pass_paper_exam_type AS ENUM ('ol', 'al', 'scholarship', 'other');

CREATE TABLE public.pass_paper_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.pass_paper_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_key TEXT NOT NULL DEFAULT 'folder',
  accent_color TEXT NOT NULL DEFAULT '#1e3a5f',
  layout public.pass_paper_layout NOT NULL DEFAULT 'folder',
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, slug)
);

CREATE INDEX pass_paper_folders_parent_idx ON public.pass_paper_folders(parent_id);
CREATE INDEX pass_paper_folders_published_idx ON public.pass_paper_folders(published);

CREATE TABLE public.pass_paper_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.pass_paper_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  year INT,
  medium public.pass_paper_medium,
  exam_type public.pass_paper_exam_type NOT NULL DEFAULT 'other',
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pass_paper_items_folder_idx ON public.pass_paper_items(folder_id);
CREATE INDEX pass_paper_items_published_idx ON public.pass_paper_items(published);

ALTER TABLE public.pass_paper_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_paper_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY pass_paper_folders_public_read ON public.pass_paper_folders
  FOR SELECT USING (published = true OR public.is_super_admin());

CREATE POLICY pass_paper_folders_super_admin_write ON public.pass_paper_folders
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY pass_paper_items_public_read ON public.pass_paper_items
  FOR SELECT USING (published = true OR public.is_super_admin());

CREATE POLICY pass_paper_items_super_admin_write ON public.pass_paper_items
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
