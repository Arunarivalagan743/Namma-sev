import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import ActivityCalendar from '../../components/ActivityCalendar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiCalendar, FiClock, FiArrowRight } from 'react-icons/fi';

const EventsPage = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [currentPage, setCurrentPage] = useState(0);

  const eventTypes = ['all', 'health_camp', 'awareness', 'cultural', 'sports', 'training', 'other'];

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = '/engagement/events?upcoming=true';
      if (filter !== 'upcoming' && filter !== 'all') {
        url = `/engagement/events?event_type=${filter}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const endDate = new Date(date.getTime() + 6 * 60 * 60 * 1000); // Add 6 hours for end time
    return `${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()} - ${endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`;
  };

  const getDefaultImage = (type, index) => {
    // Event type-specific images
    const eventTypeImages = {
      health_camp: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop', // Medical camp
        'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop', // Health checkup
        'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=300&fit=crop'  // Vaccination
      ],
      awareness: [
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop', // Community meeting
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop', // Awareness program
        'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop'  // Public gathering
      ],
      cultural: [
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop', // Festival celebration
        'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=400&h=300&fit=crop', // Cultural dance
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop'  // Traditional event
      ],
      sports: [
        'https://images.unsplash.com/photo-1461896836934- voices-8c204?w=400&h=300&fit=crop', // Sports event
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', // Outdoor sports
        'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&h=300&fit=crop'  // Village sports
      ],
      training: [
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop', // Training session
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop', // Workshop
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop'  // Skill development
      ],
      other: [
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop', // Community event
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop', // Public event
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop'  // Gathering
      ]
    };
    const images = eventTypeImages[type] || eventTypeImages.other;
    return images[index % images.length];
  };

  return (
    <div className="min-h-screen ">
      <CitizenNav />
      
      {/* Header Section */}
      <div className="py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <span className="inline-flex items-center text-[#c41e3a] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1.5 sm:mb-2">
            <FiCalendar className="mr-1.5 sm:mr-2" />
            {t('events').toUpperCase()}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1e3a5f] mb-2 sm:mb-3">
            {t('upcomingEvents')}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base px-4">
            {t('joinCommunityEvents')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12">
        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-10 px-2">
          <button
            onClick={() => { setFilter('upcoming'); setCurrentPage(0); }}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
              filter === 'upcoming' 
                ? 'bg-[#c41e3a] text-white' 
                : ' text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('upcoming')}
          </button>
          {eventTypes.filter(t => t !== 'all').map(type => (
            <button
              key={type}
              onClick={() => { setFilter(type); setCurrentPage(0); }}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all capitalize ${
                filter === type 
                  ? 'bg-[#c41e3a] text-white' 
                  : ' text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8">
          {/* Events Grid */}
          <div className="lg:w-2/3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 sm:p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 sm:mb-4"></div>
                    <div className="h-36 sm:h-48 bg-gray-200 rounded-lg mb-3 sm:mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3 sm:mb-4"></div>
                    <div className="h-9 sm:h-10 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            {events.slice(currentPage * 4, (currentPage + 1) * 4).map((event, index) => (
              <div 
                key={event.id} 
                className="bg-white rounded-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="p-4 sm:p-5">
                  {/* Location */}
                  <div className="flex items-center text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">
                    <FiMapPin className="mr-1.5 sm:mr-2 text-[#c41e3a] flex-shrink-0" />
                    <span className="truncate">{event.venue || 'Village Community Center'}</span>
                  </div>

                  {/* Image */}
                  <div className="relative h-36 sm:h-48 rounded-lg overflow-hidden mb-3 sm:mb-4">
                    <img 
                      src={event.image_url || getDefaultImage(event.event_type, index)}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {event.is_free && (
                      <span className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-[#c41e3a] text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                    <span className="flex items-center">
                      <FiCalendar className="mr-1 sm:mr-1.5 text-[#c41e3a]" size={12} />
                      <span className="truncate">{formatDate(event.event_date)}</span>
                    </span>
                    <span className="flex items-center">
                      <FiClock className="mr-1 sm:mr-1.5 text-[#c41e3a]" size={12} />
                      <span className="whitespace-nowrap">{formatTime(event.event_date)}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <TranslatedText text={event.title} className="text-lg sm:text-xl font-bold text-[#1e3a5f] mb-1.5 sm:mb-2 group-hover:text-[#c41e3a] transition-colors line-clamp-2" as="h3" />

                  {/* Description */}
                  <TranslatedText text={event.description || 'There are many variations of passages the majority have some injected humour.'} className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-5 line-clamp-2" as="p" />

                  {/* Join Button */}
                  <Link
                    to={`/events/${event.id}`}
                    className="inline-flex items-center bg-[#c41e3a] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#a01830] transition-colors group/btn"
                  >
                    JOIN EVENT
                    <FiArrowRight className="ml-1.5 sm:ml-2 group-hover/btn:translate-x-1 transition-transform" size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
              <div className="text-center py-12 sm:py-16 bg-white">
                <FiCalendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1.5 sm:mb-2">No Events Found</h3>
                <p className="text-gray-500 text-sm sm:text-base">Check back later for upcoming events</p>
              </div>
            )}

            {/* Pagination Dots */}
            {events.length > 4 && (
              <div className="flex justify-center mt-6 sm:mt-10 space-x-1.5 sm:space-x-2">
                {[...Array(Math.ceil(events.length / 4))].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      currentPage === idx ? 'bg-[#c41e3a]' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar with Activity Calendar - hidden on mobile */}
          <div className="lg:w-1/3 hidden lg:block">
            <div className="sticky top-24 border border-gray-100">
              <ActivityCalendar variant="full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
