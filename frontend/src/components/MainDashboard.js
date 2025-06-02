import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { secureApiCall, initializeSession, ResponseCache } from '../utils/security';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MainDashboard = ({ userId = "test-user-123" }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Initialize security session
  useEffect(() => {
    initializeSession();
  }, []);

  // Fetch dashboard data with security
  const fetchDashboardData = async () => {
    try {
      // Check cache first
      const cacheKey = `dashboard_${userId}`;
      const cached = ResponseCache.get(cacheKey);
      if (cached) {
        setDashboardData(cached);
        return;
      }

      const data = await secureApiCall(`${backendUrl}/api/dashboard`, {
        method: 'GET'
      });
      
      if (data.success === false) {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }
      
      setDashboardData(data);
      ResponseCache.set(cacheKey, data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    }
  };

  // Fetch goals with security
  const fetchGoals = async () => {
    try {
      // Check cache first
      const cacheKey = `goals_${userId}`;
      const cached = ResponseCache.get(cacheKey);
      if (cached) {
        setGoals(cached.goals || []);
        return;
      }

      const data = await secureApiCall(`${backendUrl}/api/goals`, {
        method: 'GET'
      });
      
      if (data.success === false) {
        throw new Error(data.error || 'Failed to fetch goals');
      }
      
      setGoals(data.goals || []);
      ResponseCache.set(cacheKey, data);
    } catch (err) {
      console.error('Goals fetch error:', err);
      setError(err.message);
    }
  };

  // Fetch performance metrics with security
  const fetchMetrics = async () => {
    try {
      // Check cache first
      const cacheKey = `metrics_${userId}`;
      const cached = ResponseCache.get(cacheKey);
      if (cached) {
        setMetrics(cached);
        return;
      }

      const data = await secureApiCall(`${backendUrl}/api/dashboard`, {
        method: 'GET'
      });
      
      if (data.success === false) {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
      
      setMetrics(data);
      ResponseCache.set(cacheKey, data);
    } catch (err) {
      console.error('Metrics fetch error:', err);
      setError(err.message);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchGoals(),
        fetchMetrics()
      ]);
      setLoading(false);
    };

    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {dashboardData?.greeting_message || 'Welcome, warrior'}
          </h1>
          <p className="text-gray-400">Ready to dominate today?</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          {/* Current Streak */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-2xl font-bold text-orange-400 mb-2">
              {dashboardData?.current_streak || 0}
            </div>
            <div className="text-sm text-gray-300">Day Streak</div>
            <div className="text-xs text-gray-500 mt-1">🔥 Keep it going!</div>
          </div>

          {/* Last Workout */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-lg font-bold text-blue-400 mb-2">
              {dashboardData?.last_workout || 'No workout'}
            </div>
            <div className="text-sm text-gray-300">
              {dashboardData?.last_workout_days_ago 
                ? `${dashboardData.last_workout_days_ago} days ago`
                : 'Last workout'
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">💪 Time to hit it again</div>
          </div>

          {/* Primary Goal */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm font-bold text-green-400 mb-2">Primary Goal</div>
            <div className="text-xs text-gray-300 line-clamp-2">
              {dashboardData?.primary_goal || 'Set your first goal'}
            </div>
            <div className="text-xs text-gray-500 mt-2">🎯 Stay focused</div>
          </div>

          {/* Interventions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {dashboardData?.pending_interventions || 0}
            </div>
            <div className="text-sm text-gray-300">Pending</div>
            <div className="text-xs text-gray-500 mt-1">📢 Messages waiting</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <button 
              className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center transition-colors"
              onClick={() => window.location.href = '/voice-chat'}
            >
              <div className="text-2xl mb-2">🎤</div>
              <div className="text-sm font-medium">Voice Chat</div>
            </button>

            <button className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 text-center transition-colors">
              <div className="text-2xl mb-2">💪</div>
              <div className="text-sm font-medium">Log Workout</div>
            </button>

            <button className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-center transition-colors">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm font-medium">Goals</div>
            </button>

            <button className="bg-purple-600 hover:bg-purple-700 rounded-lg p-4 text-center transition-colors">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium">Energy Check</div>
            </button>
          </div>
        </div>

        {/* Active Goals */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Active Goals ({goals.length})</h2>
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                <div className="text-gray-400 mb-2">No goals set yet</div>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors">
                  Create Your First Goal
                </button>
              </div>
            ) : (
              goals.map((goal, index) => (
                <div key={goal.id || index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{goal.title}</h3>
                      <p className="text-gray-400 text-sm">{goal.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">{Math.round(goal.progress)}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Status: {goal.status}</span>
                    <span>Created: {new Date(goal.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Overview */}
        {metrics && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Performance Overview</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                
                <div>
                  <div className="text-2xl font-bold text-blue-400">{metrics.active_days}</div>
                  <div className="text-xs text-gray-400">Active Days</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-green-400">{Math.round(metrics.goal_progress_avg)}%</div>
                  <div className="text-xs text-gray-400">Avg Goal Progress</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-orange-400">{Math.round(metrics.workout_consistency)}%</div>
                  <div className="text-xs text-gray-400">Workout Consistency</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-purple-400">{metrics.daily_interaction_count}</div>
                  <div className="text-xs text-gray-400">Daily Interactions</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-yellow-400">{metrics.satisfaction_rate}/5</div>
                  <div className="text-xs text-gray-400">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="text-center text-gray-500 text-xs">
          <p>Total Sessions: {dashboardData?.total_sessions || 0}</p>
          <p>Last Session: {dashboardData?.last_session ? new Date(dashboardData.last_session).toLocaleString() : 'Never'}</p>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;