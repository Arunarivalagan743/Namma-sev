import { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FAQsPage = () => {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const categories = ['all', 'general', 'services', 'documents', 'complaints', 'taxes'];

  // Auto-refresh every 2 minutes for FAQ updates
  useEffect(() => {
    fetchFaqs();
    const interval = setInterval(() => {
      fetchFaqs(true); // silent refresh
    }, 120000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchFaqs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/engagement/faqs';
      if (filter !== 'all') {
        url += `?category=${filter}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setFaqs(response.data.faqs);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      if (!silent) toast.error('Failed to load FAQs');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      services: 'bg-gray-200 text-gray-700',
      documents: 'bg-gray-100 text-gray-800',
      complaints: 'bg-gray-200 text-gray-700',
      taxes: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Hero Banner */}
      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&h=400&fit=crop" 
          alt="FAQ - Help & Support"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 to-[#1e3a5f]/70"></div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-1.5 sm:mb-2">{t('frequentlyAskedQuestions')}</h1>
            <p className="text-white/80 text-sm sm:text-base">{t('findAnswers')}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-xl mx-auto sm:mx-0">
            <input
              type="text"
              placeholder={t('searchQuestions')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
            />
            <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors capitalize ${
                filter === cat 
                  ? 'bg-[#1e3a5f] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 sm:p-6 animate-pulse">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredFaqs.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={faq.id} className="bg-white rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${getCategoryColor(faq.category)}`}>
                      {faq.category}
                    </span>
                    <TranslatedText text={faq.question} className="font-medium text-sm sm:text-base text-gray-800 line-clamp-2 sm:line-clamp-1" />
                  </div>
                  <svg 
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform flex-shrink-0 ml-2 ${openIndex === index ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                    <TranslatedText text={faq.answer} className="pt-3 sm:pt-4 border-t text-sm sm:text-base text-gray-600 whitespace-pre-line" as="div" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg">
            <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-1.5 sm:mb-2">No FAQs Found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
            </p>
          </div>
        )}

        {/* Still Have Questions */}
        <div className="mt-8 sm:mt-12 bg-gradient-to-r from-[#1e3a5f] to-[#c41e3a] rounded-lg p-5 sm:p-6 md:p-8 text-white text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Still Have Questions?</h3>
          <p className="mb-4 sm:mb-6 text-blue-100 text-sm sm:text-base">
            Can't find what you're looking for? Contact our Panchayat office for assistance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+91-XXX-XXXXXXX</span>
            </div>
            <div className="flex items-center text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm md:text-base break-all">panchayat@ganapathipalayam.gov.in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQsPage;
