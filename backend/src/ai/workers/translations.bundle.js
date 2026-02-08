/**
 * Offline Translation Bundles
 *
 * Phase 3 Feature 2: Static translation bundles for UI strings
 *
 * Contains pre-translated text for:
 * - UI strings
 * - FAQ entries
 * - Schemes descriptions
 * - Common notices
 * - Status messages
 *
 * Generated at build-time, never translated at runtime.
 */

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi', 'te', 'kn', 'ml'];

/**
 * UI String Translations
 * Pre-translated at build time
 */
const UI_STRINGS = {
  // Navigation
  'nav.home': {
    en: 'Home',
    ta: 'முகப்பு',
    hi: 'होम',
    te: 'హోమ్',
    kn: 'ಮುಖಪುಟ',
    ml: 'ഹോം'
  },
  'nav.complaints': {
    en: 'Complaints',
    ta: 'புகார்கள்',
    hi: 'शिकायतें',
    te: 'ఫిర్యాదులు',
    kn: 'ದೂರುಗಳು',
    ml: 'പരാതികൾ'
  },
  'nav.schemes': {
    en: 'Schemes',
    ta: 'திட்டங்கள்',
    hi: 'योजनाएं',
    te: 'పథకాలు',
    kn: 'ಯೋಜನೆಗಳು',
    ml: 'പദ്ധതികൾ'
  },
  'nav.announcements': {
    en: 'Announcements',
    ta: 'அறிவிப்புகள்',
    hi: 'घोषणाएं',
    te: 'ప్రకటనలు',
    kn: 'ಪ್ರಕಟಣೆಗಳು',
    ml: 'അറിയിപ്പുകൾ'
  },
  'nav.profile': {
    en: 'Profile',
    ta: 'சுயவிவரம்',
    hi: 'प्रोफ़ाइल',
    te: 'ప్రొఫైల్',
    kn: 'ಪ್ರೊಫೈಲ್',
    ml: 'പ്രൊഫൈൽ'
  },

  // Actions
  'action.submit': {
    en: 'Submit',
    ta: 'சமர்ப்பி',
    hi: 'जमा करें',
    te: 'సమర్పించు',
    kn: 'ಸಲ್ಲಿಸು',
    ml: 'സമർപ്പിക്കുക'
  },
  'action.cancel': {
    en: 'Cancel',
    ta: 'ரத்து செய்',
    hi: 'रद्द करें',
    te: 'రద్దు చేయి',
    kn: 'ರದ್ದುಮಾಡು',
    ml: 'റദ്ദാക്കുക'
  },
  'action.save': {
    en: 'Save',
    ta: 'சேமி',
    hi: 'सहेजें',
    te: 'సేవ్ చేయి',
    kn: 'ಉಳಿಸು',
    ml: 'സേവ് ചെയ്യുക'
  },
  'action.delete': {
    en: 'Delete',
    ta: 'நீக்கு',
    hi: 'हटाएं',
    te: 'తొలగించు',
    kn: 'ಅಳಿಸು',
    ml: 'ഡിലീറ്റ് ചെയ്യുക'
  },
  'action.edit': {
    en: 'Edit',
    ta: 'திருத்து',
    hi: 'संपादित करें',
    te: 'సవరించు',
    kn: 'ಸಂಪಾದಿಸು',
    ml: 'എഡിറ്റ് ചെയ്യുക'
  },
  'action.view': {
    en: 'View',
    ta: 'பார்',
    hi: 'देखें',
    te: 'చూడండి',
    kn: 'ನೋಡು',
    ml: 'കാണുക'
  },
  'action.track': {
    en: 'Track Status',
    ta: 'நிலையைக் கண்காணி',
    hi: 'स्थिति ट्रैक करें',
    te: 'స్థితిని ట్రాక్ చేయండి',
    kn: 'ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    ml: 'സ്റ്റാറ്റസ് ട്രാക്ക് ചെയ്യുക'
  },

  // Complaint Status
  'status.pending': {
    en: 'Pending',
    ta: 'நிலுவையில்',
    hi: 'लंबित',
    te: 'పెండింగ్',
    kn: 'ಬಾಕಿ',
    ml: 'തീർപ്പാക്കാത്തത്'
  },
  'status.in_progress': {
    en: 'In Progress',
    ta: 'செயல்பாட்டில்',
    hi: 'प्रगति में',
    te: 'ప్రోగ్రెస్‌లో ఉంది',
    kn: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    ml: 'പുരോഗമിക്കുന്നു'
  },
  'status.resolved': {
    en: 'Resolved',
    ta: 'தீர்க்கப்பட்டது',
    hi: 'हल किया गया',
    te: 'పరిష్కరించబడింది',
    kn: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    ml: 'പരിഹരിച്ചു'
  },
  'status.rejected': {
    en: 'Rejected',
    ta: 'நிராகரிக்கப்பட்டது',
    hi: 'अस्वीकृत',
    te: 'తిరస్కరించబడింది',
    kn: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
    ml: 'നിരസിച്ചു'
  },

  // Categories
  'category.road': {
    en: 'Road & Infrastructure',
    ta: 'சாலை & உள்கட்டமைப்பு',
    hi: 'सड़क और बुनियादी ढांचा',
    te: 'రోడ్ & మౌలిక సదుపాయాలు',
    kn: 'ರಸ್ತೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ',
    ml: 'റോഡ് & അടിസ്ഥാന സൌകര്യം'
  },
  'category.water': {
    en: 'Water Supply',
    ta: 'நீர் வழங்கல்',
    hi: 'पानी की आपूर्ति',
    te: 'నీటి సరఫరా',
    kn: 'ನೀರು ಸರಬರಾಜು',
    ml: 'ജലവിതരണം'
  },
  'category.electricity': {
    en: 'Electricity',
    ta: 'மின்சாரம்',
    hi: 'बिजली',
    te: 'విద్యుత్',
    kn: 'ವಿದ್ಯುತ್',
    ml: 'വൈദ്യുതി'
  },
  'category.sanitation': {
    en: 'Sanitation',
    ta: 'சுகாதாரம்',
    hi: 'स्वच्छता',
    te: 'పారిశుద్ధ్యం',
    kn: 'ನೈರ್ಮಲ್ಯ',
    ml: 'ശുചിത്വം'
  },
  'category.streetlights': {
    en: 'Street Lights',
    ta: 'தெரு விளக்குகள்',
    hi: 'स्ट्रीट लाइट',
    te: 'వీధి దీపాలు',
    kn: 'ಬೀದಿ ದೀಪಗಳು',
    ml: 'തെരുവ് വിളക്കുകൾ'
  },
  'category.drainage': {
    en: 'Drainage',
    ta: 'வடிகால்',
    hi: 'जल निकासी',
    te: 'డ్రైనేజీ',
    kn: 'ಒಳಚರಂಡಿ',
    ml: 'ഡ്രെയിനേജ്'
  },
  'category.health': {
    en: 'Public Health',
    ta: 'பொது சுகாதாரம்',
    hi: 'सार्वजनिक स्वास्थ्य',
    te: 'ప్రజారోగ్యం',
    kn: 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ',
    ml: 'പൊതുജനാരോഗ്യം'
  },
  'category.encroachment': {
    en: 'Encroachment',
    ta: 'ஆக்கிரமிப்பு',
    hi: 'अतिक्रमण',
    te: 'ఆక్రమణ',
    kn: 'ಅತಿಕ್ರಮಣ',
    ml: 'കയ്യേറ്റം'
  },
  'category.noise': {
    en: 'Noise Pollution',
    ta: 'ஒலி மாசு',
    hi: 'ध्वनि प्रदूषण',
    te: 'శబ్ద కాలుష్యం',
    kn: 'ಶಬ್ದ ಮಾಲಿನ್ಯ',
    ml: 'ശബ്ദ മലിനീകരണം'
  },
  'category.other': {
    en: 'Other',
    ta: 'மற்றவை',
    hi: 'अन्य',
    te: 'ఇతర',
    kn: 'ಇತರೆ',
    ml: 'മറ്റുള്ളവ'
  },

  // Priority
  'priority.low': {
    en: 'Low Priority',
    ta: 'குறைந்த முன்னுரிமை',
    hi: 'कम प्राथमिकता',
    te: 'తక్కువ ప్రాధాన్యత',
    kn: 'ಕಡಿಮೆ ಆದ್ಯತೆ',
    ml: 'കുറഞ്ഞ മുൻഗണന'
  },
  'priority.normal': {
    en: 'Normal Priority',
    ta: 'சாதாரண முன்னுரிமை',
    hi: 'सामान्य प्राथमिकता',
    te: 'సాధారణ ప్రాధాన్యత',
    kn: 'ಸಾಮಾನ್ಯ ಆದ್ಯತೆ',
    ml: 'സാധാരണ മുൻഗണന'
  },
  'priority.high': {
    en: 'High Priority',
    ta: 'உயர் முன்னுரிமை',
    hi: 'उच्च प्राथमिकता',
    te: 'అధిక ప్రాధాన్యత',
    kn: 'ಹೆಚ್ಚಿನ ಆದ್ಯತೆ',
    ml: 'ഉയർന്ന മുൻഗണന'
  },
  'priority.urgent': {
    en: 'Urgent',
    ta: 'அவசரம்',
    hi: 'अत्यावश्यक',
    te: 'అత్యవసరం',
    kn: 'ತುರ್ತು',
    ml: 'അടിയന്തിരം'
  },

  // Messages
  'msg.success': {
    en: 'Success!',
    ta: 'வெற்றி!',
    hi: 'सफलता!',
    te: 'విజయం!',
    kn: 'ಯಶಸ್ಸು!',
    ml: 'വിജയം!'
  },
  'msg.error': {
    en: 'An error occurred',
    ta: 'பிழை ஏற்பட்டது',
    hi: 'एक त्रुटि हुई',
    te: 'లోపం సంభవించింది',
    kn: 'ದೋಷ ಸಂಭವಿಸಿದೆ',
    ml: 'ഒരു പിശക് സംഭവിച്ചു'
  },
  'msg.loading': {
    en: 'Loading...',
    ta: 'ஏற்றுகிறது...',
    hi: 'लोड हो रहा है...',
    te: 'లోడ్ అవుతోంది...',
    kn: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    ml: 'ലോഡ് ചെയ്യുന്നു...'
  },
  'msg.no_data': {
    en: 'No data available',
    ta: 'தரவு இல்லை',
    hi: 'कोई डेटा उपलब्ध नहीं',
    te: 'డేటా అందుబాటులో లేదు',
    kn: 'ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ',
    ml: 'ഡാറ്റ ലഭ്യമല്ല'
  },
  'msg.complaint_submitted': {
    en: 'Your complaint has been submitted successfully',
    ta: 'உங்கள் புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது',
    hi: 'आपकी शिकायत सफलतापूर्वक दर्ज की गई है',
    te: 'మీ ఫిర్యాదు విజయవంతంగా సమర్పించబడింది',
    kn: 'ನಿಮ್ಮ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
    ml: 'നിങ്ങളുടെ പരാതി വിജയകരമായി സമർപ്പിച്ചു'
  },

  // Forms
  'form.title': {
    en: 'Title',
    ta: 'தலைப்பு',
    hi: 'शीर्षक',
    te: 'శీర్షిక',
    kn: 'ಶೀರ್ಷಿಕೆ',
    ml: 'ശീർഷകം'
  },
  'form.description': {
    en: 'Description',
    ta: 'விவரணை',
    hi: 'विवरण',
    te: 'వివరణ',
    kn: 'ವಿವರಣೆ',
    ml: 'വിവരണം'
  },
  'form.category': {
    en: 'Category',
    ta: 'வகை',
    hi: 'श्रेणी',
    te: 'వర్గం',
    kn: 'ವರ್ಗ',
    ml: 'വിഭാഗം'
  },
  'form.location': {
    en: 'Location',
    ta: 'இடம்',
    hi: 'स्थान',
    te: 'స్థానం',
    kn: 'ಸ್ಥಳ',
    ml: 'സ്ഥലം'
  },
  'form.phone': {
    en: 'Phone Number',
    ta: 'தொலைபேசி எண்',
    hi: 'फोन नंबर',
    te: 'ఫోన్ నంబర్',
    kn: 'ಫೋನ್ ನಂಬರ್',
    ml: 'ഫോൺ നമ്പർ'
  },
  'form.ward': {
    en: 'Ward Number',
    ta: 'வார்டு எண்',
    hi: 'वार्ड नंबर',
    te: 'వార్డు నంబర్',
    kn: 'ವಾರ್ಡ್ ಸಂಖ್ಯೆ',
    ml: 'വാർഡ് നമ്പർ'
  },
  'form.upload_image': {
    en: 'Upload Image',
    ta: 'படத்தைப் பதிவேற்றவும்',
    hi: 'छवि अपलोड करें',
    te: 'చిత్రాన్ని అప్‌లోడ్ చేయండి',
    kn: 'ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    ml: 'ചിത്രം അപ്‌ലോഡ് ചെയ്യുക'
  }
};

