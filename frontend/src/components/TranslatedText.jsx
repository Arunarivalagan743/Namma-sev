import { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';

/**
 * Component that automatically translates dynamic text content
 * Usage: <TranslatedText text="Hello World" />
 */
const TranslatedText = ({ text, className = '', as: Component = 'span' }) => {
  const { translateText, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const doTranslate = async () => {
      if (!text || currentLanguage === 'en') {
        setTranslatedText(text);
        return;
      }

      setIsLoading(true);
      try {
        const result = await translateText(text);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('Translation error:', error);
        if (isMounted) {
          setTranslatedText(text);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    doTranslate();

    return () => {
      isMounted = false;
    };
  }, [text, currentLanguage, translateText]);

  return (
    <Component className={`${className} ${isLoading ? 'opacity-70' : ''}`}>
      {translatedText}
    </Component>
  );
};

export default TranslatedText;
