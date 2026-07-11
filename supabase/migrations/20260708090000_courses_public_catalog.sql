-- Public course catalog: dedicated visibility flag + guaranteed slugs so
-- /courses/[slug] marketing pages can index every course independently of
-- the home-page marquee (show_on_home).

alter table public.courses
  add column if not exists is_public boolean not null default true;

-- Backfill missing slugs from the course name (same slugify as addCourse in
-- src/lib/actions/admin.ts). slug is UNIQUE, so collisions — with existing
-- slugs or between backfilled rows — get a short id suffix.
with candidates as (
  select
    id,
    trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) as base
  from public.courses
  where slug is null or slug = ''
),
resolved as (
  select
    c.id,
    case
      when nullif(c.base, '') is null
        then 'course-' || left(c.id::text, 8)
      when exists (select 1 from public.courses x where x.slug = c.base)
        or count(*) over (partition by c.base) > 1
        then c.base || '-' || left(c.id::text, 4)
      else c.base
    end as slug
  from candidates c
)
update public.courses co
set slug = r.slug
from resolved r
where co.id = r.id;