/**
 * Common Notice Templates
 */
const NOTICE_TEMPLATES = {
  'notice.maintenance': {
    en: 'Scheduled maintenance in progress. Service may be temporarily unavailable.',
    ta: 'திட்டமிட்ட பராமரிப்பு நடைபெறுகிறது. சேவை தற்காலிகமாக கிடைக்காமல் போகலாம்.',
    hi: 'निर्धारित रखरखाव जारी है। सेवा अस्थायी रूप से अनुपलब्ध हो सकती है।',
    te: 'షెడ్యూల్ చేయబడిన నిర్వహణ జరుగుతోంది. సేవ తాత్కాలికంగా అందుబాటులో ఉండకపోవచ్చు.',
    kn: 'ನಿಗದಿತ ನಿರ್ವಹಣೆ ನಡೆಯುತ್ತಿದೆ. ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲದಿರಬಹುದು.',
    ml: 'ഷെഡ്യൂൾ ചെയ്ത മെയിന്റനൻസ് നടക്കുന്നു. സേവനം താൽക്കാലികമായി ലഭ്യമല്ലായിരിക്കാം.'
  },
  'notice.office_hours': {
    en: 'Panchayat office hours: Monday to Friday, 10 AM to 5 PM',
    ta: 'பஞ்சாயத்து அலுவலக நேரம்: திங்கள் முதல் வெள்ளி, காலை 10 மணி முதல் மாலை 5 மணி வரை',
    hi: 'पंचायत कार्यालय समय: सोमवार से शुक्रवार, सुबह 10 बजे से शाम 5 बजे तक',
    te: 'పంచాయతీ కార్యాలయ సమయాలు: సోమవారం నుండి శుక్రవారం, ఉదయం 10 నుండి సాయంత్రం 5 వరకు',
    kn: 'ಪಂಚಾಯತ್ ಕಚೇರಿ ಸಮಯ: ಸೋಮವಾರದಿಂದ ಶುಕ್ರವಾರ, ಬೆಳಿಗ್ಗೆ 10 ರಿಂದ ಸಂಜೆ 5 ರವರೆಗೆ',
    ml: 'പഞ്ചായത്ത് ഓഫീസ് സമയം: തിങ്കൾ മുതൽ വെള്ളി വരെ, രാവിലെ 10 മുതൽ വൈകുന്നേരം 5 വരെ'
  },
  'notice.holiday': {
    en: 'Office closed for public holiday',
    ta: 'பொது விடுமுறைக்கு அலுவலகம் மூடப்பட்டது',
    hi: 'सार्वजनिक छुट्टी के लिए कार्यालय बंद',
    te: 'ప్రజా సెలవు కోసం కార్యాలయం మూసివేయబడింది',
    kn: 'ಸಾರ್ವಜನಿಕ ರಜೆಗಾಗಿ ಕಚೇರಿ ಮುಚ್ಚಲಾಗಿದೆ',
    ml: 'പൊതു അവധിക്ക് ഓഫീസ് അടച്ചിരിക്കുന്നു'
  }
};

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'nav.home')
 * @param {string} lang - Language code (default: 'en')
 * @returns {string} Translated text or key if not found
 */
