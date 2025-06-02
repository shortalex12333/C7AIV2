import React, { useState, useEffect } from 'react';
import { secureApiCall } from '../../utils/security';

const MetricsDisplay = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/performance-metrics?range=${timeRange}`);
      
      if (response && !response.error) {
        setMetrics(response);
      } else {
        setMetrics(null);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getChangeIcon = (change) => {
    if (change > 0) {
      return <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>;
    } else if (change < 0) {
      return <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>;
    }
    return <div className="w-4 h-4 text-gray-400">-</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Performance Metrics
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
          style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 3 months</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {metrics ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Sessions */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                {getChangeIcon(metrics.total_sessions_change || 0)}
              </div>
              <h4 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                {metrics.total_sessions || 0}
              </h4>
              <p className="text-sm text-gray-400">Total Sessions</p>
              {metrics.total_sessions_change && (
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.total_sessions_change > 0 ? '+' : ''}{metrics.total_sessions_change} from last period
                </p>
              )}
            </div>

            {/* Total Time */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {getChangeIcon(metrics.total_time_change || 0)}
              </div>
              <h4 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                {formatDuration(metrics.total_time)}
              </h4>
              <p className="text-sm text-gray-400">Practice Time</p>
              {metrics.total_time_change && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatDuration(Math.abs(metrics.total_time_change))} {metrics.total_time_change > 0 ? 'more' : 'less'}
                </p>
              )}
            </div>

            {/* Average Confidence */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                {getChangeIcon(metrics.avg_confidence_change || 0)}
              </div>
              <h4 className={`text-2xl font-bold mb-1 ${getScoreColor(metrics.avg_confidence || 0)}`} style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                {Math.round(metrics.avg_confidence || 0)}%
              </h4>
              <p className="text-sm text-gray-400">Avg Confidence</p>
              {metrics.avg_confidence_change && (
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.avg_confidence_change > 0 ? '+' : ''}{Math.round(metrics.avg_confidence_change)}% change
                </p>
              )}
            </div>

            {/* Speaking Score */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                {getChangeIcon(metrics.speaking_score_change || 0)}
              </div>
              <h4 className={`text-2xl font-bold mb-1 ${getScoreColor(metrics.speaking_score || 0)}`} style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                {Math.round(metrics.speaking_score || 0)}
              </h4>
              <p className="text-sm text-gray-400">Speaking Score</p>
              {metrics.speaking_score_change && (
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.speaking_score_change > 0 ? '+' : ''}{Math.round(metrics.speaking_score_change)} change
                </p>
              )}
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Skill Breakdown */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Skill Breakdown
              </h4>
              
              <div className="space-y-4">
                {metrics.skills && Object.entries(metrics.skills).map(([skill, score]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300 capitalize" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                        {skill.replace('_', ' ')}
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                        {Math.round(score)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          score >= 80 ? 'bg-green-500' : 
                          score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Trends */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Progress Trends
              </h4>
              
              <div className="space-y-4">
                {metrics.trends && metrics.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                        {trend.metric}
                      </p>
                      <p className="text-xs text-gray-400">
                        {trend.period}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getChangeIcon(trend.change)}
                      <span className={`text-sm font-semibold ${trend.change > 0 ? 'text-green-400' : trend.change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {trend.change > 0 ? '+' : ''}{Math.round(trend.change)}{trend.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {metrics.recent_sessions && metrics.recent_sessions.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Recent Sessions
              </h4>
              
              <div className="space-y-3">
                {metrics.recent_sessions.slice(0, 5).map((session, index) => (
                  <div key={session.id || index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                        {session.topic || `Session ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(session.date || session.created_at).toLocaleDateString()} • {formatDuration(session.duration)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${getScoreColor(session.score || 0)}`}>
                        {Math.round(session.score || 0)}%
                      </div>
                      <div className="text-xs text-gray-400">
                        {session.feedback_count || 0} feedback
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            No metrics available yet
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Complete some voice coaching sessions to see your performance metrics
          </p>
        </div>
      )}
    </div>
  );
};

export default MetricsDisplay;