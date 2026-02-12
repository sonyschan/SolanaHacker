import React, { useState, useEffect } from 'react';

const SchedulerStatus = () => {
  const [schedulerData, setSchedulerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchSchedulerStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSchedulerStatus = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/scheduler/status`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scheduler status: ${response.status}`);
      }
      
      const data = await response.json();
      setSchedulerData(data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching scheduler status:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const triggerTask = async (taskName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduler/trigger/${taskName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: `Manual trigger from UI by user`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Task "${taskName}" triggered successfully!`);
        // Refresh status after trigger
        setTimeout(fetchSchedulerStatus, 2000);
      } else {
        alert(`❌ Failed to trigger task: ${result.message}`);
      }
    } catch (err) {
      alert(`❌ Error triggering task: ${err.message}`);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (isRunning) => {
    return isRunning ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (isRunning) => {
    return isRunning ? '🟢' : '🔴';
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg">Loading automation status...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg text-red-400 mb-4">Failed to Load Scheduler Status</div>
          <div className="text-sm text-gray-400 mb-4">{error}</div>
          <button 
            onClick={fetchSchedulerStatus}
            className="px-4 py-2 bg-red-500/20 border border-red-400/50 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="text-2xl font-bold">MemeForge Automation</h3>
              <p className="text-sm text-gray-400">Fully automated meme generation & voting system</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-lg font-bold ${getStatusColor(schedulerData?.running)}`}>
              {getStatusIcon(schedulerData?.running)} {schedulerData?.running ? 'Active' : 'Inactive'}
            </div>
            <div className="text-sm text-gray-400">
              Last update: {formatTime(schedulerData?.lastUpdate)}
            </div>
          </div>
        </div>

        {/* Current Time & Schedule */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="font-bold mb-2 text-cyan-400">🕐 Server Time</h4>
            <div className="text-xl font-mono">{schedulerData?.serverTime ? new Date(schedulerData.serverTime).toLocaleString() : 'Unknown'}</div>
            <div className="text-sm text-gray-400">UTC Timezone</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="font-bold mb-2 text-purple-400">⚙️ System Status</h4>
            <div className="text-xl">{schedulerData?.taskCount || 0} Active Tasks</div>
            <div className="text-sm text-gray-400">Automated processes running</div>
          </div>
        </div>

        {/* Daily Schedule */}
        <div className="bg-white/5 rounded-xl p-6">
          <h4 className="text-xl font-bold mb-4 text-center">📅 Daily Automation Schedule</h4>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-lg p-4">
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-bold text-green-400">08:00 UTC</div>
              <div className="text-sm text-gray-300">Generate Daily Memes</div>
              <div className="text-xs text-gray-500 mt-1">3 AI-generated memes from news</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 rounded-lg p-4">
              <div className="text-2xl mb-2">🗳️</div>
              <div className="font-bold text-blue-400">08:30 UTC</div>
              <div className="text-sm text-gray-300">Start Voting Period</div>
              <div className="text-xs text-gray-500 mt-1">12-hour voting window opens</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-bold text-purple-400">20:00 UTC</div>
              <div className="text-sm text-gray-300">End Voting & Calculate</div>
              <div className="text-xs text-gray-500 mt-1">Determine rarity & trigger NFT mint</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 rounded-lg p-4">
              <div className="text-2xl mb-2">🎰</div>
              <div className="font-bold text-yellow-400">Sun 20:00 UTC</div>
              <div className="text-sm text-gray-300">Weekly Lottery</div>
              <div className="text-xs text-gray-500 mt-1">SOL rewards distribution</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Controls */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">🔧 Manual Controls</h3>
          <p className="text-gray-400 text-sm">
            For testing and debugging - trigger automation tasks manually
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedulerData?.nextScheduledTasks?.map((task, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="mb-3">
                <div className="font-bold">{task.description}</div>
                <div className="text-sm text-gray-400">{task.time}</div>
              </div>
              
              <button
                onClick={() => triggerTask(task.name)}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-sm font-medium hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
              >
                Trigger Now
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-400">
            <span>⚠️</span>
            <span className="text-sm font-medium">Development Mode</span>
          </div>
          <p className="text-xs text-yellow-300 mt-1">
            Manual triggers are for testing. In production, all tasks run automatically.
          </p>
        </div>
      </div>

      {/* System Health */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🚀</div>
          <div className="text-xl font-bold text-green-400">100%</div>
          <div className="text-sm text-gray-400">Uptime</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-xl font-bold text-cyan-400">{schedulerData?.taskCount || 0}</div>
          <div className="text-sm text-gray-400">Active Tasks</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🔄</div>
          <div className="text-xl font-bold text-purple-400">24/7</div>
          <div className="text-sm text-gray-400">Monitoring</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchSchedulerStatus}
          className="px-6 py-3 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
};

export default SchedulerStatus;