import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../context/TranslationContext';

/**
 * Component that automatically translates dynamic text content
 * Usage: <TranslatedText text="Hello World" />
 */
const TranslatedText = ({ text, className = '', as: Component = 'span' }) => {
  const { translateText, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const prevTextRef = useRef(text);

  useEffect(() => {
    let isMounted = true;

    const doTranslate = async () => {
      if (!text) {
        setTranslatedText(text);
        return;
      }

      // If switching back to English, just use original text
      if (currentLanguage === 'en') {
        setTranslatedText(text);
        return;
      }

      // Don't show loading state to prevent flicker - keep showing current text
      try {
        const result = await translateText(text);
        if (isMounted && result) {
          setTranslatedText(result);
        }
      } catch (error) {
        // Keep showing current text on error
        if (isMounted) {
          setTranslatedText(text);
        }
      }
    };

    doTranslate();

    return () => {
      isMounted = false;
    };
  }, [text, currentLanguage, translateText]);

  // Update if source text changes
  useEffect(() => {
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      if (currentLanguage === 'en') {
        setTranslatedText(text);
      }
    }
  }, [text, currentLanguage]);

  return (
    <Component 
      className={className}
      style={{ 
        minHeight: '1em',
        transition: 'none' // Disable transitions to prevent visual jitter
      }}
    >
      {translatedText || text}
    </Component>
  );
};

export default TranslatedText;
