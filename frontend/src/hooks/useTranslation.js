import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';

/**
 * Hook to translate dynamic text content
 * Usage: const translatedText = useTranslatedText(text);
 */
export const useTranslatedText = (text) => {
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

  return { translatedText, isLoading };
};

/**
 * Hook to batch translate an array of objects with text fields
 * Usage: const translatedItems = useTranslatedArray(items, ['title', 'description']);
 */
export const useTranslatedArray = (items, fieldsToTranslate = ['title', 'description']) => {
  const { translateBatch, currentLanguage } = useTranslation();
  const [translatedItems, setTranslatedItems] = useState(items);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const doTranslate = async () => {
      if (!items || items.length === 0 || currentLanguage === 'en') {
        setTranslatedItems(items);
        return;
      }

      setIsLoading(true);
      try {
        // Collect all texts to translate
        const textsToTranslate = [];
        const textMapping = []; // Track which item and field each text belongs to

        items.forEach((item, itemIndex) => {
          fieldsToTranslate.forEach(field => {
            if (item[field] && typeof item[field] === 'string') {
              textsToTranslate.push(item[field]);
              textMapping.push({ itemIndex, field });
            }
          });
        });

        if (textsToTranslate.length === 0) {
          setTranslatedItems(items);
          return;
        }

        // Batch translate all texts
        const translatedTexts = await translateBatch(textsToTranslate);

        // Map translations back to items
        const newItems = items.map(item => ({ ...item }));
        translatedTexts.forEach((translatedText, index) => {
          const { itemIndex, field } = textMapping[index];
          newItems[itemIndex][field] = translatedText;
        });

        if (isMounted) {
          setTranslatedItems(newItems);
        }
      } catch (error) {
        console.error('Batch translation error:', error);
        if (isMounted) {
          setTranslatedItems(items);
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
  }, [items, currentLanguage, translateBatch, fieldsToTranslate.join(',')]);

  return { translatedItems, isLoading };
};

export default useTranslatedText;
