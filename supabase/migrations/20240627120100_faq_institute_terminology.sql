-- Replace tuition terminology in SEO FAQs with institute terminology
UPDATE public.faqs
SET
  answer = 'Yes. ICTF delivers A/L ICT institute programs through live Zoom classes led by experienced faculty, including revision programs, past paper discussions, and access to the ICTF Student Portal for notes and recordings.',
  answer_ta = 'ஆம். ICTF அனுபவமுள்ள ஆசிரியர்களால் நடத்தப்படும் நேரடி Zoom வகுப்புகள், மறுபரிசீலனை நிரல்கள், குறிப்புகள் மற்றும் பதிவுகளுக்கான ICTF மாணவர் தளம் வழியாக A/L ICT நிறுவனத்தை வழங்குகிறது.',
  answer_si = 'ඔව්. ICTF අත්දැකීම් සහිත ගුරුවරුන් විසින් සජීවී Zoom පන්ති, නැවත පුහුණු වැඩසටහන් සහ ICTF ශිෂ්‍ය ද්වාරය හරහා A/L ICT ආයතනය ලබා දෙයි.',
  target_keyword = 'A/L ICT institute Sri Lanka Zoom'
WHERE target_keyword = 'A/L ICT tuition Sri Lanka Zoom';

UPDATE public.faqs
SET
  question = 'How much does ICT institute cost in Sri Lanka at ICTF?',
  answer = 'ICTF institute fees are priced in Sri Lankan Rupees (LKR). Fees vary by program (O/L ICT, A/L ICT, or degree pathways). Register at ictf.lk/register or WhatsApp +94 77 459 1161 for current batch fees and payment plans.',
  question_ta = 'ICTF-ல் இலங்கையில் ICT நிறுவன கட்டணம் எவ்வளவு?',
  answer_ta = 'ICTF கட்டணங்கள் இலங்கை ரூபாயில் (LKR) வழங்கப்படுகின்றன. O/L ICT, A/L ICT அல்லது பட்ட நிரல்களுக்கு கட்டணம் மாறுபடும். ictf.lk/register-ல் பதிவு செய்யுங்கள்.',
  question_si = 'ICTF හි ශ්‍රී ලංකාවේ ICT ආයතන ගාස්තු කීයද?',
  answer_si = 'ICTF ගාස්තු ශ්‍රී ලංකා රුපියල් (LKR) වලින් ගණනය කරයි. O/L ICT, A/L ICT හෝ උපාධි මාර්ග අනුව වෙනස් වේ. ictf.lk/register හරහා ලියාපදිංචි වන්න.',
  target_keyword = 'ICT institute fees Sri Lanka LKR'
WHERE target_keyword = 'ICT tuition fees Sri Lanka LKR';

UPDATE public.faqs
SET target_keyword = 'ICT institute Jaffna Colombo Sri Lanka'
WHERE target_keyword = 'ICT tuition Jaffna Colombo Sri Lanka';
