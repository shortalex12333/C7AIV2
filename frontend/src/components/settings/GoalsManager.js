import React, { useState, useEffect } from 'react';
import { secureApiCall } from '../../utils/security';

const GoalsManager = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_value: '',
    target_unit: 'sessions',
    deadline: '',
    priority: 'medium'
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/user-goals`);
      
      if (response && response.goals) {
        setGoals(response.goals);
      } else if (Array.isArray(response)) {
        setGoals(response);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const endpoint = editingGoal 
        ? `${backendUrl}/api/user-goals/${editingGoal.id}`
        : `${backendUrl}/api/user-goals`;
      
      const method = editingGoal ? 'PUT' : 'POST';
      
      const response = await secureApiCall(endpoint, {
        method,
        body: JSON.stringify(newGoal)
      });

      if (response && !response.error) {
        await loadGoals();
        setShowAddForm(false);
        setEditingGoal(null);
        setNewGoal({
          title: '',
          description: '',
          target_value: '',
          target_unit: 'sessions',
          deadline: '',
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title || '',
      description: goal.description || '',
      target_value: goal.target_value || '',
      target_unit: goal.target_unit || 'sessions',
      deadline: goal.deadline || '',
      priority: goal.priority || 'medium'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/user-goals/${goalId}`, {
        method: 'DELETE'
      });

      if (response && !response.error) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (goal) => {
    const updatedGoal = { ...goal, completed: !goal.completed };
    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await secureApiCall(`${backendUrl}/api/user-goals/${goal.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedGoal)
      });

      if (response && !response.error) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const calculateProgress = (goal) => {
    if (!goal.target_value || !goal.current_value) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
          Your Goals
        </h3>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingGoal(null);
            setNewGoal({
              title: '',
              description: '',
              target_value: '',
              target_unit: 'sessions',
              deadline: '',
              priority: 'medium'
            });
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
        >
          Add Goal
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Goal Title
              </label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                placeholder="e.g., Improve public speaking confidence"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                Description
              </label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                placeholder="Describe what you want to achieve..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                  Target Value
                </label>
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                  Unit
                </label>
                <select
                  value={newGoal.target_unit}
                  onChange={(e) => setNewGoal({ ...newGoal, target_unit: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                >
                  <option value="sessions">Sessions</option>
                  <option value="hours">Hours</option>
                  <option value="minutes">Minutes</option>
                  <option value="presentations">Presentations</option>
                  <option value="confidence_score">Confidence Score</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                  Deadline
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                  Priority
                </label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingGoal(null);
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}
              >
                {loading ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Add Goal')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {loading && !showAddForm ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`bg-gray-800/50 border border-gray-700 rounded-2xl p-6 ${
                goal.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={() => handleToggleComplete(goal)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        goal.completed 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-gray-500 hover:border-blue-500'
                      } transition-colors`}
                    >
                      {goal.completed && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <h4 className={`text-lg font-semibold ${goal.completed ? 'line-through text-gray-400' : 'text-white'}`} style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                      {goal.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                  
                  {goal.description && (
                    <p className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
                      {goal.description}
                    </p>
                  )}

                  {goal.target_value && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-blue-400">
                          {goal.current_value || 0} / {goal.target_value} {goal.target_unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(goal)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {goal.deadline && (
                    <p className="text-sm text-gray-400">
                      Deadline: {formatDeadline(goal.deadline)}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm" style={{ fontFamily: 'Elquia, system-ui, sans-serif' }}>
            No goals yet
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Create your first goal to start tracking your progress
          </p>
        </div>
      )}
    </div>
  );
};

export default GoalsManager;