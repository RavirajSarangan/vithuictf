-- Refresh certificate overlay positions (canvas text + course description field).
UPDATE public.certificate_templates
SET
  image_url = '/landing/ictf-certificate.webp',
  field_config = '{
    "certificateNumber": { "x": 88, "y": 3.8, "fontSize": 12, "color": "#FFFFFF", "align": "right", "fontFamily": "Inter", "cover": { "width": 28, "height": 4.5, "color": "#1B3A6B" } },
    "studentName": { "x": 50, "y": 44.5, "fontSize": 58, "color": "#273461", "align": "center", "fontFamily": "DancingScript", "gradient": true, "cover": { "width": 66, "height": 11, "color": "#FFFFFF" }, "maxWidthPercent": 58 },
    "courseName": { "x": 50, "y": 57.8, "fontSize": 30, "color": "#273461", "align": "center", "fontFamily": "Inter", "fontWeight": 700, "cover": { "width": 76, "height": 6, "color": "#FFFFFF" }, "maxWidthPercent": 70 },
    "courseDescription": { "x": 50, "y": 64.5, "fontSize": 13, "color": "#555555", "align": "center", "fontFamily": "Inter", "fontWeight": 400, "cover": { "width": 84, "height": 9, "color": "#FFFFFF" }, "maxWidthPercent": 78 },
    "issueDate": { "x": 73, "y": 81, "fontSize": 16, "color": "#273461", "align": "center", "fontFamily": "Inter", "fontWeight": 700, "format": "DD.MM.YYYY", "cover": { "width": 20, "height": 5, "color": "#FFFFFF" } }
  }'::jsonb,
  updated_at = now()
WHERE is_active = true;
