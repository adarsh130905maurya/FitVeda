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

const ProgressChart = ({ clientId, data: initialData }) => {
  const { user } = useAuth();
  const [data, setData] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    if (!clientId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
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
  }, [clientId, user?.userId, initialData]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2">
        <Spinner size="md" color="text-emerald-400" />
        <p className="text-xs text-slate-400 font-semibold animate-pulse">Loading progress chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center p-4 border border-dashed border-red-500/30 bg-red-500/10 rounded-2xl">
        <p className="text-xs font-semibold text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center p-4 border border-dashed border-slate-800 bg-slate-900/50 rounded-2xl text-center">
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
    if (val >= 80) return '#22C55E'; // emerald green
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
        borderColor: '#22C55E', // Emerald Veda Green
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.35)'); // Veda green at 35% opacity
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.00)'); // Fade to transparent
          return gradient;
        },
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: '#0F172A',
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
        display: false
      },
      tooltip: {
        backgroundColor: '#0F172A',
        borderColor: '#1E293B',
        borderWidth: 1,
        titleFont: { size: 12, weight: 'bold', family: 'Plus Jakarta Sans' },
        bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
        padding: 12,
        cornerRadius: 12,
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
          font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
          color: '#94A3B8'
        }
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
          color: '#94A3B8',
          callback: (value) => `${value}%`
        },
        grid: {
          color: '#1E293B'
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
