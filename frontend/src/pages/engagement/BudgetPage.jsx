import { useState, useEffect } from 'react';
import CitizenNav from '../../components/CitizenNav';
import TranslatedText from '../../components/TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BudgetPage = () => {
  const { t } = useTranslation();
  const [budget, setBudget] = useState([]);
  const [totals, setTotals] = useState({ total_allocated: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const years = ['2026', '2025', '2024', '2023'];

  // Auto-refresh every 2 minutes for budget updates
  useEffect(() => {
    fetchBudget();
    const interval = setInterval(() => {
      fetchBudget(true); // silent refresh
    }, 120000);
    return () => clearInterval(interval);
  }, [fiscalYear]);

  const fetchBudget = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get(`/engagement/budget?fiscal_year=${fiscalYear}`);
      if (response.data.success) {
        setBudget(response.data.budget);
        setTotals(response.data.totals);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
      if (!silent) toast.error('Failed to load budget data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getSpentPercentage = (allocated, spent) => {
    if (!allocated || allocated === 0) return 0;
    return Math.round((spent / allocated) * 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-[#c41e3a]';
    if (percentage >= 70) return 'bg-gray-600';
    return 'bg-gray-500';
  };

  const getCategoryIcon = (name) => {
    const icons = {
      'Infrastructure': '🏗️',
      'Education': '📚',
      'Healthcare': '🏥',
      'Sanitation': '🚰',
      'Street Lighting': '💡',
      'Agriculture': '🌾',
      'Social Welfare': '👥',
      'Administration': '🏛️'
    };
    return icons[name] || '📊';
  };

  const totalSpentPercentage = getSpentPercentage(totals.total_allocated, totals.total_spent);

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenNav />
      
      {/* Hero Banner */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&h=400&fit=crop" 
          alt="Budget & Finance"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 to-purple-900/70"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">{t('budgetOverview')}</h1>
            <p className="text-white/80">{t('transparencyInSpending')}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">

        {/* Year Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <span className="text-sm sm:text-base text-gray-600 font-medium">{t('fiscalYear')}:</span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setFiscalYear(year)}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  fiscalYear === year 
                    ? 'bg-[#c41e3a] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {year}-{parseInt(year) + 1}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-8 mb-6 sm:mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{t('totalBudget')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(totals.total_allocated)}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">FY {fiscalYear}-{parseInt(fiscalYear) + 1}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{t('amountSpent')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(totals.total_spent)}</p>
                <p className="text-xs sm:text-sm mt-1 sm:mt-2">
                  <span className="text-[#c41e3a]">↓ {totalSpentPercentage}%</span>
                  <span className="text-gray-500 ml-1">{t('utilized')}</span>
                </p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{t('remaining')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(totals.total_allocated - totals.total_spent)}</p>
                <p className="text-xs sm:text-sm mt-1 sm:mt-2">
                  <span className="text-green-600">↑ {100 - totalSpentPercentage}%</span>
                  <span className="text-gray-500 ml-1">{t('available')}</span>
                </p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-white p-4 sm:p-6 mb-6 sm:mb-8 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">{t('overallUtilization')}</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase text-[#c41e3a] bg-gray-100">
                      {t('budgetSpent')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-[#c41e3a]">
                      {totalSpentPercentage}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-4 text-xs flex bg-gray-200">
                  <div 
                    style={{ width: `${totalSpentPercentage}%` }}
                    className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#c41e3a] transition-all duration-500"
                  ></div>
                </div>
              </div>
            </div>

            {/* Category-wise Budget */}
            <div className="bg-white overflow-hidden rounded-lg">
              <div className="p-4 sm:p-6 border-b">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Category-wise Budget</h3>
              </div>
              <div className="divide-y">
                {budget.map((category, index) => {
                  const spentPercentage = getSpentPercentage(category.allocated, category.spent);
                  return (
                    <div key={index} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
                        <div>
                          <TranslatedText text={category.name} className="font-semibold text-gray-900 text-sm sm:text-base" as="h4" />
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatCurrency(category.spent)} spent of {formatCurrency(category.allocated)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xl sm:text-2xl font-bold text-gray-900">{spentPercentage}%</span>
                          <p className="text-xs sm:text-sm text-gray-500">utilized</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-2">
                        <div 
                          className="h-2 bg-gray-700 transition-all duration-500"
                          style={{ width: `${spentPercentage}%` }}
                        ></div>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-gray-400">
                        Remaining: {formatCurrency(category.allocated - category.spent)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 sm:mt-8 bg-gray-50 border border-gray-300 rounded-lg p-3 sm:p-4">
              <div className="flex items-start">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-800">About Budget Data</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    This budget information is updated regularly by the Panchayat administration. 
                    For detailed breakdowns and official documents, please visit the Panchayat office.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetPage;
