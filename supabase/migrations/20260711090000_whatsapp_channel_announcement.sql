-- Promote the ICTF Institute WhatsApp channel via the existing marketing announcement popup

INSERT INTO public.marketing_announcements (
  title,
  body,
  cta_label,
  cta_url,
  content_type,
  display_style,
  is_active
) VALUES (
  'Follow ICTF Institute on WhatsApp',
  'Stay updated with the latest courses, results, and announcements — follow our official WhatsApp channel.',
  'Join WhatsApp Channel',
  'https://whatsapp.com/channel/0029Va6NAaj3QxS5UNXs0C1Z',
  'text_image_link',
  'promo',
  true
);
