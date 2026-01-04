import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import ActivityCalendar from '../../components/ActivityCalendar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EventDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
    fetchUpcomingEvents();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/engagement/events`);
      if (response.data.success) {
        const eventsData = response.data.data || [];
        const foundEvent = eventsData.find(e => (e.id === id || e._id === id || e.id === parseInt(id)));
        setEvent(foundEvent);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await api.get('/engagement/events');
      if (response.data.success) {
        const eventsData = response.data.data || [];
        setUpcomingEvents(eventsData.filter(e => (e.id !== id && e._id !== id)).slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeColor = (type) => {
    const colors = {
      cultural: 'text-purple-600',
      sports: 'text-green-600',
      educational: 'text-blue-600',
      health: 'text-red-600',
      religious: 'text-orange-600',
      government: 'text-gray-600'
    };
    return colors[type] || 'text-gray-600';
  };

  // Event type-specific default images
  const getEventTypeImage = (type) => {
    const eventImages = {
      cultural: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
      sports: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop',
      educational: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=500&fit=crop',
      health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=500&fit=crop',
      health_camp: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=500&fit=crop',
      religious: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
      government: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&h=500&fit=crop',
      awareness: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
      training: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop'
    };
    return eventImages[type] || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-80 bg-gray-200 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CitizenNav />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h1>
          <Link to="/events" className="text-[#c41e3a] hover:underline">← Back to Events</Link>
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
            {/* Title & Category */}
            <TranslatedText text={event.title} className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-1.5 sm:mb-2" as="h1" />
            <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-4 sm:mb-6 ${getEventTypeColor(event.event_type)}`}>
              in {event.event_type?.toUpperCase()}
            </p>

            {/* Event Image */}
            <div className="overflow-hidden mb-6 sm:mb-8">
              <img 
                src={event.image_url || getEventTypeImage(event.event_type)} 
                alt={event.title}
                className="w-full h-52 sm:h-64 md:h-80 lg:h-96 object-cover"
              />
            </div>

            {/* Next Date Section */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xs sm:text-sm font-bold text-[#c41e3a] uppercase tracking-wider mb-3 sm:mb-4">NEXT DATE</h2>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 md:gap-8 text-gray-700">
                <div className="flex items-start gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 sm:mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Date</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{formatDate(event.event_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 sm:mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Time</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{formatTime(event.event_date)} - {formatTime(event.end_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#c41e3a] mt-0.5 sm:mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{event.venue}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">Ganapathipalayam, Tirupur</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm sm:prose-lg max-w-none mb-6 sm:mb-8">
              <TranslatedText text={event.description || 'No description available for this event.'} className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base" as="p" />
            </div>

            {/* Organizer Info */}
            {event.organizer && (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h3 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">Organized By</h3>
                <p className="text-gray-700 text-sm sm:text-base">{event.organizer}</p>
                {event.contact_info && (
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">Contact: {event.contact_info}</p>
                )}
              </div>
            )}

            {/* Event Tags */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium">
                {event.event_type}
              </span>
              {event.is_free && (
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-full text-xs sm:text-sm font-medium">
                  Free Entry
                </span>
              )}
              {event.registration_required && (
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium">
                  Registration Required
                </span>
              )}
            </div>

            {/* Back Link */}
            <Link 
              to="/events" 
              className="inline-flex items-center text-[#c41e3a] hover:text-[#a01830] font-medium text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to All Events
            </Link>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Activity Calendar - Dynamic with all backend data */}
            <div className="mb-4 sm:mb-6 border border-gray-100">
              <ActivityCalendar variant="full" />
            </div>

            {/* Featured Event */}
            {upcomingEvents[0] && (
              <div className="bg-white overflow-hidden mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 p-3 sm:p-4 border-b">Featured Event</h3>
                <Link to={`/events/${upcomingEvents[0].id}`}>
                  <img 
                    src={upcomingEvents[0].image_url || getEventTypeImage(upcomingEvents[0].event_type)} 
                    alt={upcomingEvents[0].title}
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{upcomingEvents[0].title}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 uppercase">{formatDate(upcomingEvents[0].event_date)}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{formatTime(upcomingEvents[0].event_date)}</p>
                    <p className="text-xs sm:text-sm text-[#c41e3a] mt-1">at {upcomingEvents[0].venue?.toUpperCase()}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="bg-white p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Upcoming Events</h3>
              <div className="space-y-3 sm:space-y-4">
                {upcomingEvents.slice(1, 4).map(evt => (
                  <Link key={evt.id} to={`/events/${evt.id}`} className="flex gap-2 sm:gap-3 group">
                    <img 
                      src={evt.image_url || getEventTypeImage(evt.event_type)} 
                      alt={evt.title} 
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover flex-shrink-0" 
                    />
                    <div>
                      <h4 className="font-medium text-[#c41e3a] group-hover:underline text-xs sm:text-sm">{evt.title}</h4>
                      <p className="text-[10px] sm:text-xs text-gray-600">{formatDate(evt.event_date)}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{formatTime(evt.event_date)} at {evt.venue?.toUpperCase()}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link 
                to="/events" 
                className="mt-3 sm:mt-4 inline-block text-xs sm:text-sm text-[#c41e3a] border border-[#c41e3a] px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-[#c41e3a] hover:text-white transition-colors"
              >
                MORE EVENTS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
