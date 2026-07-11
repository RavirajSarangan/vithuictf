-- Star rating for success stories so testimonials can be emitted as
-- schema.org Review/AggregateRating structured data. Curated testimonials
-- default to 5; admins can lower per story.

alter table public.success_stories
  add column if not exists rating smallint not null default 5
  check (rating between 1 and 5);
