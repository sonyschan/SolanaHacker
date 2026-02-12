/**
 * SchedulerStatus Component
 * 
 * 顯示 MemeForge 自動化系統的即時狀態：
 * - 每日梗圖生成狀態
 * - 投票期管理狀態  
 * - 週日開獎狀態
 * - Cloud Scheduler 任務監控
 * - 手動觸發控制 (開發用)
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Zap, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';

const SchedulerStatus = ({ userWallet }) => {
  const [schedulerData, setSchedulerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [triggeringTask, setTriggeringTask] = useState(null);

  // 獲取排程狀態
  const fetchSchedulerStatus = async () => {
    if (!userWallet) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/scheduler/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('memeforge_auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedulerData(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch scheduler status');
      }
    } catch (err) {
      setError(err.message);
      console.error('Scheduler status error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 手動觸發任務 (開發用)
  const triggerTask = async (taskName) => {
    if (!userWallet || triggeringTask) return;

    try {
      setTriggeringTask(taskName);
      
      const response = await fetch(`/api/admin/trigger/${taskName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('memeforge_auth_token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        // 成功觸發，重新獲取狀態
        setTimeout(fetchSchedulerStatus, 1000);
        
        // 顯示成功通知
        showNotification(`✅ ${getTaskDisplayName(taskName)} triggered successfully`, 'success');
      } else {
        throw new Error(result.error || 'Task trigger failed');
      }
      
    } catch (err) {
      showNotification(`❌ Failed to trigger ${getTaskDisplayName(taskName)}: ${err.message}`, 'error');
      console.error('Task trigger error:', err);
    } finally {
      setTriggeringTask(null);
    }
  };

  // 獲取任務顯示名稱
  const getTaskDisplayName = (taskName) => {
    const names = {
      'daily-memes': '每日梗圖生成',
      'check-voting': '投票期檢查',
      'weekly-lottery': '週日開獎'
    };
    return names[taskName] || taskName;
  };

  // 格式化時間顯示
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('zh-TW');
  };

  // 計算下次執行時間
  const getNextRunTime = (schedule) => {
    // 簡化版本，實際需要 cron 解析庫
    const scheduleMap = {
      '0 0 * * *': '每日 00:00 UTC',
      '0 */6 * * *': '每 6 小時',
      '0 20 * * SUN': '每週日 20:00 UTC'
    };
    
    return scheduleMap[schedule] || schedule;
  };

  // 顯示通知
  const showNotification = (message, type) => {
    // 實際部署時可以整合 toast 通知庫
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // 初始載入和定期更新
  useEffect(() => {
    fetchSchedulerStatus();
    
    // 每 30 秒自動更新狀態
    const interval = setInterval(fetchSchedulerStatus, 30000);
    
    return () => clearInterval(interval);
  }, [userWallet]);

  if (!userWallet) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">請先連接錢包以查看排程狀態</span>
        </div>
      </div>
    );
  }

  if (loading && !schedulerData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">載入排程狀態...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">無法載入排程狀態</span>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button 
          onClick={fetchSchedulerStatus}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          重試
        </button>
      </div>
    );
  }

  const jobs = schedulerData?.jobs || [];
  const totalJobs = jobs.length;

  return (
    <div className="space-y-6">
      {/* 系統概覽 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Zap className="h-6 w-6 text-blue-600 mr-2" />
            自動化系統狀態
          </h2>
          <div className="text-sm text-gray-600">
            上次更新: {formatTime(schedulerData?.lastCheck)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-blue-600">{totalJobs}</div>
            <div className="text-gray-600 text-sm">排程任務</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter(j => j.state === 'ENABLED').length}
            </div>
            <div className="text-gray-600 text-sm">運行中</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-orange-600">
              {jobs.filter(j => j.state === 'PAUSED').length}
            </div>
            <div className="text-gray-600 text-sm">暫停中</div>
          </div>
        </div>
      </div>

      {/* 排程任務詳情 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 text-gray-600 mr-2" />
            排程任務列表
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {jobs.map((job, index) => {
            const taskName = job.name;
            const isActive = job.state === 'ENABLED';
            
            return (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Pause className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {getTaskDisplayName(taskName)}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {getNextRunTime(job.schedule)}
                        </div>
                        <div>
                          狀態: <span className={isActive ? 'text-green-600' : 'text-gray-500'}>
                            {isActive ? '運行中' : '暫停'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 手動觸發按鈕 (開發環境) */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={() => triggerTask(getApiTaskName(taskName))}
                      disabled={triggeringTask === getApiTaskName(taskName)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {triggeringTask === getApiTaskName(taskName) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>執行中...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>手動觸發</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* 任務詳細資訊 */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">上次執行:</span>
                    <span className="ml-2 text-gray-900">
                      {formatTime(job.lastRun)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">下次執行:</span>
                    <span className="ml-2 text-gray-900">
                      {formatTime(job.nextRun)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 系統健康度指標 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          系統健康度
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthMetric
            label="梗圖生成"
            value="正常"
            status="good"
            description="每日按時生成新梗圖"
          />
          
          <HealthMetric
            label="投票處理"
            value="正常"
            status="good"
            description="投票統計即時更新"
          />
          
          <HealthMetric
            label="彩票分配"
            value="正常"
            status="good"
            description="自動分配彩票獎勵"
          />
          
          <HealthMetric
            label="開獎機制"
            value="待測試"
            status="warning"
            description="週日開獎功能"
          />
        </div>
      </div>

      {/* 重新整理按鈕 */}
      <div className="flex justify-center">
        <button
          onClick={fetchSchedulerStatus}
          disabled={loading}
          className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>更新中...</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" />
              <span>重新整理狀態</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// 健康度指標組件
const HealthMetric = ({ label, value, status, description }) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200'
  };

  const statusIcons = {
    good: <CheckCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        {statusIcons[status]}
      </div>
      
      <div className="text-lg font-bold mb-1">{value}</div>
      <div className="text-xs opacity-75">{description}</div>
    </div>
  );
};

// API 任務名稱映射
const getApiTaskName = (displayName) => {
  const apiNames = {
    '每日梗圖生成': 'daily-memes',
    '投票期檢查': 'check-voting',
    '週日開獎': 'weekly-lottery'
  };
  return apiNames[displayName] || displayName;
};

export default SchedulerStatus;