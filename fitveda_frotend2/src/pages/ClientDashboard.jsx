import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/ui/NavBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Toast from '../components/ui/Toast';
import { getMyPlan, submitProgress } from '../services/api';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [plan, setPlan] = useState(null);
  const [checkedExercises, setCheckedExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [cooldown, setCooldown] = useState(0);
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getLocalDateString = () => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();

  // Handle global toasts (e.g. 429 rate limits)
  useEffect(() => {
    const handleGlobalToast = (e) => {
      setToast(e.detail);
    };
    window.addEventListener('fitveda-toast', handleGlobalToast);
    return () => window.removeEventListener('fitveda-toast', handleGlobalToast);
  }, []);

  // Handle 10-second button cooldown on rate limit
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Fetch plan on mount
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const response = await getMyPlan(user?.userId);
        if (response.data && response.data.id) {
          setPlan(response.data);
          
          // Restore checked state from localStorage if available for today
          const cached = localStorage.getItem(`fitveda_progress_${user?.userId}_${todayStr}`);
          if (cached) {
            setCheckedExercises(JSON.parse(cached));
          }
        } else {
          setPlan(null);
        }
      } catch (err) {
        setToast({
          message: err.response?.data?.error || 'Failed to fetch your active fitness plan.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchPlan();
    }
  }, [user?.userId, todayStr]);

  const handleToggle = (id) => {
    const updated = {
      ...checkedExercises,
      [id]: !checkedExercises[id]
    };
    setCheckedExercises(updated);
    
    // Cache to localStorage
    localStorage.setItem(`fitveda_progress_${user?.userId}_${todayStr}`, JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!plan || plan.exercises.length === 0) return;
    
    setSubmitting(true);
    try {
      // Send progress logs for all today's exercises
      const logPromises = plan.exercises.map((ex) => {
        const isChecked = !!checkedExercises[ex.id];
        return submitProgress({
          exerciseId: ex.id,
          status: isChecked ? 'COMPLETED' : 'MISSED',
          notes: isChecked ? 'Logged completed via client checklist' : 'Missed exercise'
        }, user?.userId);
      });

      await Promise.all(logPromises);

      setToast({
        message: 'Successfully logged today\'s progress!',
        type: 'success'
      });
    } catch (err) {
      if (err.response?.status === 429) {
        setCooldown(10);
      }
      setToast({
        message: err.response?.data?.error || 'Failed to log progress. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar userName={user?.name || 'Client'} onLogout={logout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center flex flex-col gap-3">
            <Spinner size="lg" color="text-blue-600" />
            <p className="text-slate-500 font-semibold animate-pulse text-sm">Loading your daily plan...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate day number dynamically
  const getDayNumber = () => {
    if (!plan || !plan.startDate) return 1;
    const start = new Date(plan.startDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const dayNumber = getDayNumber();
  const workouts = plan?.exercises?.filter((ex) => ex.type === 'WORKOUT') || [];
  const diets = plan?.exercises?.filter((ex) => ex.type === 'DIET') || [];
  const isAnyChecked = Object.values(checkedExercises).some((val) => val === true);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar userName={user?.name || 'Client'} onLogout={logout} />
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Container: Centered max-width layout for desktop, comfortable padding */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {!plan ? (
          /* Empty State Layout */
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 animate-slide-down">
            <div className="h-40 w-40 mb-6 text-slate-300">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">No Active Plan</h2>
            <p className="text-slate-500 mt-2 max-w-md font-medium text-sm leading-relaxed">
              Your trainer hasn't assigned a workout or diet plan to you for this period yet. Check back later or contact your coach.
            </p>
          </div>
        ) : (
          /* Active Client Dashboard Layout */
          <div className="animate-slide-down">
            {/* Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{formattedDate}</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mt-1">
                  Good morning, {user?.name?.split(' ')[0] || 'Client'}
                </h1>
                <p className="text-slate-500 mt-0.5 font-semibold text-sm">
                  Day {dayNumber} of your fitness program
                </p>
              </div>
              <Badge variant="WORKOUT" className="self-start sm:self-auto py-2 px-3 text-xs shadow-sm bg-blue-50/50 border-blue-200">
                Active Plan
              </Badge>
            </div>

            {/* Plan Title Card */}
            <Card className="mb-8 border border-blue-500/10 shadow-md shadow-blue-500/[0.01] relative overflow-hidden bg-gradient-to-br from-white to-slate-50/30">
              <div className="absolute top-0 right-0 h-24 w-24 bg-blue-50/30 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="relative">
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/50">Plan Details</span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-3">{plan.name}</h2>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  Plan Duration: {plan.startDate} to {plan.endDate}
                </p>
              </div>
            </Card>

            {/* Two-Column Responsive Exercise Layout (Stacked on Mobile, 2-Col on Tablet/Desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Workout Checklist Column */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Today's Workouts ({workouts.length})
                </h3>
                {workouts.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium italic p-2">No exercises scheduled for today.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {workouts.map((ex) => (
                      <ChecklistItem
                        key={ex.id}
                        exercise={ex}
                        isChecked={!!checkedExercises[ex.id]}
                        onToggle={() => handleToggle(ex.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Diet Checklist Column */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707" />
                  </svg>
                  Diet & Nutrition ({diets.length})
                </h3>
                {diets.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium italic p-2">No nutritional plan set for today.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {diets.map((ex) => (
                      <ChecklistItem
                        key={ex.id}
                        exercise={ex}
                        isChecked={!!checkedExercises[ex.id]}
                        onToggle={() => handleToggle(ex.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Log Progress Action Button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!isAnyChecked || submitting || cooldown > 0}
                className="w-full py-4 text-base font-bold shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                {cooldown > 0 ? `Please wait (${cooldown}s)` : "Log Today's Progress"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ChecklistItem Component (Task 2.10 - Premium checkbox layout and accessibility)
const ChecklistItem = ({ exercise, isChecked, onToggle }) => {
  return (
    <div
      role="checkbox"
      aria-checked={isChecked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`flex items-center justify-between p-4 rounded-2xl border select-none min-h-[72px] transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20
        ${isChecked 
          ? 'bg-green-50/30 border-green-200/80 shadow-sm' 
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
        }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Animated Custom Checkbox */}
        <div
          className={`h-6 w-6 rounded-lg flex items-center justify-center border transition-all duration-200 flex-shrink-0
            ${isChecked 
              ? 'bg-green-500 border-green-500 text-white scale-105 shadow-md shadow-green-500/20' 
              : 'border-slate-300 bg-slate-50'
            }`}
        >
          {isChecked && (
            <svg className="h-4 w-4 animate-scale-up" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <h4 className={`font-bold text-sm transition-all duration-200 ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
            {exercise.name}
          </h4>
          <span className="text-xs text-slate-400 font-semibold tracking-wide mt-0.5 block">
            {exercise.sets} {exercise.type === 'WORKOUT' ? 'sets' : 'servings'} × {exercise.reps}
          </span>
        </div>
      </div>

      <Badge variant={exercise.type === 'WORKOUT' ? 'WORKOUT' : 'DIET'} className="text-[10px] py-1 px-2.5">
        {exercise.type}
      </Badge>
    </div>
  );
};

export default ClientDashboard;
