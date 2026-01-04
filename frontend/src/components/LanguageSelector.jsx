import { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiCheck, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from '../context/TranslationContext';

const LanguageSelector = ({ variant = 'dropdown', className = '' }) => {
  const { currentLanguage, languages, changeLanguage, isTranslating } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // Compact variant for header
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600 transition-colors min-w-[50px]"
          aria-label="Select language"
        >
          <FiGlobe size={16} className="flex-shrink-0" />
          <span className="font-medium whitespace-nowrap">{currentLang.nativeName}</span>
          <FiChevronDown 
            size={14} 
            className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          />
          {isTranslating && (
            <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin ml-1 flex-shrink-0" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px] z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  lang.code === currentLanguage ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                }`}
              >
                <div>
                  <span className="block font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-gray-500">{lang.name}</span>
                </div>
                {lang.code === currentLanguage && (
                  <FiCheck size={16} className="text-orange-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
        aria-label="Select language"
      >
        <FiGlobe size={18} className="text-gray-500" />
        <span className="font-medium text-gray-700">{currentLang.nativeName}</span>
        <FiChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
        {isTranslating && (
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Select Language / மொழியைத் தேர்ந்தெடுக்கவும்
            </p>
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                lang.code === currentLanguage ? 'bg-orange-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`text-lg ${lang.code === currentLanguage ? 'text-orange-600' : 'text-gray-700'}`}>
                  {lang.nativeName}
                </span>
                <span className="text-sm text-gray-500">({lang.name})</span>
              </div>
              {lang.code === currentLanguage && (
                <FiCheck size={18} className="text-orange-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
