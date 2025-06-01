import React, { useState, useEffect } from 'react';
import { secureApiCall } from '../../utils/security';

const MetricsDisplay = ({ userId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewPeriod, setViewPeriod] = useState('weekly'); // weekly, monthly
  const [error, setError] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Load metrics on component mount
  useEffect(() => {
    if (userId) {
      loadMetrics();
    }
  }, [userId, viewPeriod]);

  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await secureApiCall(`${backendUrl}/api/performance-metrics/${userId}`, {
        method: 'GET'
      });

      if (response.success !== false) {
        setMetrics(response);
      } else {
        throw new Error(response.error || 'Failed to load metrics');
      }
    } catch (err) {
      console.error('Metrics loading error:', err);
      setError('Failed to load metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getStreakColor = (streak) => {
    if (streak >= 30) return 'text-green-400';
    if (streak >= 14) return 'text-orange-400';
    if (streak >= 7) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getSatisfactionColor = (rate) => {
    if (rate >= 4.0) return 'text-green-400';
    if (rate >= 3.0) return 'text-orange-400';
    if (rate >= 2.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConsistencyColor = (consistency) => {
    if (consistency >= 80) return 'text-green-400';
    if (consistency >= 60) return 'text-orange-400';
    if (consistency >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          Loading metrics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-400">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
          <button
            onClick={loadMetrics}
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Performance Metrics</h2>
          
          {/* View Period Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewPeriod('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewPeriod === 'weekly'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewPeriod === 'monthly'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {metrics && (
          <div className="space-y-6">
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Active Days */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Active Days</h3>
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {metrics.active_days}
                </div>
                <p className="text-xs text-gray-500">
                  {viewPeriod === 'weekly' ? 'This week' : 'This month'}
                </p>
              </div>

              {/* Current Streak */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Current Streak</h3>
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div className={`text-3xl font-bold mb-1 ${getStreakColor(metrics.current_streak)}`}>
                  {metrics.current_streak}
                </div>
                <p className="text-xs text-gray-500">Days in a row</p>
              </div>

              {/* Goal Progress */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Goal Progress</h3>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {Math.round(metrics.goal_progress_avg)}%
                </div>
                <p className="text-xs text-gray-500">Average completion</p>
              </div>

              {/* Satisfaction Rate */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Satisfaction</h3>
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className={`text-3xl font-bold mb-1 ${getSatisfactionColor(metrics.satisfaction_rate)}`}>
                  {metrics.satisfaction_rate}/5
                </div>
                <p className="text-xs text-gray-500">Rating average</p>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Workout Consistency */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Workout Consistency</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Consistency Rate</span>
                  <span className={`text-xl font-bold ${getConsistencyColor(metrics.workout_consistency)}`}>
                    {Math.round(metrics.workout_consistency)}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      metrics.workout_consistency >= 80 ? 'bg-green-600' :
                      metrics.workout_consistency >= 60 ? 'bg-orange-600' :
                      metrics.workout_consistency >= 40 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${metrics.workout_consistency}%` }}
                  ></div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {metrics.workout_consistency >= 80 ? '🔥 Excellent consistency!' :
                   metrics.workout_consistency >= 60 ? '💪 Good progress' :
                   metrics.workout_consistency >= 40 ? '📈 Room for improvement' :
                   '⚡ Let\'s get back on track'}
                </div>
              </div>

              {/* Daily Interactions */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Interactions</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Average per Day</span>
                  <span className="text-xl font-bold text-blue-400">
                    {metrics.daily_interaction_count}
                  </span>
                </div>
                
                {/* Mock weekly data visualization */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 mb-2">{viewPeriod === 'weekly' ? 'This Week' : 'Recent Days'}</div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const value = Math.floor(Math.random() * 8) + 1; // Mock data
                    return (
                      <div key={day} className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500 w-8">{day}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(value / 8) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400 w-6">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {[
                  { name: 'Fitness', value: 35, color: 'bg-red-600' },
                  { name: 'Mindset', value: 25, color: 'bg-blue-600' },
                  { name: 'Nutrition', value: 20, color: 'bg-green-600' },
                  { name: 'Progress', value: 20, color: 'bg-purple-600' }
                ].map((category) => (
                  <div key={category.name} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#374151"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${category.value}, 100`}
                          className={`${
                            category.color === 'bg-red-600' ? 'text-red-600' :
                            category.color === 'bg-blue-600' ? 'text-blue-600' :
                            category.color === 'bg-green-600' ? 'text-green-600' :
                            'text-purple-600'
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">{category.value}%</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-gray-300">{category.name}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights Section */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">This {viewPeriod === 'weekly' ? 'Week\'s' : 'Month\'s'} Insights</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-green-900 bg-opacity-20 border border-green-800 rounded-lg">
                  <div className="text-green-400 mt-1">✅</div>
                  <div>
                    <p className="text-green-300 font-medium">Strong consistency with morning routine</p>
                    <p className="text-green-400 text-sm">You've maintained your morning routine for {metrics.current_streak} consecutive days</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-orange-900 bg-opacity-20 border border-orange-800 rounded-lg">
                  <div className="text-orange-400 mt-1">⚠️</div>
                  <div>
                    <p className="text-orange-300 font-medium">Missed 2 planned workouts</p>
                    <p className="text-orange-400 text-sm">Consider adjusting your schedule or workout intensity</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
                  <div className="text-blue-400 mt-1">💡</div>
                  <div>
                    <p className="text-blue-300 font-medium">Good progress on deadlift goal</p>
                    <p className="text-blue-400 text-sm">You're {Math.round(metrics.goal_progress_avg)}% towards your target</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDisplay;