import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PollsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [votingInProgress, setVotingInProgress] = useState({}); // Track voting state per poll
  const [animatingOptions, setAnimatingOptions] = useState({}); // For smooth bar animations
  const [changingVote, setChangingVote] = useState({}); // Track which polls user wants to change vote

  // Auto-refresh every 15 seconds for real-time poll updates
  useEffect(() => {
    fetchPolls();
    const interval = setInterval(() => {
      fetchPolls(true); // silent refresh
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchPolls = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/engagement/polls');
      if (response.data.success) {
        setPolls(response.data.data || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      if (!silent) toast.error('Failed to load polls');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    if (!currentUser) {
      toast.error('Please login to vote');
      return;
    }

    // Check if user is approved
    if (!userProfile || userProfile.status !== 'approved') {
      if (userProfile?.status === 'pending') {
        toast.error('Your account is pending approval. Please wait for admin to approve your registration.');
        navigate('/pending-approval', { replace: true });
      } else {
        toast.error('You need an approved account to vote');
      }
      return;
    }

    const poll = polls.find(p => p.id === pollId);
    const oldOptionId = poll?.userVotedOptionId;
    const isChangingVote = oldOptionId && oldOptionId !== optionId;

    // Set voting in progress
    setVotingInProgress(prev => ({ ...prev, [pollId]: optionId }));

    // Optimistic update - immediately update the UI
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        const updatedOptions = p.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, vote_count: (opt.vote_count || 0) + 1 };
          }
          // If changing vote, decrease old option count
          if (isChangingVote && opt.id === oldOptionId) {
            return { ...opt, vote_count: Math.max(0, (opt.vote_count || 0) - 1) };
          }
          return opt;
        });
        return { 
          ...p, 
          options: updatedOptions,
          total_votes: isChangingVote ? p.total_votes : (p.total_votes || 0) + 1,
          userVotedOptionId: optionId
        };
      }
      return p;
    }));

    // Close change vote mode
    setChangingVote(prev => ({ ...prev, [pollId]: false }));
    
    // Trigger animation
    setAnimatingOptions(prev => ({ ...prev, [pollId]: true }));

    try {
      const response = await api.post(`/engagement/polls/${pollId}/vote`, {
        option_id: optionId
      });
      if (response.data.success) {
        if (response.data.changed) {
          toast.success('Vote changed successfully!');
        } else {
          toast.success('Vote recorded successfully!');
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setPolls(prev => prev.map(p => {
        if (p.id === pollId) {
          const updatedOptions = p.options.map(opt => {
            if (opt.id === optionId) {
              return { ...opt, vote_count: Math.max(0, (opt.vote_count || 0) - 1) };
            }
            if (isChangingVote && opt.id === oldOptionId) {
              return { ...opt, vote_count: (opt.vote_count || 0) + 1 };
            }
            return opt;
          });
          return { 
            ...p, 
            options: updatedOptions,
            total_votes: isChangingVote ? p.total_votes : Math.max(0, (p.total_votes || 0) - 1),
            userVotedOptionId: oldOptionId
          };
        }
        return p;
      }));
      
      toast.error(error.response?.data?.message || 'Failed to record vote');
    } finally {
      setVotingInProgress(prev => ({ ...prev, [pollId]: null }));
      // Keep animation for smooth effect
      setTimeout(() => {
        setAnimatingOptions(prev => ({ ...prev, [pollId]: false }));
      }, 500);
    }
  };

  const toggleChangeVote = (pollId) => {
    setChangingVote(prev => ({ ...prev, [pollId]: !prev[pollId] }));
  };

  const calculatePercentage = (option, poll) => {
    const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);
    if (totalVotes === 0) return 0;
    return Math.round((option.vote_count || 0) / totalVotes * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Hero Banner with Poll Image */}
      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=1600&h=400&fit=crop" 
          alt="Community Voting"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 to-[#c41e3a]/70"></div>
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <span className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wider">{t('yourVoiceMatters')}</span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mt-1.5 sm:mt-2">{t('communityPolls')}</h1>
            <p className="text-white/80 text-sm sm:text-base mt-1.5 sm:mt-2">{t('shareOpinion')}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Polls Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 sm:p-6 animate-pulse">
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mb-3 sm:mb-4"></div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="h-10 sm:h-12 bg-gray-100 rounded-lg"></div>
                  <div className="h-10 sm:h-12 bg-gray-100 rounded-lg"></div>
                  <div className="h-10 sm:h-12 bg-gray-100 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : polls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {polls.map((poll, index) => (
              <div key={poll._id || poll.id || index} className="bg-white rounded-xl transition-all duration-500 ease-out p-4 sm:p-6">
                {/* Poll Question */}
                <div className="mb-4 sm:mb-5">
                  <TranslatedText text={poll.question} className="text-[#1e3a5f] font-semibold leading-relaxed text-sm sm:text-base" as="p" />
                  {poll.description && (
                    <TranslatedText text={poll.description} className="text-gray-500 text-xs sm:text-sm mt-1.5 sm:mt-2" as="p" />
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2 sm:space-y-3">
                  {poll.options?.map(option => {
                    const percentage = calculatePercentage(option, poll);
                    const hasVoted = !!poll.userVotedOptionId;
                    const isUserVote = poll.userVotedOptionId === option.id;
                    const isVotingThis = votingInProgress[poll.id] === option.id;
                    const isChangingVoteMode = changingVote[poll.id];
                    
                    return (
                      <div key={option.id}>
                        {!currentUser || (hasVoted && !isChangingVoteMode) ? (
                          /* Results View */
                          <div className={`relative overflow-hidden rounded-lg ${isUserVote ? 'bg-[#1e3a5f]/10' : 'bg-gray-100'} transition-all duration-500`}>
                            {/* Progress Bar */}
                            <div 
                              className={`absolute inset-y-0 left-0 ${
                                isUserVote ? 'bg-[#1e3a5f]' : 'bg-[#1e3a5f]/60'
                              }`}
                              style={{ 
                                width: `${percentage}%`,
                                transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                            ></div>
                            
                            {/* Content */}
                            <div className="relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
                              <div className="flex items-center">
                                <TranslatedText text={option.option_text} className={`text-xs sm:text-sm font-medium transition-colors duration-500 ${isUserVote ? 'text-white' : percentage > 50 ? 'text-white' : 'text-gray-700'}`} />
                                {isUserVote && (
                                  <span className="ml-1.5 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1e3a5f]" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs sm:text-sm font-semibold transition-all duration-700 ${isUserVote || percentage > 50 ? 'text-white' : 'text-gray-600'}`}>
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Voting View */
                          <button
                            onClick={() => handleVote(poll.id, option.id)}
                            disabled={votingInProgress[poll.id]}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-left text-xs sm:text-sm font-medium transition-all duration-300 ease-out transform ${
                              votingInProgress[poll.id]
                                ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500'
                                : isUserVote
                                  ? 'bg-[#1e3a5f] text-white scale-100'
                                  : 'bg-gray-100 text-gray-700 hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f] hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <TranslatedText text={option.option_text} />
                              {isVotingThis && (
                                <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    <span className="text-[#c41e3a] font-semibold">{poll.total_votes || poll.options?.reduce((sum, opt) => sum + (opt.vote_count || 0), 0) || 0}</span> {t('votes')}
                  </span>
                  
                  {currentUser && poll.userVotedOptionId && !changingVote[poll.id] && (
                    <button
                      onClick={() => toggleChangeVote(poll.id)}
                      className="text-[10px] sm:text-xs text-[#c41e3a] hover:text-[#a01830] font-medium transition-colors"
                    >
                      {t('changeVote')}
                    </button>
                  )}
                  
                  {currentUser && changingVote[poll.id] && (
                    <button
                      onClick={() => toggleChangeVote(poll.id)}
                      className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  )}
                  
                  {!currentUser && (
                    <a href="/login" className="text-[10px] sm:text-xs text-[#c41e3a] hover:underline">
                      {t('loginToVote')}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl">
            <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-1.5 sm:mb-2">{t('noData')}</h3>
            <p className="text-sm text-gray-500">{t('tryAgain')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollsPage;
