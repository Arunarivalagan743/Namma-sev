import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NewsDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsDetails();
    fetchRelatedNews();
  }, [id]);

  const fetchNewsDetails = async () => {
    try {
      const response = await api.get(`/engagement/news`);
      if (response.data.success) {
        const newsData = response.data.data || response.data.news || [];
        const foundNews = newsData.find(n => String(n.id || n._id) === String(id));
        setNews(foundNews);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedNews = async () => {
    try {
      const response = await api.get('/engagement/news');
      if (response.data.success) {
        const newsData = response.data.data || response.data.news || [];
        setRelatedNews(newsData.filter(n => String(n.id || n._id) !== String(id)).slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching related news:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'text-blue-600',
      development: 'text-green-600',
      announcement: 'text-purple-600',
      event: 'text-orange-600',
      government: 'text-red-600'
    };
    return colors[category] || 'text-gray-600';
  };

  // Category-specific default images for news
  const getCategoryImage = (category) => {
    const categoryImages = {
      general: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop',
      development: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
      announcement: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
      event: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop',
      government: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&h=500&fit=crop'
    };
    return categoryImages[category] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-80 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">News Article Not Found</h1>
          <Link to="/" className="text-[#c41e3a] hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <CitizenNav />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Breadcrumb */}
            <nav className="text-xs sm:text-sm mb-4 sm:mb-6">
              <Link to="/" className="text-gray-500 hover:text-[#c41e3a]">HOME</Link>
              <span className="text-gray-400 mx-1.5 sm:mx-2">›</span>
              <span className="text-gray-500">NEWS</span>
            </nav>

            {/* Title */}
            <TranslatedText text={news.title} className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 sm:mb-4 leading-tight" as="h1" />

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              <span>{formatDate(news.published_at || news.created_at)}</span>
              <span>by</span>
              <span className="font-medium text-gray-700">PANCHAYAT OFFICE</span>
              <span className="hidden sm:inline">in</span>
              <span className={`font-medium uppercase ${getCategoryColor(news.category)}`}>
                {news.category}
              </span>
            </div>

            {/* Featured Image */}
            <div className="overflow-hidden mb-6 sm:mb-8">
              <img 
                src={news.image_url || getCategoryImage(news.category)} 
                alt={news.title}
                className="w-full h-52 sm:h-64 md:h-80 lg:h-[450px] object-cover"
              />
            </div>

            {/* Article Content */}
            <div className="prose prose-sm sm:prose-lg max-w-none mb-6 sm:mb-8">
              {news.summary && (
                <TranslatedText text={news.summary} className="text-base sm:text-lg md:text-xl text-gray-700 font-medium leading-relaxed mb-4 sm:mb-6 border-l-4 border-[#c41e3a] pl-3 sm:pl-4" as="p" />
              )}
              
              <TranslatedText text={news.content || news.summary || 'No content available for this news article.'} className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base" as="div" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8 pt-4 sm:pt-6 border-t">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium uppercase hover:bg-gray-200 transition-colors cursor-pointer">
                {news.category}
              </span>
              {news.is_featured && (
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#c41e3a]/10 text-[#c41e3a] rounded text-xs sm:text-sm font-medium uppercase">
                  Featured
                </span>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 sm:pt-6 border-t">
              <Link 
                to="/" 
                className="inline-flex items-center text-[#c41e3a] hover:text-[#a01830] font-medium text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Weather Widget */}
            <div className="bg-white p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Weather</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#1e3a5f] font-medium text-sm sm:text-base">Local Time</span>
                  <span className="font-bold text-sm sm:text-base">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[#c41e3a] font-medium text-sm sm:text-base">Today</span>
                    <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(new Date())}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-yellow-500">☀️</span>
                    <span className="font-bold text-sm sm:text-base">28°C</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm sm:text-base">Tomorrow</span>
                    <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(new Date(Date.now() + 86400000))}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span>⛅</span>
                    <span className="font-bold text-sm sm:text-base">32°C</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-3 sm:mt-4">Weather data by OpenWeatherMap.org</p>
            </div>

            {/* Featured Post */}
            <div className="bg-white overflow-hidden mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 p-3 sm:p-4 border-b">Featured Post</h3>
              {relatedNews[0] && (
                <Link to={`/news/${relatedNews[0].id}`}>
                  <img 
                    src={relatedNews[0].image_url || getCategoryImage(relatedNews[0].category)} 
                    alt={relatedNews[0].title}
                    className="w-full h-36 sm:h-48 object-cover"
                  />
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 hover:text-[#c41e3a] transition-colors text-sm sm:text-base">
                      {relatedNews[0].title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {formatDate(relatedNews[0].published_at)} in <span className="text-[#c41e3a] uppercase">{relatedNews[0].category}</span>
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1.5 sm:mt-2 line-clamp-3">{relatedNews[0].summary}</p>
                    <span className="text-[#c41e3a] text-xs sm:text-sm font-medium mt-1.5 sm:mt-2 inline-block hover:underline">Read More</span>
                  </div>
                </Link>
              )}
            </div>

            {/* More Posts */}
            <div className="bg-white p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">More News</h3>
              <div className="space-y-3 sm:space-y-4">
                {relatedNews.slice(1, 4).map(item => (
                  <Link key={item.id} to={`/news/${item.id}`} className="flex gap-2 sm:gap-3 group">
                    <img 
                      src={item.image_url || getCategoryImage(item.category)} 
                      alt={item.title} 
                      className="w-16 h-12 sm:w-20 sm:h-16 object-cover flex-shrink-0" 
                    />
                    <div>
                      <h4 className="font-medium text-gray-800 group-hover:text-[#c41e3a] text-xs sm:text-sm line-clamp-2">{item.title}</h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{formatDate(item.published_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link 
                to="/" 
                className="mt-3 sm:mt-4 inline-block text-xs sm:text-sm text-[#c41e3a] border border-[#c41e3a] px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-[#c41e3a] hover:text-white transition-colors"
              >
                MORE POSTS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;
