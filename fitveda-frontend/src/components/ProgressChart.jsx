import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getClientProgress } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProgressChart = ({ clientId }) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!clientId) return;
      try {
        setLoading(true);
        setError(null);
        // Pass trainerId as query param for Phase 2 dev configuration
        const response = await getClientProgress(clientId, user?.userId);
        if (response.data && Array.isArray(response.data)) {
          setData(response.data);
        } else {
          setData([]);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load progress data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [clientId, user?.userId]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2">
        <Spinner size="md" color="text-blue-600" />
        <p className="text-xs text-slate-400 font-semibold animate-pulse">Loading progress chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center p-4 border border-dashed border-red-100 bg-red-50/50 rounded-2xl">
        <p className="text-xs font-semibold text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center p-4 border border-dashed border-slate-100 bg-slate-50/30 rounded-2xl text-center">
        <p className="text-sm font-semibold text-slate-400">No progress logged yet for this client.</p>
      </div>
    );
  }

  // Format dates: e.g. "2026-08-01" -> "Aug 1"
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const labels = data.map((d) => formatDate(d.date));
  const completionRates = data.map((d) => d.completionPercent);

  // Dynamic point colors based on completion: green >= 80%, amber 50-79%, red < 50%
  const getPointColor = (val) => {
    if (val >= 80) return '#22C55E'; // green
    if (val >= 50) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const pointBackgroundColors = completionRates.map((val) => getPointColor(val));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Completion %',
        data: completionRates,
        borderColor: '#2563EB', // Brand Primary Blue
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)'); // Primary color at 25% opacity
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)'); // Fade to transparent
          return gradient;
        },
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: pointBackgroundColors,
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend to look cleaner
      },
      tooltip: {
        backgroundColor: '#1E293B', // Slate 800 for premium tooltip
        titleFont: { size: 12, weight: 'bold', family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        padding: 12,
        cornerRadius: 12,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const item = data[index];
            return ` ${context.parsed.y}% complete (${item.completedCount}/${item.totalExercises} exercises)`;
          },
          title: (context) => {
            const index = context[0].dataIndex;
            const item = data[index];
            try {
              const date = new Date(item.date);
              return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            } catch (e) {
              return context[0].label;
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { family: 'Inter', size: 10, weight: '500' },
          color: '#64748B' // slate-500
        }
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          font: { family: 'Inter', size: 10, weight: '500' },
          color: '#64748B',
          callback: (value) => `${value}%`
        },
        grid: {
          color: '#F1F5F9' // slate-100
        }
      }
    }
  };

  return (
    <div className="h-64 w-full relative">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ProgressChart;
