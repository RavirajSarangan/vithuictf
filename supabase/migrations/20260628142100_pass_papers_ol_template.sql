-- Idempotent O/L Past Papers folder template: root → 3 mediums → years 2011–2025
DO $$
DECLARE
  root_id UUID;
  medium_id UUID;
  year_num INT;
  medium_title TEXT;
  medium_slug TEXT;
  medium_order INT;
BEGIN
  SELECT id INTO root_id
  FROM public.pass_paper_folders
  WHERE slug = 'o-l-past-papers' AND parent_id IS NULL
  LIMIT 1;

  IF root_id IS NULL THEN
    INSERT INTO public.pass_paper_folders (
      parent_id, title, slug, description, icon_key, accent_color, layout, sort_order, published
    ) VALUES (
      NULL,
      'O/L Past Papers',
      'o-l-past-papers',
      'Ordinary Level past papers organized by medium and year.',
      'graduation-cap',
      '#1e3a5f',
      'folder',
      1,
      false
    )
    RETURNING id INTO root_id;
  END IF;

  FOR medium_title, medium_slug, medium_order IN
    SELECT * FROM (VALUES
      ('English Medium', 'english-medium', 1),
      ('Sinhala Medium', 'sinhala-medium', 2),
      ('Tamil Medium', 'tamil-medium', 3)
    ) AS m(title, slug, sort_order)
  LOOP
    SELECT id INTO medium_id
    FROM public.pass_paper_folders
    WHERE parent_id = root_id AND slug = medium_slug
    LIMIT 1;

    IF medium_id IS NULL THEN
      INSERT INTO public.pass_paper_folders (
        parent_id, title, slug, description, icon_key, accent_color, layout, sort_order, published
      ) VALUES (
        root_id,
        medium_title,
        medium_slug,
        medium_title || ' O/L past papers.',
        'folder-open',
        '#1e3a5f',
        'folder',
        medium_order,
        false
      )
      RETURNING id INTO medium_id;
    END IF;

    FOR year_num IN 2011..2025 LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.pass_paper_folders
        WHERE parent_id = medium_id AND slug = year_num::text
      ) THEN
        INSERT INTO public.pass_paper_folders (
          parent_id, title, slug, description, icon_key, accent_color, layout, sort_order, published
        ) VALUES (
          medium_id,
          year_num::text,
          year_num::text,
          '',
          'folder',
          '#1e3a5f',
          'folder',
          year_num,
          false
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;