const getTranslation = (key, lang = 'en') => {
  const normalizedLang = lang.toLowerCase().substring(0, 2);
  const validLang = SUPPORTED_LANGUAGES.includes(normalizedLang) ? normalizedLang : 'en';

  // Check UI strings
  if (UI_STRINGS[key]) {
    return UI_STRINGS[key][validLang] || UI_STRINGS[key]['en'] || key;
  }

  // Check notice templates
  if (NOTICE_TEMPLATES[key]) {
    return NOTICE_TEMPLATES[key][validLang] || NOTICE_TEMPLATES[key]['en'] || key;
  }

  return key;
};

/**
 * Get all translations for a language
 * @param {string} lang - Language code
 * @returns {Object} All translations for the language
 */
const getAllTranslations = (lang = 'en') => {
  const normalizedLang = lang.toLowerCase().substring(0, 2);
  const validLang = SUPPORTED_LANGUAGES.includes(normalizedLang) ? normalizedLang : 'en';

  const result = {};

  // Get UI strings
  for (const [key, translations] of Object.entries(UI_STRINGS)) {
    result[key] = translations[validLang] || translations['en'];
  }

  // Get notice templates
  for (const [key, translations] of Object.entries(NOTICE_TEMPLATES)) {
    result[key] = translations[validLang] || translations['en'];
  }

  return result;
};

/**
 * Get bundle for a specific language (for frontend)
 * @param {string} lang - Language code
 * @returns {Object} Translation bundle
 */
const getBundle = (lang = 'en') => {
  return {
    language: lang,
    translations: getAllTranslations(lang),
    version: '1.0.0',
    generatedAt: new Date().toISOString()
  };
};

/**
 * Get all available translation keys
 * @returns {string[]} Array of translation keys
 */
const getKeys = () => {
  return [
    ...Object.keys(UI_STRINGS),
    ...Object.keys(NOTICE_TEMPLATES)
  ];
};

/**
 * Bundle statistics
 */
const getStats = () => {
  return {
    supportedLanguages: SUPPORTED_LANGUAGES,
    totalKeys: getKeys().length,
    uiStrings: Object.keys(UI_STRINGS).length,
    noticeTemplates: Object.keys(NOTICE_TEMPLATES).length,
    version: '1.0.0'
  };
};

module.exports = {
  SUPPORTED_LANGUAGES,
  UI_STRINGS,
  NOTICE_TEMPLATES,
  getTranslation,
  getAllTranslations,
  getBundle,
  getKeys,
  getStats
};

