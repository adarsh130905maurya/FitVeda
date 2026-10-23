import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/ui/NavBar';
import Footer from '../components/ui/Footer';
import { getMyPlan, submitProgress } from '../services/api';
import { mockClientPlan } from '../utils/mockData';
import { formatDate, getTodayDateString } from '../utils/helpers';

const ClientDashboard = () => {
  const { user, logout } = useAuth();

  const [activePlan, setActivePlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Track logged status per exercise: { [exerciseId]: { status: 'COMPLETED' | 'MISSED', notes: '' } }
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [submittingLogs, setSubmittingLogs] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch client active plan on mount
  useEffect(() => {
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    setLoadingPlan(true);
    try {
      const response = await getMyPlan();
      const planData = response.data;
      setActivePlan(planData);
      if (planData?.currentDayNumber) {
        setSelectedDay(planData.currentDayNumber);
      } else {
        setSelectedDay(1);
      }
    } catch (err) {
      console.warn('Backend plan fetch unavailable, using mock plan:', err);
      setActivePlan(mockClientPlan);
      setSelectedDay(1);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleToggleExercise = (exerciseId) => {
    setExerciseLogs((prev) => {
      const existing = prev[exerciseId];
      if (existing && existing.status === 'COMPLETED') {
        // Toggle off
        const copy = { ...prev };
        delete copy[exerciseId];
        return copy;
      }
      // Toggle on as COMPLETED
      return {
        ...prev,
        [exerciseId]: { status: 'COMPLETED', notes: '' },
      };
    });
  };

  const handleNotesChange = (exerciseId, notes) => {
    setExerciseLogs((prev) => {
      const existing = prev[exerciseId] || { status: 'COMPLETED', notes: '' };
      return {
        ...prev,
        [exerciseId]: { ...existing, notes },
      };
    });
  };

  const handleSubmitProgress = async () => {
    const logEntries = Object.entries(exerciseLogs);
    if (logEntries.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one exercise or meal item to log.' });
      return;
    }

    setSubmittingLogs(true);
    setToast(null);

    try {
      // Submit each selected exercise log
      for (const [exerciseId, logData] of logEntries) {
        await submitProgress({
          exerciseId: Number(exerciseId),
          status: logData.status,
          notes: logData.notes || '',
        });
      }

      setToast({ type: 'success', message: 'Daily progress logs submitted successfully!' });
    } catch (err) {
      console.error('Failed to submit progress:', err);
      const errMsg = err.response?.data?.error || 'Failed to submit progress log.';
      setToast({ type: 'error', message: errMsg });
    } finally {
      setSubmittingLogs(false);
    }
  };

  // Combine items: prefer allExercises if available, fallback to exercises
  const allPlanItems = activePlan?.allExercises || activePlan?.exercises || [];
  
  // Available days in the plan
  const availableDays = Array.from(
    new Set(allPlanItems.map((item) => item.dayNumber))
  ).sort((a, b) => a - b);

  // If no days found in items, show at least current day
  const currentDay = activePlan?.currentDayNumber || 1;
  const dayPills = availableDays.length > 0 
    ? Array.from(new Set([...availableDays, currentDay])).sort((a, b) => a - b)
    : [currentDay];

  // Filter items for the currently selected day (or all if selectedDay === 'ALL')
  const displayedItems = selectedDay === 'ALL'
    ? allPlanItems
    : allPlanItems.filter((item) => item.dayNumber === selectedDay);

  const workouts = displayedItems.filter((ex) => ex.type === 'WORKOUT');
  const diets = displayedItems.filter((ex) => ex.type === 'DIET');

  // Calculate completion percentage for displayed items
  const completedCount = displayedItems.filter((ex) => exerciseLogs[ex.id]?.status === 'COMPLETED').length;
  const completionPercentage = displayedItems.length > 0 
    ? Math.round((completedCount / displayedItems.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <NavBar userName={user?.name || 'Client'} onLogout={logout} logout={logout} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toast Alert */}
        {toast && (
          <div className={`p-4 mb-6 rounded-2xl text-white font-bold flex justify-between items-center shadow-lg backdrop-blur-md ${
            toast.type === 'success' ? 'bg-emerald-600/90 border border-emerald-500/50' : 'bg-red-600/90 border border-red-500/50'
          }`}>
            <span className="flex items-center gap-2">
              <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{toast.message}</span>
            </span>
            <button onClick={() => setToast(null)} className="text-white hover:text-slate-200 cursor-pointer text-lg font-bold">✕</button>
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">CLIENT WORKOUT DASHBOARD</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              Welcome Back, {user?.name || 'Client'}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Today: {formatDate(getTodayDateString())}</p>
          </div>

          <div className="flex items-center gap-3">
            {activePlan?.id && (
              <button
                onClick={() => setShowPlanModal(true)}
                className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 rounded-2xl text-xs font-bold text-slate-300 transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>📖 Open Active Plan</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Active Day {currentDay}
              </span>
            </div>
          </div>
        </div>

        {/* Active Plan Overview */}
        {loadingPlan ? (
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">Loading your personalized active plan...</div>
        ) : !activePlan?.id ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-800">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-800">
              🏋️‍♂️
            </div>
            <h3 className="text-xl font-bold text-white m-0">No Active Plan Assigned Yet</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
              Your trainer hasn't assigned an active plan for today yet. Please check back soon or ask your trainer to publish your routine!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Plan Info Banner with clickable trigger */}
            <div 
              onClick={() => setShowPlanModal(true)}
              className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900 to-emerald-950/20 cursor-pointer hover:border-emerald-500/60 transition-all group"
            >
              <div className="absolute top-0 right-0 p-6 text-emerald-500/10 group-hover:text-emerald-500/20 transition-all pointer-events-none">
                <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
                  ASSIGNED ROUTINE
                </span>
                <span className="text-xs text-emerald-400/80 font-semibold group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                  View Full Schedule ↗
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white m-0 tracking-tight group-hover:text-emerald-400 transition-colors">
                {activePlan.name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                <span>Schedule: <strong>{activePlan.startDate}</strong> to <strong>{activePlan.endDate}</strong></span>
                <span>•</span>
                <span>Current Routine: <strong className="text-emerald-400">Day {currentDay}</strong></span>
                <span>•</span>
                <span>Total Items: <strong>{allPlanItems.length}</strong></span>
              </div>

              {/* Mini Progress Bar */}
              {displayedItems.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">
                      Day {selectedDay === 'ALL' ? 'All' : selectedDay} Progress
                    </span>
                    <span className="font-bold text-emerald-400">
                      {completedCount} / {displayedItems.length} ({completionPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Day Selector Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Routines:</span>
              {dayPills.map((dayNum) => {
                const isSelected = selectedDay === dayNum;
                const isToday = dayNum === currentDay;
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>Day {dayNum}</span>
                    {isToday && (
                      <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded-md font-extrabold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        Today
                      </span>
                    )}
                  </button>
                );
              })}

              {allPlanItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDay('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedDay === 'ALL'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  View All Days
                </button>
              )}
            </div>

            {/* Empty State for Selected Day */}
            {displayedItems.length === 0 && (
              <div className="glass-card rounded-3xl p-10 text-center border border-slate-800/80">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 border border-slate-800">
                  🏖️
                </div>
                <h3 className="text-lg font-bold text-white m-0">
                  {allPlanItems.length === 0 
                    ? 'No Exercises Added Yet'
                    : `Rest Day for Day ${selectedDay}`
                  }
                </h3>
                <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
                  {allPlanItems.length === 0 
                    ? 'Your trainer has published this plan, but has not added exercise or diet items yet. Please check back shortly!'
                    : `No specific workouts or diet instructions are scheduled for Day ${selectedDay}. Rest, stay hydrated, and recover for your next session!`
                  }
                </p>
                {availableDays.length > 0 && selectedDay !== currentDay && (
                  <button
                    onClick={() => setSelectedDay(currentDay)}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Go to Today's Routine (Day {currentDay})
                  </button>
                )}
              </div>
            )}

            {/* Workouts Section */}
            {workouts.length > 0 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-xl">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💪</span>
                    <div>
                      <h3 className="text-lg font-bold text-white m-0">Workout Routine ({workouts.length})</h3>
                      <p className="text-xs text-slate-400">Check off exercises as you complete your sets</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-slate-900 text-indigo-400 border border-indigo-500/30 rounded-xl">
                    Day {selectedDay === 'ALL' ? 'All' : selectedDay}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {workouts.map((ex) => {
                    const isChecked = exerciseLogs[ex.id]?.status === 'COMPLETED';
                    return (
                      <div 
                        key={ex.id}
                        onClick={() => handleToggleExercise(ex.id)}
                        className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg' 
                            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-1 transition-all ${
                            isChecked 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isChecked && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className={`text-base font-bold m-0 transition-colors ${isChecked ? 'text-emerald-400 line-through' : 'text-white'}`}>
                                  {ex.name}
                                </h4>
                                {selectedDay === 'ALL' && (
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Day {ex.dayNumber}
                                  </span>
                                )}
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                                {ex.sets} sets × {ex.reps}
                              </span>
                            </div>

                            {/* Expandable Notes Input when checked */}
                            {isChecked && (
                              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="Add notes (e.g. 20kg weight used, felt strong)..."
                                  value={exerciseLogs[ex.id]?.notes || ''}
                                  onChange={(e) => handleNotesChange(ex.id, e.target.value)}
                                  className="w-full px-3.5 py-2 bg-slate-950 border border-emerald-500/30 text-slate-100 rounded-xl text-xs outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diet Plan Section */}
            {diets.length > 0 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-xl">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥗</span>
                    <div>
                      <h3 className="text-lg font-bold text-white m-0">Diet & Nutrition ({diets.length})</h3>
                      <p className="text-xs text-slate-400">Track your daily meal and supplement goals</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-slate-900 text-emerald-400 border border-emerald-500/30 rounded-xl">
                    Day {selectedDay === 'ALL' ? 'All' : selectedDay}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {diets.map((ex) => {
                    const isChecked = exerciseLogs[ex.id]?.status === 'COMPLETED';
                    return (
                      <div 
                        key={ex.id}
                        onClick={() => handleToggleExercise(ex.id)}
                        className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg' 
                            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-1 transition-all ${
                            isChecked 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isChecked && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className={`text-base font-bold m-0 transition-colors ${isChecked ? 'text-emerald-400 line-through' : 'text-white'}`}>
                                  {ex.name}
                                </h4>
                                {selectedDay === 'ALL' && (
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Day {ex.dayNumber}
                                  </span>
                                )}
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                                {ex.sets} meal × {ex.reps}
                              </span>
                            </div>

                            {/* Expandable Notes Input when checked */}
                            {isChecked && (
                              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="Add diet notes (e.g. 500ml water added)..."
                                  value={exerciseLogs[ex.id]?.notes || ''}
                                  onChange={(e) => handleNotesChange(ex.id, e.target.value)}
                                  className="w-full px-3.5 py-2 bg-slate-950 border border-emerald-500/30 text-slate-100 rounded-xl text-xs outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Progress Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitProgress}
                disabled={submittingLogs || Object.keys(exerciseLogs).length === 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-base tracking-wide flex items-center justify-center gap-2"
              >
                {submittingLogs ? (
                  <span>Saving Progress...</span>
                ) : Object.keys(exerciseLogs).length > 0 ? (
                  <span>Submit {Object.keys(exerciseLogs).length} Logged Item{Object.keys(exerciseLogs).length > 1 ? 's' : ''}</span>
                ) : (
                  <span>Check off items above to log daily progress</span>
                )}
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Active Plan Detail Modal */}
      {showPlanModal && activePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col relative overflow-hidden">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-2">
                  FULL ACTIVE PLAN
                </span>
                <h3 className="text-2xl font-extrabold text-white m-0">{activePlan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Schedule: <strong>{activePlan.startDate}</strong> to <strong>{activePlan.endDate}</strong> • Current Routine: <strong>Day {currentDay}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {dayPills.map((dayNum) => {
                const dayItems = allPlanItems.filter((item) => item.dayNumber === dayNum);
                const dayWorkouts = dayItems.filter((i) => i.type === 'WORKOUT');
                const dayDiets = dayItems.filter((i) => i.type === 'DIET');

                return (
                  <div key={dayNum} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Day {dayNum}</span>
                        {dayNum === currentDay && (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                            Today's Active Day
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{dayItems.length} items</span>
                    </div>

                    {dayItems.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">Rest & Recovery Day</p>
                    ) : (
                      <div className="space-y-2">
                        {dayWorkouts.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800/80">
                            <span className="text-slate-200 font-semibold flex items-center gap-2">
                              <span>💪</span> {item.name}
                            </span>
                            <span className="text-indigo-400 font-bold">{item.sets} sets × {item.reps}</span>
                          </div>
                        ))}
                        {dayDiets.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800/80">
                            <span className="text-slate-200 font-semibold flex items-center gap-2">
                              <span>🥗</span> {item.name}
                            </span>
                            <span className="text-emerald-400 font-bold">{item.sets} meal × {item.reps}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
              >
                Close Plan
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ClientDashboard;
