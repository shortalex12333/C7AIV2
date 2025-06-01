import React, { useState, useEffect } from 'react';
import { secureApiCall } from '../../utils/security';

const GoalsManager = ({ userId }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newGoal, setNewGoal] = useState({
    userInput: '',
    targetValue: '',
    unitOfMeasurement: ''
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Load goals on component mount
  useEffect(() => {
    if (userId) {
      loadGoals();
    }
  }, [userId]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const response = await secureApiCall(`${backendUrl}/api/user-goals/${userId}`, {
        method: 'GET'
      });

      if (response.success !== false && response.goals) {
        setGoals(response.goals);
      } else {
        throw new Error(response.error || 'Failed to load goals');
      }
    } catch (err) {
      console.error('Goals loading error:', err);
      setMessage({ type: 'error', text: 'Failed to load goals. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, isEditing = false) => {
    const { name, value } = e.target;
    
    if (isEditing && editingGoal) {
      setEditingGoal({
        ...editingGoal,
        [name]: value
      });
    } else {
      setNewGoal({
        ...newGoal,
        [name]: value
      });
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    
    if (!newGoal.userInput.trim()) {
      setMessage({ type: 'error', text: 'Goal description is required' });
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        user_id: userId,
        action: 'create',
        data: {
          goalText: newGoal.userInput.trim(),
          targetValue: newGoal.targetValue || null,
          unitOfMeasurement: newGoal.unitOfMeasurement || null,
          category: 'personal', // Default category
          priority: 'medium' // Default priority
        }
      };

      const response = await secureApiCall(`${backendUrl}/api/goal-update`, {
        method: 'POST',
        body: goalData
      });

      if (response.success !== false) {
        setMessage({ type: 'success', text: 'Goal added successfully!' });
        setNewGoal({ userInput: '', targetValue: '', unitOfMeasurement: '' });
        setShowAddForm(false);
        await loadGoals(); // Reload goals
      } else {
        throw new Error(response.error || 'Failed to add goal');
      }
    } catch (err) {
      console.error('Goal creation error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to add goal. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = async (e) => {
    e.preventDefault();
    
    if (!editingGoal.title.trim()) {
      setMessage({ type: 'error', text: 'Goal description is required' });
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        user_id: userId,
        goal_id: editingGoal.id,
        action: 'update',
        data: {
          goalText: editingGoal.title.trim(),
          targetValue: editingGoal.targetValue || null,
          unitOfMeasurement: editingGoal.unitOfMeasurement || null
        }
      };

      const response = await secureApiCall(`${backendUrl}/api/goal-update`, {
        method: 'POST',
        body: goalData
      });

      if (response.success !== false) {
        setMessage({ type: 'success', text: 'Goal updated successfully!' });
        setEditingGoal(null);
        await loadGoals(); // Reload goals
      } else {
        throw new Error(response.error || 'Failed to update goal');
      }
    } catch (err) {
      console.error('Goal update error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update goal. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        user_id: userId,
        goal_id: goalId,
        action: 'archive' // Archive instead of delete
      };

      const response = await secureApiCall(`${backendUrl}/api/goal-update`, {
        method: 'POST',
        body: goalData
      });

      if (response.success !== false) {
        setMessage({ type: 'success', text: 'Goal deleted successfully!' });
        await loadGoals(); // Reload goals
      } else {
        throw new Error(response.error || 'Failed to delete goal');
      }
    } catch (err) {
      console.error('Goal deletion error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete goal. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Goals Management</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {showAddForm ? 'Cancel' : 'Add New Goal'}
          </button>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add Goal Form */}
        {showAddForm && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="userInput"
                  value={newGoal.userInput}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g., Increase deadlift to 500lbs, Build morning routine, Learn Spanish..."
                  rows={3}
                  disabled={loading}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Value (Optional)
                  </label>
                  <input
                    type="text"
                    name="targetValue"
                    value={newGoal.targetValue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="e.g., 500, 30, 100"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Unit of Measurement (Optional)
                  </label>
                  <input
                    type="text"
                    name="unitOfMeasurement"
                    value={newGoal.unitOfMeasurement}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="e.g., lbs, days, hours, books"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading || !newGoal.userInput.trim()}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {loading ? 'Adding...' : 'Add Goal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewGoal({ userInput: '', targetValue: '', unitOfMeasurement: '' });
                  }}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {loading && goals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              Loading goals...
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No goals yet</h3>
              <p className="text-gray-500">Create your first goal to start tracking your progress</p>
            </div>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="bg-gray-900 rounded-lg p-6">
                {editingGoal && editingGoal.id === goal.id ? (
                  // Edit Form
                  <form onSubmit={handleEditGoal} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Goal Description <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        name="title"
                        value={editingGoal.title}
                        onChange={(e) => handleInputChange(e, true)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        rows={3}
                        disabled={loading}
                        maxLength={500}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Target Value
                        </label>
                        <input
                          type="text"
                          name="targetValue"
                          value={editingGoal.targetValue || ''}
                          onChange={(e) => handleInputChange(e, true)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Unit of Measurement
                        </label>
                        <input
                          type="text"
                          name="unitOfMeasurement"
                          value={editingGoal.unitOfMeasurement || ''}
                          onChange={(e) => handleInputChange(e, true)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading || !editingGoal.title.trim()}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGoal(null)}
                        disabled={loading}
                        className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // Goal Display
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-gray-400 text-sm mb-2">{goal.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Progress: {Math.round(goal.progress)}%</span>
                          <span>Created: {formatDate(goal.created_at)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            goal.status === 'active' ? 'bg-green-900 text-green-300' :
                            goal.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {goal.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-400 mb-1">
                          {Math.round(goal.progress)}%
                        </div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded text-sm transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded text-sm transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalsManager;