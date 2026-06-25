-- SEO FAQ content + keep site live (homepage Coming Soon overlay stays admin-controlled)
UPDATE public.platform_settings
SET site_public_mode = 'live'
WHERE id = 1;

-- Bilingual + Sinhala FAQ columns for AEO
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS question_ta TEXT,
  ADD COLUMN IF NOT EXISTS answer_ta TEXT,
  ADD COLUMN IF NOT EXISTS question_si TEXT,
  ADD COLUMN IF NOT EXISTS answer_si TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS target_keyword TEXT;

-- Sri Lanka ICT SEO FAQs (EN + TA + SI)
INSERT INTO public.faqs (question, answer, question_ta, answer_ta, question_si, answer_si, category, target_keyword, sort_order)
VALUES
  (
    'What is the best way to study O/L ICT in Sri Lanka?',
    'ICTF (ICT Foundation) offers structured O/L ICT classes via live Zoom sessions, past paper practice at islandwide paper centers, and an online student portal with video lessons and revision materials. Students across all districts can enroll online.',
    'இலங்கையில் O/L ICT படிப்பதற்கான சிறந்த வழி என்ன?',
    'ICTF (ICT அடித்தளம்) நேரடி Zoom வகுப்புகள், தீவு முழுவதும் பேப்பர் மையங்களில் பயிற்சி, வீடியோ பாடங்கள் மற்றும் மறுபரிசீலனை பொருட்களுடன் கட்டமைக்கப்பட்ட O/L ICT வகுப்புகளை வழங்குகிறது.',
    'ශ්‍රී ලංකාවේ O/L ICT අධ්‍යයනය කිරීමට හොඳම ක්‍රමය කුමක්ද?',
    'ICTF (ICT Foundation) සජීවී Zoom පන්ති, දිවයින පුරා ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන, වීඩියෝ පාඩම් සහ නැවත පුහුණු ද්‍රව්‍ය සහිත සංවිධානාත්මක O/L ICT පන්ති ලබා දෙයි.',
    'ol-ict',
    'O/L ICT classes Sri Lanka',
    10
  ),
  (
    'Does ICTF offer A/L ICT online classes via Zoom?',
    'Yes. ICTF delivers A/L ICT tuition through live Zoom classes led by experienced faculty, including revision programs, past paper discussions, and access to the ICTF Student Portal for notes and recordings.',
    'ICTF A/L ICT ஆன்லைன் Zoom வகுப்புகளை வழங்குகிறதா?',
    'ஆம். ICTF அனுபவமுள்ள ஆசிரியர்களால் நடத்தப்படும் நேரடி Zoom வகுப்புகள், மறுபரிசீலனை நிரல்கள், குறிப்புகள் மற்றும் பதிவுகளுக்கான ICTF மாணவர் தளம் வழியாக A/L ICT பயிற்சியை வழங்குகிறது.',
    'ICTF A/L ICT Zoom මගින් අන්තර්ජාල පන්ති ලබා දෙනවාද?',
    'ඔව්. ICTF අත්දැකීම් සහිත ගුරුවරුන් විසින් සජීවී Zoom පන්ති, නැවත පුහුණු වැඩසටහන් සහ ICTF ශිෂ්‍ය ද්වාරය හරහා A/L ICT ටියුෂන් ලබා දෙයි.',
    'al-ict',
    'A/L ICT tuition Sri Lanka Zoom',
    11
  ),
  (
    'Where are ICTF paper centers in Sri Lanka?',
    'ICTF operates a growing islandwide paper center network across districts including Jaffna, Colombo, Kandy, Kurunegala, Gampaha, and more. Visit ictf.lk/network/paper-centers or contact us on WhatsApp +94 77 459 1161 for your nearest center.',
    'இலங்கையில் ICTF பேப்பர் மையங்கள் எங்கே உள்ளன?',
    'ICTF யாழ்ப்பாணம், கொழும்பு, கண்டி, குருணாகலை, கம்பஹா உள்ளிட்ட மாவட்டங்களில் தீவு முழுவதும் பேப்பர் மைய நெட்வொர்க்கை இயக்குகிறது. ictf.lk/network/paper-centers பார்வையிடுங்கள்.',
    'ශ්‍රී ලංකාවේ ICTF ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන කොහේද?',
    'ICTF යාපනය, කොළඹ, මහනුවර, කුරුණෑගල, ගම්පහ ඇතුළු දිස්ත්‍රික්කවල දිවයින පුරා මධ්‍යස්ථාන ජාලයක් පවත්වයි. ictf.lk/network/paper-centers බලන්න.',
    'centers',
    'ICT paper classes Sri Lanka',
    12
  ),
  (
    'How much does ICT tuition cost in Sri Lanka at ICTF?',
    'ICTF tuition fees are priced in Sri Lankan Rupees (LKR). Fees vary by program (O/L ICT, A/L ICT, or degree pathways). Register at ictf.lk/register or WhatsApp +94 77 459 1161 for current batch fees and payment plans.',
    'ICTF-ல் இலங்கையில் ICT பயிற்சி கட்டணம் எவ்வளவு?',
    'ICTF கட்டணங்கள் இலங்கை ரூபாயில் (LKR) வழங்கப்படுகின்றன. O/L ICT, A/L ICT அல்லது பட்ட நிரல்களுக்கு கட்டணம் மாறுபடும். ictf.lk/register-ல் பதிவு செய்யுங்கள்.',
    'ICTF හි ශ්‍රී ලංකාවේ ICT ටියුෂන් ගාස්තු කීයද?',
    'ICTF ගාස්තු ශ්‍රී ලංකා රුපියල් (LKR) වලින් ගණනය කරයි. O/L ICT, A/L ICT හෝ උපාධි මාර්ග අනුව වෙනස් වේ. ictf.lk/register හරහා ලියාපදිංචි වන්න.',
    'fees',
    'ICT tuition fees Sri Lanka LKR',
    13
  ),
  (
    'Can I study ICT from Jaffna, Colombo, or other districts?',
    'Yes. ICTF is headquartered in Jaffna and serves students islandwide through online Zoom classes and local paper centers. Whether you are in Jaffna, Colombo, Kandy, or any district, you can enroll and learn with ICTF.',
    'யாழ்ப்பாணம், கொழும்பு அல்லது பிற மாவட்டங்களிலிருந்து ICT படிக்க முடியுமா?',
    'ஆம். ICTF யாழ்ப்பாணத்தில் அமைந்துள்ளது மற்றும் ஆன்லைன் Zoom வகுப்புகள் மற்றும் உள்ளூர் பேப்பர் மையங்கள் மூலம் தீவு முழுவதும் மாணவர்களுக்கு சேவை செய்கிறது.',
    'යාපනය, කොළඹ හෝ වෙනත් දිස්ත්‍රික්කවලින් ICT අධ්‍යයනය කළ හැකිද?',
    'ඔව්. ICTF යාපනයේ ප්‍රධාන කාර්යාලය සහිත අතර Zoom පන්ති සහ දේශීය මධ්‍යස්ථාන හරහා දිවයින පුරා ශිෂ්‍යයින්ට සේවය කරයි.',
    'geo',
    'ICT tuition Jaffna Colombo Sri Lanka',
    14
  ),
  (
    'Who founded ICTF and teaches ICT?',
    'ICT Foundation (ICTF) was founded by Vithoosan Sivanathan, an experienced ICT educator in Sri Lanka known for producing top O/L and A/L ICT examination results including island ranks.',
    'ICTF-ஐ யார் நிறுவினார் மற்றும் ICT கற்பிக்கிறார்?',
    'ICT அடித்தளத்தை (ICTF) விதூசன் சிவநாதன் நிறுவினார் — இலங்கையில் O/L மற்றும் A/L ICT தேர்வு முடிவுகளில் தீவு தரவரிசைகள் உட்பட சிறந்த முடிவுகளை உருவாக்கிய அனுபவமுள்ள ICT கல்வியாளர்.',
    'ICTF නිර්මාණය කළේ කවුද?',
    'ICT Foundation (ICTF) විසින් Vithoosan Sivanathan නිර්මාණය කරන ලදී — ශ්‍රී ලංකාවේ O/L සහ A/L ICT විභාග සාර්ථකත්වය සහ දිවයින ශ්‍රේණිගත කිරීම් සමඟ ප්‍රසිද්ධ ICT අධ්‍යාපනිකයෙක්.',
    'founder',
    'Vithoosan Sivanathan ICT teacher Sri Lanka',
    15
  ),
  (
    'How do I register for ICTF ICT classes?',
    'Register online at ictf.lk/register with your name, email, study program (O/L or A/L ICT), and contact details. You can also WhatsApp +94 77 459 1161 with your name, grade, and district to complete enrollment.',
    'ICTF ICT வகுப்புகளுக்கு எப்படி பதிவு செய்வது?',
    'ictf.lk/register-ல் உங்கள் பெயர், மின்னஞ்சல், படிப்பு நிரல் (O/L அல்லது A/L ICT) மற்றும் தொடர்பு விவரங்களுடன் ஆன்லைனில் பதிவு செய்யுங்கள். WhatsApp +94 77 459 1161-லும் தொடர்பு கொள்ளலாம்.',
    'ICTF ICT පන්ති සඳහා ලියාපදිංචි වන්නේ කෙසේද?',
    'ictf.lk/register හරහා ඔබේ නම, විද්‍යුත් තැපෑල, අධ්‍යයන වැඩසටහන (O/L හෝ A/L ICT) සහ සම්බන්ධතා විස්තර සමඟ ලියාපදිංචි වන්න.',
    'register',
    'ICTF register Sri Lanka',
    16
  ),
  (
    'Does ICTF have a student portal for ICT learning?',
    'Yes. The ICTF Student Portal provides video lessons, live class schedules, study resources, exam results, leaderboard, achievements, and an AI study assistant — accessible from any device in Sri Lanka.',
    'ICT ICT கற்றலுக்கு ICTF-க்கு மாணவர் தளம் உள்ளதா?',
    'ஆம். ICTF மாணவர் தளம் வீடியோ பாடங்கள், நேரடி வகுப்பு அட்டவணை, படிப்பு வளங்கள், தேர்வு முடிவுகள், லீடர்போர்டு, சாதனைகள் மற்றும் AI படிப்பு உதவியாளரை வழங்குகிறது.',
    'ICTF හි ICT අධ්‍යයනය සඳහා ශිෂ්‍ය ද්වාරයක් තිබේද?',
    'ඔව්. ICTF ශිෂ්‍ය ද්වාරය වීඩියෝ පාඩම්, සජීවී පන්ති කාලසටහන්, අධ්‍යයන සම්පත්, විභාග ප්‍රතිඵල, නායක පුවරුව සහ AI අධ්‍යයන සහායක ලබා දෙයි.',
    'portal',
    'ICT student portal Sri Lanka',
    17
  )
ON CONFLICT DO NOTHING;
