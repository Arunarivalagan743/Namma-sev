import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../../components/TranslatedText';
import CitizenNav from '../../components/CitizenNav';
import api from '../../services/api';
import { FiCalendar, FiMapPin, FiClock, FiArrowRight } from 'react-icons/fi';

const CalendarPage = () => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'

  useEffect(() => {
    fetchAllActivities();
  }, []);

  const fetchAllActivities = async () => {
    setLoading(true);
    try {
      const [eventsRes, meetingsRes, schemesRes, worksRes, pollsRes, announcementsRes] = await Promise.all([
        api.get('/engagement/events').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/meetings').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/schemes').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/works').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/polls').catch(() => ({ data: { data: [] } })),
        api.get('/announcements').catch(() => ({ data: { data: [] } }))
      ]);

      const allActivities = [];
      const addedIds = new Set();

      // Events - use response.data.data
      (eventsRes.data?.data || eventsRes.data?.events || []).forEach(event => {
        const uniqueId = `event-${event.id}`;
        if (!addedIds.has(uniqueId)) {
          addedIds.add(uniqueId);
          allActivities.push({
            id: uniqueId,
            type: 'event',
            title: event.title,
            date: event.event_date,
            endDate: event.end_date,
            venue: event.venue,
            category: event.event_type,
            description: event.description,
            link: `/events/${event.id}`,
            color: 'bg-[#c41e3a]',
            textColor: 'text-[#c41e3a]',
            borderColor: 'border-[#c41e3a]',
           
            labelKey: 'Event'
          });
        }
      });

      // Meetings - use response.data.data
      (meetingsRes.data?.data || meetingsRes.data?.meetings || []).forEach(meeting => {
        const uniqueId = `meeting-${meeting.id}`;
        if (!addedIds.has(uniqueId)) {
          addedIds.add(uniqueId);
          allActivities.push({
            id: uniqueId,
            type: 'meeting',
            title: meeting.title,
            date: meeting.meeting_date,
            venue: meeting.venue,
            categoryKey: 'Gram Sabha',
            description: meeting.agenda,
            link: `/meetings`,
            color: 'bg-[#1e3a5f]',
            textColor: 'text-[#1e3a5f]',
            borderColor: 'border-[#1e3a5f]',
          
            labelKey: 'Gram Sabha'
          });
        }
      });

      // Schemes - use response.data.data
      (schemesRes.data?.data || schemesRes.data?.schemes || []).forEach(scheme => {
        if (scheme.deadline) {
          const uniqueId = `scheme-${scheme.id}`;
          if (!addedIds.has(uniqueId)) {
            addedIds.add(uniqueId);
            allActivities.push({
              id: uniqueId,
              type: 'scheme',
              title: scheme.name,
              titleSuffix: 'Deadline',
              date: scheme.deadline,
              category: scheme.category,
              description: scheme.description,
              link: `/schemes/${scheme.id}`,
              color: 'bg-green-600',
              textColor: 'text-green-600',
              borderColor: 'border-green-600',
          
              labelKey: 'Scheme Deadline'
            });
          }
        }
      });

      // Works - use response.data.data
      (worksRes.data?.data || worksRes.data?.works || []).forEach(work => {
        if (work.start_date) {
          const uniqueId = `work-start-${work.id}`;
          if (!addedIds.has(uniqueId)) {
            addedIds.add(uniqueId);
            allActivities.push({
              id: uniqueId,
              type: 'work',
              title: work.title,
              titleSuffix: 'Start',
              date: work.start_date,
              category: work.work_type,
              description: work.description,
              link: `/works`,
              color: 'bg-orange-500',
              textColor: 'text-orange-600',
              borderColor: 'border-orange-500',
          
              labelKey: 'Work Start'
            });
          }
        }
        if (work.expected_completion) {
          const uniqueId = `work-end-${work.id}`;
          if (!addedIds.has(uniqueId)) {
            addedIds.add(uniqueId);
            allActivities.push({
              id: uniqueId,
              type: 'work',
              title: work.title,
              titleSuffix: 'Completion',
              date: work.expected_completion,
              category: work.work_type,
              description: work.description,
              link: `/works`,
              color: 'bg-gray-600',
              textColor: 'text-gray-600',
              borderColor: 'border-gray-600',
           
              labelKey: 'Work Completion'
            });
          }
        }
      });

      // Polls - use response.data.data
      (pollsRes.data?.data || pollsRes.data?.polls || []).forEach(poll => {
        if (poll.end_date) {
          const uniqueId = `poll-${poll.id}`;
          if (!addedIds.has(uniqueId)) {
            addedIds.add(uniqueId);
            allActivities.push({
              id: uniqueId,
              type: 'poll',
              title: poll.question,
              titlePrefix: 'Poll',
              date: poll.end_date,
              categoryKey: 'Poll Ends',
              link: `/polls`,
              color: 'bg-purple-600',
              textColor: 'text-purple-600',
              borderColor: 'border-purple-600',
              
              labelKey: 'Poll'
            });
          }
        }
      });

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [t('January'), t('February'), t('March'), t('April'), t('May'), t('June'), 
                      t('July'), t('August'), t('September'), t('October'), t('November'), t('December')];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  };

  const getActivitiesForDate = (date) => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.getDate() === date.getDate() &&
             activityDate.getMonth() === date.getMonth() &&
             activityDate.getFullYear() === date.getFullYear();
    });
  };

  const handleDateClick = (dayInfo) => {
    if (!dayInfo.isCurrentMonth) return;
    const dateActivities = getActivitiesForDate(dayInfo.date);
    setSelectedDate(dayInfo.date);
    setSelectedActivities(dateActivities);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const activityTypes = [
    { type: 'event', label: t('Events'), color: 'bg-[#c41e3a]' },
    { type: 'meeting', label: t('Gram Sabha'), color: 'bg-[#1e3a5f]' },
    { type: 'scheme', label: t('Scheme Deadlines'), color: 'bg-green-600' },
    { type: 'work', label: t('Works'), color: 'bg-orange-500' },
    { type: 'poll', label: t('Polls'), color: 'bg-purple-600' }
  ];

  const upcomingActivities = activities
    .filter(a => new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="text-center">
            <span className="inline-flex items-center text-[#c41e3a] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1.5 sm:mb-2">
              <FiCalendar className="mr-1.5 sm:mr-2" />
              {t('ACTIVITY CALENDAR')}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1e3a5f] mb-2 sm:mb-3">
              {t('Community Calendar')}
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base px-2">
              {t('Stay updated with all events, meetings, schemes, and works in your panchayat')}
            </p>
          </div>

          {/* View Toggle & Legend */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 gap-3 sm:gap-4">
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                  viewMode === 'month' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('Calendar')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('List')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {activityTypes.map(type => (
                <div key={type.type} className="flex items-center gap-1 sm:gap-2">
                  <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${type.color}`}></span>
                  <span className="text-xs sm:text-sm text-gray-600">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {loading ? (
          <div className="bg-white p-4 sm:p-6 md:p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array(42).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : viewMode === 'month' ? (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Calendar Grid */}
            <div className="lg:w-2/3 bg-white p-3 sm:p-4 md:p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="flex items-center gap-1 sm:gap-2 text-[#c41e3a] hover:text-[#a01830] font-medium text-xs sm:text-sm md:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">{t('Previous')}</span>
                </button>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1e3a5f]">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="flex items-center gap-1 sm:gap-2 text-[#c41e3a] hover:text-[#a01830] font-medium text-xs sm:text-sm md:text-base"
                >
                  <span className="hidden sm:inline">{t('Next')}</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-1 sm:mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="text-center text-[10px] sm:text-sm font-semibold text-gray-500 py-1 sm:py-2">
                    <span className="sm:hidden">{day}</span>
                    <span className="hidden sm:inline">{[t('SUN'), t('MON'), t('TUE'), t('WED'), t('THU'), t('FRI'), t('SAT')][idx]}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                {getDaysInMonth(currentMonth).map((dayInfo, idx) => {
                  const dateActivities = getActivitiesForDate(dayInfo.date);
                  const hasActivities = dateActivities.length > 0;
                  const isSelected = selectedDate && 
                    dayInfo.date.getDate() === selectedDate.getDate() &&
                    dayInfo.date.getMonth() === selectedDate.getMonth();
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => handleDateClick(dayInfo)}
                      className={`min-h-14 sm:min-h-20 md:min-h-24 p-1 sm:p-2 border cursor-pointer transition-all ${
                        !dayInfo.isCurrentMonth ? 'bg-gray-50 text-gray-300' :
                        isToday(dayInfo.date) ? 'bg-[#c41e3a]/10 border-[#c41e3a]' :
                        isSelected ? 'bg-[#1e3a5f]/10 border-[#1e3a5f]' :
                        'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 ${
                        isToday(dayInfo.date) ? 'text-[#c41e3a]' :
                        !dayInfo.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {dayInfo.day}
                        {isToday(dayInfo.date) && <span className="hidden sm:inline ml-1 text-xs">({t('Today')})</span>}
                      </div>
                      {hasActivities && dayInfo.isCurrentMonth && (
                        <div className="space-y-0.5 sm:space-y-1">
                          {dateActivities.slice(0, window.innerWidth < 640 ? 1 : 2).map((activity, i) => (
                            <div 
                              key={i} 
                              className={`text-[8px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate text-white ${activity.color}`}
                            >
                              <span className="hidden sm:inline">{activity.title.length > 15 ? activity.title.substring(0, 15) + '...' : activity.title}</span>
                              <span className="sm:hidden">{activity.type.charAt(0).toUpperCase()}</span>
                            </div>
                          ))}
                          {dateActivities.length > (window.innerWidth < 640 ? 1 : 2) && (
                            <div className="text-[8px] sm:text-xs text-gray-500 font-medium">
                              +{dateActivities.length - (window.innerWidth < 640 ? 1 : 2)} {t('more')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Details / Upcoming Activities */}
            <div className="lg:w-1/3">
              {selectedDate && selectedActivities.length > 0 ? (
                <div className="bg-white p-4 sm:p-6 sticky top-24">
                  <h3 className="text-base sm:text-lg font-bold text-[#1e3a5f] mb-1.5 sm:mb-2">
                    {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">{selectedActivities.length} {t('activities')}</p>
                  
                  <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
                    {selectedActivities.map(activity => (
                      <Link 
                        key={activity.id} 
                        to={activity.link}
                        className={`block p-3 sm:p-4 border-l-4 ${activity.borderColor} bg-gray-50 hover:bg-gray-100 transition-colors`}
                      >
                        <span className={`text-[10px] sm:text-xs font-semibold uppercase ${activity.textColor}`}>
                          {activity.labelKey ? t(activity.labelKey) : activity.label}
                        </span>
                        <h4 className="font-semibold text-gray-800 mt-1 text-sm sm:text-base">
                          {activity.titlePrefix ? `${t(activity.titlePrefix)}: ` : ''}
                          <TranslatedText text={activity.title} />
                          {activity.titleSuffix ? ` - ${t(activity.titleSuffix)}` : ''}
                        </h4>
                        {activity.venue && (
                          <p className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
                            <FiMapPin className="mr-1" size={12} />
                            <TranslatedText text={activity.venue} />
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
                          <FiClock className="mr-1" size={12} />
                          {formatTime(activity.date)}
                        </p>
                      </Link>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => { setSelectedDate(null); setSelectedActivities([]); }}
                    className="mt-3 sm:mt-4 text-xs sm:text-sm text-[#c41e3a] hover:underline"
                  >
                    {t('Clear Selection')}
                  </button>
                </div>
              ) : (
                <div className="bg-white p-4 sm:p-6 sticky top-24">
                  <h3 className="text-base sm:text-lg font-bold text-[#1e3a5f] mb-3 sm:mb-4">{t('Upcoming Activities')}</h3>
                  <div className="space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto">
                    {upcomingActivities.slice(0, 10).map(activity => (
                      <Link 
                        key={activity.id} 
                        to={activity.link}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${activity.color} text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0`}>
                          {activity.type.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-sm sm:text-base">
                            {activity.titlePrefix ? `${t(activity.titlePrefix)}: ` : ''}
                            <TranslatedText text={activity.title} />
                            {activity.titleSuffix ? ` - ${t(activity.titleSuffix)}` : ''}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {new Date(activity.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            {' • '}{activity.categoryKey ? t(activity.categoryKey) : <TranslatedText text={activity.category} />}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-3 sm:mt-4">{t('Click on a date to see all activities')}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-white">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-bold text-[#1e3a5f]">{t('All Upcoming Activities')}</h2>
              <p className="text-gray-500 text-xs sm:text-sm">{upcomingActivities.length} {t('upcoming activities')}</p>
            </div>
            <div className="divide-y">
              {upcomingActivities.map(activity => (
                <Link 
                  key={activity.id} 
                  to={activity.link}
                  className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 md:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center flex-shrink-0 w-10 sm:w-16">
                    <div className="text-lg sm:text-2xl font-bold text-[#1e3a5f]">
                      {new Date(activity.date).getDate()}
                    </div>
                    <div className="text-[10px] sm:text-sm text-gray-500 uppercase">
                      {new Date(activity.date).toLocaleDateString('en-IN', { month: 'short' })}
                    </div>
                  </div>
                  <div className={`w-1 self-stretch ${activity.color}`}></div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] sm:text-xs font-semibold uppercase ${activity.textColor}`}>
                      {activity.labelKey ? t(activity.labelKey) : activity.label}
                    </span>
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg">
                      {activity.titlePrefix ? `${t(activity.titlePrefix)}: ` : ''}
                      <TranslatedText text={activity.title} />
                      {activity.titleSuffix ? ` - ${t(activity.titleSuffix)}` : ''}
                    </h3>
                    {activity.description && (
                      <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2"><TranslatedText text={activity.description} /></p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500">
                      {activity.venue && (
                        <span className="flex items-center">
                          <FiMapPin className="mr-1" size={12} />
                          <span className="truncate max-w-[100px] sm:max-w-none"><TranslatedText text={activity.venue} /></span>
                        </span>
                      )}
                      <span className="flex items-center">
                        <FiClock className="mr-1" size={12} />
                        {formatTime(activity.date)}
                      </span>
                    </div>
                  </div>
                  <FiArrowRight className="text-gray-400 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              ))}
            </div>
            {upcomingActivities.length === 0 && (
              <div className="text-center py-10 sm:py-16">
                <FiCalendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1.5 sm:mb-2">{t('No Upcoming Activities')}</h3>
                <p className="text-gray-500 text-sm sm:text-base">{t('Check back later for new events and updates')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
