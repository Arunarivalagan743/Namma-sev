import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import ActivityCalendar from '../../components/ActivityCalendar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiUsers, FiChevronLeft, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';

const MeetingsPage = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rsvpLoading, setRsvpLoading] = useState({});
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      let url = '/engagement/meetings';
      if (filter === 'upcoming') {
        url += '?upcoming=true';
      } else if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setMeetings(response.data.meetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (meetingId, willAttend) => {
    if (!currentUser) {
      toast.error('Please login to RSVP');
      return;
    }
    
    const meeting = meetings.find(m => m.id === meetingId);
    const previousRsvp = meeting?.userRsvp;
    
    if (previousRsvp === willAttend) return;
    
    setRsvpLoading(prev => ({ ...prev, [meetingId]: true }));
    
    // Optimistic update
    setMeetings(prev => prev.map(m => {
      if (m.id === meetingId) {
        let newYes = m.rsvp_yes || 0;
        let newNo = m.rsvp_no || 0;
        
        if (previousRsvp === 'yes') newYes--;
        else if (previousRsvp === 'no') newNo--;
        
        if (willAttend === 'yes') newYes++;
        else if (willAttend === 'no') newNo++;
        
        return { ...m, rsvp_yes: newYes, rsvp_no: newNo, userRsvp: willAttend };
      }
      return m;
    }));
    
    try {
      const response = await api.post(`/engagement/meetings/${meetingId}/rsvp`, {
        will_attend: willAttend
      });
      if (response.data.success) {
        toast.success(willAttend === 'yes' ? '✓ You\'re attending!' : 'Response recorded');
      }
    } catch (error) {
      // Revert on error
      setMeetings(prev => prev.map(m => {
        if (m.id === meetingId) {
          let newYes = m.rsvp_yes || 0;
          let newNo = m.rsvp_no || 0;
          
          if (willAttend === 'yes') newYes--;
          else if (willAttend === 'no') newNo--;
          
          if (previousRsvp === 'yes') newYes++;
          else if (previousRsvp === 'no') newNo++;
          
          return { ...m, rsvp_yes: newYes, rsvp_no: newNo, userRsvp: previousRsvp };
        }
        return m;
      }));
      toast.error('Failed to record RSVP');
    } finally {
      setRsvpLoading(prev => ({ ...prev, [meetingId]: false }));
    }
  };

  const getDateParts = (dateStr) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' })
    };
  };

  const formatTime = (dateStr) => {
    const startTime = new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    // Add 2 hours for end time
    const endDate = new Date(new Date(dateStr).getTime() + 2 * 60 * 60 * 1000);
    const endTime = endDate.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${startTime} - ${endTime}`;
  };

  const getDefaultImage = (index) => {
    // Gram Sabha / Village meeting specific images
    const images = [
      'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=600&h=400&fit=crop', // Village council meeting
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&h=400&fit=crop', // Community gathering
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=400&fit=crop', // Town hall meeting
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&h=400&fit=crop', // Public assembly
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop', // Community discussion
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop'  // Group meeting
    ];
    return images[index % images.length];
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <CitizenNav />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <span className="inline-flex items-center text-[#c41e3a] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1.5 sm:mb-2">
            <FiUsers className="mr-1.5 sm:mr-2" />
            {t('gramSabha')}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1e3a5f] mb-2 sm:mb-3">
            {t('gramSabhaMeetings')}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base px-4">
            {t('stayInformedMeetings')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-5 sm:mb-8 px-2">
          {['all', 'upcoming', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                filter === f 
                  ? 'bg-[#1e3a5f] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Meetings Horizontal Scroll */}
        {loading ? (
          <div className="relative">
            <div className="flex gap-3 sm:gap-5 overflow-hidden px-2 py-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-56 sm:w-72 h-44 sm:h-52 bg-gray-300 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : meetings.length > 0 ? (
          <div className="relative">
            {/* Navigation Arrows - hidden on mobile */}
            <button 
              onClick={() => scroll('left')}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 sm:w-10 h-8 sm:h-10 bg-white items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
            >
              <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 sm:w-10 h-8 sm:h-10 bg-white items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
            >
              <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>

            {/* Cards Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide px-1 sm:px-8 py-4 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {meetings.map((meeting, index) => {
                const dateParts = getDateParts(meeting.meeting_date);
                return (
                  <div 
                    key={meeting.id} 
                    className="flex-shrink-0 w-64 sm:w-72 h-44 sm:h-52 relative overflow-hidden group cursor-pointer snap-start"
                  >
                    {/* Background Image */}
                    <img 
                      src={meeting.image_url || getDefaultImage(index)}
                      alt={meeting.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                    
                    {/* Date Badge */}
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-[#c41e3a] text-white text-center px-2 sm:px-3 py-1.5 sm:py-2">
                      <div className="text-xl sm:text-2xl font-bold leading-none">{dateParts.day}</div>
                      <div className="text-[10px] sm:text-xs uppercase mt-0.5 sm:mt-1">{dateParts.month}</div>
                    </div>

                    {/* Attendee Badge */}
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center">
                      <FiUsers className="text-[#1e3a5f] mr-0.5 sm:mr-1 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-800">{meeting.rsvp_yes || 0}</span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                      <TranslatedText text={meeting.title} className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 line-clamp-2 leading-tight" as="h3" />
                      <p className="text-[10px] sm:text-xs text-gray-200 flex items-center flex-wrap">
                        <span>{formatTime(meeting.meeting_date)}</span>
                        <span className="mx-1 sm:mx-2">at</span>
                        <span className="uppercase text-[#c41e3a] font-medium text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">{meeting.venue || 'PANCHAYAT OFFICE'}</span>
                      </p>
                    </div>

                    {/* RSVP Quick Actions - show on tap for mobile */}
                    {meeting.status === 'upcoming' && currentUser && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 sm:p-3 flex gap-1.5 sm:gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        {meeting.userRsvp === 'yes' ? (
                          <>
                            <div className="flex-1 bg-[#c41e3a] text-white text-center py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium">
                              <span className="flex items-center justify-center"><FiCheck className="mr-1" /> Attending</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRsvp(meeting.id, 'no'); }}
                              disabled={rsvpLoading[meeting.id]}
                              className="px-2 sm:px-3 bg-gray-600 text-white py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                              title="Change to Not Attending"
                            >
                              <FiX size={14} />
                            </button>
                          </>
                        ) : meeting.userRsvp === 'no' ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRsvp(meeting.id, 'yes'); }}
                              disabled={rsvpLoading[meeting.id]}
                              className="px-2 sm:px-3 bg-[#c41e3a] text-white py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-[#a01830] transition-colors disabled:opacity-50"
                              title="Change to Attending"
                            >
                              <FiCheck size={14} />
                            </button>
                            <div className="flex-1 bg-gray-500 text-white text-center py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium">
                              <span className="flex items-center justify-center"><FiX className="mr-1" /> Not Attending</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRsvp(meeting.id, 'yes'); }}
                              disabled={rsvpLoading[meeting.id]}
                              className="flex-1 bg-[#c41e3a] text-white py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-[#a01830] transition-colors disabled:opacity-50"
                            >
                              I'll Attend
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRsvp(meeting.id, 'no'); }}
                              disabled={rsvpLoading[meeting.id]}
                              className="flex-1 bg-gray-500 text-white py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              Can't Make It
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 sm:p-12 text-center">
            <FiCalendar size={48} className="mx-auto mb-3 sm:mb-4 text-gray-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1.5 sm:mb-2">No meetings found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Check back later for upcoming Gram Sabha meetings</p>
          </div>
        )}

        {/* Activity Calendar Section */}
        <div className="mt-6 sm:mt-8 md:mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] mb-3 sm:mb-4 text-center">All Activities Calendar</h2>
          <div className="max-w-md mx-auto border border-gray-100">
            <ActivityCalendar variant="full" />
          </div>
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MeetingsPage;
