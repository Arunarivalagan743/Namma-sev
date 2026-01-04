import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import TranslatedText from './TranslatedText';
import api from '../services/api';

const ActivityCalendar = ({ variant = 'full' }) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);

  useEffect(() => {
    fetchAllActivities();
  }, []);

  const fetchAllActivities = async () => {
    setLoading(true);
    try {
      // Fetch all data types in parallel
      const [eventsRes, meetingsRes, schemesRes, worksRes, pollsRes, announcementsRes] = await Promise.all([
        api.get('/engagement/events').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/meetings').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/schemes').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/works').catch(() => ({ data: { data: [] } })),
        api.get('/engagement/polls').catch(() => ({ data: { data: [] } })),
        api.get('/announcements').catch(() => ({ data: { data: [] } }))
      ]);

      const allActivities = [];
      const addedIds = new Set(); // Prevent duplicates

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
            link: `/events/${event.id}`,
            color: 'bg-[#c41e3a]',
            textColor: 'text-[#c41e3a]',
            
          });
        }
      });

      // Meetings (Gram Sabha) - use response.data.data
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
            link: `/meetings`,
            color: 'bg-[#1e3a5f]',
            textColor: 'text-[#1e3a5f]',
          
          });
        }
      });

      // Schemes with deadlines - use response.data.data
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
              link: `/schemes/${scheme.id}`,
              color: 'bg-green-600',
              textColor: 'text-green-600',
             
            });
          }
        }
      });

      // Works with deadlines/start dates - use response.data.data
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
              link: `/works`,
              color: 'bg-orange-500',
              textColor: 'text-orange-600',
            
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
              link: `/works`,
              color: 'bg-gray-600',
              textColor: 'text-gray-600',
             
            });
          }
        }
      });

      // Polls with end dates - use response.data.data
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
             
            });
          }
        }
      });

      // Announcements with dates - use response.data.data
      (announcementsRes.data?.data || announcementsRes.data?.announcements || []).forEach(announcement => {
        if (announcement.created_at) {
          const uniqueId = `announcement-${announcement.id}`;
          if (!addedIds.has(uniqueId)) {
            addedIds.add(uniqueId);
            allActivities.push({
              id: uniqueId,
              type: 'announcement',
              title: announcement.title,
              date: announcement.created_at,
              category: announcement.priority,
              link: `/announcements`,
              color: 'bg-gray-500',
              textColor: 'text-gray-600',
            
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
    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    // Next month days
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

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Activity type legend
  const activityTypes = [
    { type: 'event', label: t('Events'), color: 'bg-[#c41e3a]' },
    { type: 'meeting', label: t('Gram Sabha'), color: 'bg-[#1e3a5f]' },
    { type: 'scheme', label: t('Scheme Deadlines'), color: 'bg-green-600' },
    { type: 'work', label: t('Works'), color: 'bg-orange-500' },
    { type: 'poll', label: t('Polls'), color: 'bg-purple-600' }
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-7 gap-1">
          {Array(42).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">{t('Activity Calendar')}</h3>
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="text-[#c41e3a] hover:text-[#a01830] p-1"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-[#1e3a5f] text-sm sm:text-base">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="text-[#c41e3a] hover:text-[#a01830] p-1"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[10px] sm:text-xs mb-3 sm:mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="text-gray-500 font-medium py-1 sm:py-2">
            <span className="sm:hidden">{day}</span>
            <span className="hidden sm:inline">{[t('SUN'), t('MON'), t('TUE'), t('WED'), t('THU'), t('FRI'), t('SAT')][idx]}</span>
          </div>
        ))}
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
              className={`relative py-1.5 sm:py-2 rounded cursor-pointer transition-colors text-xs sm:text-sm ${
                !dayInfo.isCurrentMonth ? 'text-gray-300' :
                isToday(dayInfo.date) ? 'bg-[#c41e3a] text-white font-bold' :
                isSelected ? 'bg-[#1e3a5f] text-white' :
                'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {dayInfo.day}
              {hasActivities && dayInfo.isCurrentMonth && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {dateActivities.slice(0, 2).map((activity, i) => (
                    <span 
                      key={i} 
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${activity.color} ${isToday(dayInfo.date) || isSelected ? 'opacity-70' : ''}`}
                    ></span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Activities */}
      {selectedDate && selectedActivities.length > 0 && (
        <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
            {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </h4>
          <div className="space-y-1.5 sm:space-y-2 max-h-36 sm:max-h-48 overflow-y-auto">
            {selectedActivities.map(activity => (
              <Link 
                key={activity.id} 
                to={activity.link}
                className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${activity.color} mt-1 sm:mt-1.5 flex-shrink-0`}></span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium ${activity.textColor} truncate`}>
                    {activity.titlePrefix ? `${t(activity.titlePrefix)}: ` : ''}
                    <TranslatedText text={activity.title} />
                    {activity.titleSuffix ? ` - ${t(activity.titleSuffix)}` : ''}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {activity.categoryKey ? t(activity.categoryKey) : <TranslatedText text={activity.category} />} {activity.venue && <>• <TranslatedText text={activity.venue} /></>}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {variant === 'full' && (
        <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
          <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">{t('Legend')}</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {activityTypes.map(type => (
              <div key={type.type} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${type.color}`}></span>
                <span className="text-[10px] sm:text-xs text-gray-600">{type.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Activities List */}
      {variant === 'full' && (
        <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">{t('Upcoming Activities')}</h4>
          <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {activities
              .filter(a => new Date(a.date) >= new Date())
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 10)
              .map(activity => (
                <Link 
                  key={activity.id} 
                  to={activity.link}
                  className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${activity.color} mt-1 sm:mt-1.5 flex-shrink-0`}></span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium ${activity.textColor} truncate`}>
                      {activity.titlePrefix ? `${t(activity.titlePrefix)}: ` : ''}
                      <TranslatedText text={activity.title} />
                      {activity.titleSuffix ? ` - ${t(activity.titleSuffix)}` : ''}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      {' • '}{activity.categoryKey ? t(activity.categoryKey) : <TranslatedText text={activity.category} />}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityCalendar;
