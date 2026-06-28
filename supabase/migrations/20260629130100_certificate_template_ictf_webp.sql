-- Point active certificate templates at the ICTF webp artwork and refreshed field positions.
UPDATE public.certificate_templates
SET
  image_url = '/landing/ictf-certificate.webp',
  field_config = '{
    "certificateNumber": { "x": 88, "y": 4.5, "fontSize": 14, "color": "#FFFFFF", "align": "right", "fontFamily": "Inter" },
    "studentName": { "x": 50, "y": 44, "fontSize": 50, "color": "#273461", "align": "center", "fontFamily": "DancingScript", "gradient": true, "cover": { "width": 58, "height": 7, "color": "#FFFFFF" } },
    "courseName": { "x": 50, "y": 57.5, "fontSize": 24, "color": "#273461", "align": "center", "fontFamily": "Inter", "fontWeight": 700, "cover": { "width": 72, "height": 5.5, "color": "#FFFFFF" } },
    "issueDate": { "x": 79, "y": 83.5, "fontSize": 15, "color": "#273461", "align": "center", "fontFamily": "Inter", "fontWeight": 700, "format": "DD.MM.YYYY", "cover": { "width": 16, "height": 3.5, "color": "#FFFFFF" } }
  }'::jsonb,
  updated_at = now()
WHERE is_active = true;

UPDATE public.certificate_templates
SET image_url = '/landing/ictf-certificate.webp'
WHERE image_url IN ('/landing/ICTF - Certificate.webp', '/landing/ICTF - Certificate.png');
