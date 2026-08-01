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
      setActivePlan(response.data);
    } catch (err) {
      console.warn('Backend plan fetch unavailable, using mock plan:', err);
      setActivePlan(mockClientPlan);
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

  const workouts = activePlan?.exercises?.filter((ex) => ex.type === 'WORKOUT') || [];
  const diets = activePlan?.exercises?.filter((ex) => ex.type === 'DIET') || [];

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

          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl self-start sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Day {activePlan?.currentDayNumber || 1}</span>
          </div>
        </div>

        {/* Active Plan Overview */}
        {loadingPlan ? (
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">Loading your personalized active plan...</div>
        ) : !activePlan ? (
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
            
            {/* Plan Info Banner */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900 to-emerald-950/20">
              <div className="absolute top-0 right-0 p-6 text-emerald-500/10 pointer-events-none">
                <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-3">
                ASSIGNED ROUTINE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white m-0 tracking-tight">{activePlan.name}</h2>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Schedule: {activePlan.startDate} to {activePlan.endDate} • Current Routine: <strong>Day {activePlan.currentDayNumber}</strong>
              </p>
            </div>

            {/* Workouts Section */}
            {workouts.length > 0 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-800">
                  <span className="text-2xl">💪</span>
                  <div>
                    <h3 className="text-lg font-bold text-white m-0">Workout Routine ({workouts.length})</h3>
                    <p className="text-xs text-slate-400">Check off exercises as you complete your sets</p>
                  </div>
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
                              <h4 className={`text-base font-bold m-0 transition-colors ${isChecked ? 'text-emerald-400 line-through' : 'text-white'}`}>
                                {ex.name}
                              </h4>
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
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-800">
                  <span className="text-2xl">🥗</span>
                  <div>
                    <h3 className="text-lg font-bold text-white m-0">Diet & Nutrition ({diets.length})</h3>
                    <p className="text-xs text-slate-400">Track your daily meal and supplement goals</p>
                  </div>
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
                              <h4 className={`text-base font-bold m-0 transition-colors ${isChecked ? 'text-emerald-400 line-through' : 'text-white'}`}>
                                {ex.name}
                              </h4>
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

            {/* Bottom Floating Submit Progress Bar */}
            <div className="sticky bottom-6 z-40">
              <button
                onClick={handleSubmitProgress}
                disabled={submittingLogs || Object.keys(exerciseLogs).length === 0}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm shadow-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  Object.keys(exerciseLogs).length > 0
                    ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-600/30 active:scale-[0.99]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                }`}
              >
                {submittingLogs ? (
                  <span>Submitting Today's Log...</span>
                ) : Object.keys(exerciseLogs).length > 0 ? (
                  <span>✔ Submit Progress ({Object.keys(exerciseLogs).length} Items Completed)</span>
                ) : (
                  <span>Check off items above to log daily progress</span>
                )}
              </button>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
