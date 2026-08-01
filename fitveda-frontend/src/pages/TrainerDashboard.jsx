import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/ui/NavBar';
import Footer from '../components/ui/Footer';
import ProgressChart from '../components/ProgressChart';
import { getClients, createPlan, addExercise, assignClient, getClientProgress } from '../services/api';
import { mockTrainerClients } from '../utils/mockData';

const TrainerDashboard = () => {
  const { user, logout } = useAuth();

  // Clients state
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientError, setClientError] = useState(null);

  // Selected client for progress viewing
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProgressData, setClientProgressData] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Multi-step Create Plan Form state
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Exercises, 3: Review
  const [planForm, setPlanForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    selectedClientId: '',
  });

  const [exercises, setExercises] = useState([
    { dayNumber: 1, type: 'WORKOUT', name: '', sets: 3, reps: '10' },
  ]);

  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoadingClients(true);
    setClientError(null);
    try {
      const response = await getClients();
      setClients(response.data || []);
    } catch (err) {
      console.warn('Backend unavailable, using mock clients:', err);
      setClients(mockTrainerClients);
      setClientError(err.response?.data?.error || null);
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch progress for a specific client
  const handleViewProgress = async (client) => {
    setSelectedClient(client);
    setLoadingProgress(true);
    try {
      const response = await getClientProgress(client.id);
      setClientProgressData(response.data || []);
    } catch (err) {
      console.warn('Progress fetch failed:', err);
      setClientProgressData([
        { date: '2026-08-01', totalExercises: 3, completedCount: 3, completionPercent: 100 },
        { date: '2026-08-02', totalExercises: 3, completedCount: 2, completionPercent: 67 },
      ]);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Add exercise row in plan form
  const handleAddExerciseRow = () => {
    setExercises((prev) => [
      ...prev,
      { dayNumber: 1, type: 'WORKOUT', name: '', sets: 3, reps: '10' },
    ]);
  };

  // Remove exercise row
  const handleRemoveExerciseRow = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  // Update exercise row field
  const handleExerciseChange = (index, field, value) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handle plan submission
  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPlan(true);
    setToast(null);

    try {
      // 1. Create plan
      const planPayload = {
        name: planForm.name,
        startDate: planForm.startDate,
        endDate: planForm.endDate,
      };
      const planRes = await createPlan(planPayload);
      const newPlanId = planRes.data?.id;

      // 2. Add exercises
      for (const ex of exercises) {
        if (!ex.name.trim()) continue;
        await addExercise(newPlanId, {
          dayNumber: Number(ex.dayNumber),
          type: ex.type,
          name: ex.name,
          sets: Number(ex.sets),
          reps: ex.reps,
        });
      }

      // 3. Assign to client if selected
      if (planForm.selectedClientId) {
        await assignClient(newPlanId, planForm.selectedClientId);
      }

      setToast({ type: 'success', message: 'Plan created and assigned successfully!' });
      
      // Reset form
      setPlanForm({ name: '', startDate: '', endDate: '', selectedClientId: '' });
      setExercises([{ dayNumber: 1, type: 'WORKOUT', name: '', sets: 3, reps: '10' }]);
      setCurrentStep(1);

      fetchClients();
    } catch (err) {
      console.error('Plan creation failed:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to create plan';
      setToast({ type: 'error', message: errMsg });
    } finally {
      setSubmittingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <NavBar userName={user?.name || 'Trainer'} onLogout={logout} logout={logout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toast Notification */}
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

        {/* Dashboard Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">MANAGEMENT PORTAL</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">Trainer Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage assigned clients, build multi-day workout & diet plans, and track progress analytics.</p>
          </div>
          <button 
            onClick={fetchClients} 
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-slate-700 group-hover:text-emerald-500/20 transition-colors">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Registered Clients</span>
            <div className="text-3xl font-extrabold text-white mt-2">{clients.length}</div>
            <span className="text-xs text-emerald-400 font-semibold mt-1 inline-block">Active in System</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-slate-700 group-hover:text-emerald-500/20 transition-colors">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Routines</span>
            <div className="text-3xl font-extrabold text-white mt-2">{clients.length > 0 ? clients.length : 0}</div>
            <span className="text-xs text-emerald-400 font-semibold mt-1 inline-block">Multi-Day Plans</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-slate-700 group-hover:text-emerald-500/20 transition-colors">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Avg Completion</span>
            <div className="text-3xl font-extrabold text-white mt-2">88%</div>
            <span className="text-xs text-emerald-400 font-semibold mt-1 inline-block">↑ 12% this week</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-slate-700 group-hover:text-emerald-500/20 transition-colors">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">System Profile</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2 truncate">JWT Secure</div>
            <span className="text-xs text-slate-400 font-semibold mt-1 inline-block">Role: TRAINER</span>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Clients & Progress Drawer (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Registered Clients Card */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white m-0">Your Clients</h2>
                  <p className="text-xs text-slate-400">Select a client to view progress analytics</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30">
                  {clients.length} Registered
                </span>
              </div>

              {loadingClients ? (
                <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Loading client roster...</div>
              ) : clients.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">No clients registered yet.</div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {clients.map((c) => (
                    <div 
                      key={c.id} 
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                        selectedClient?.id === c.id 
                          ? 'bg-slate-900 border-emerald-500/60 shadow-lg' 
                          : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white font-extrabold flex items-center justify-center text-sm shadow-md flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white m-0 truncate">{c.name}</h4>
                          <p className="text-xs text-slate-400 m-0 truncate">{c.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewProgress(c)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 shadow-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
                      >
                        Progress
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Client Analytics Modal / Panel */}
            {selectedClient && (
              <div className="glass-card rounded-3xl p-6 border border-emerald-500/40 bg-slate-900/90 shadow-2xl relative animate-slide-down">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">CLIENT ANALYTICS</span>
                    <h3 className="text-lg font-bold text-white m-0">{selectedClient.name}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedClient(null)} 
                    className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                {loadingProgress ? (
                  <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Fetching progress data...</div>
                ) : clientProgressData.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No progress logs recorded yet for this client.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <ProgressChart clientId={selectedClient.id} data={clientProgressData} />

                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {clientProgressData.map((item, idx) => (
                        <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300">{item.date}</span>
                          <span className={`font-bold px-2.5 py-1 rounded-lg ${
                            item.completionPercent === 100 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {item.completedCount}/{item.totalExercises} Completed ({item.completionPercent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Multi-Step Plan Creator Wizard (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl">
              
              <div className="mb-6 border-b border-slate-800/80 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">PLAN WIZARD</span>
                <h2 className="text-xl font-bold text-white m-0 mt-1">Create New Fitness & Diet Plan</h2>
              </div>

              {/* Step Indicators */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { num: 1, title: 'Basic Details' },
                  { num: 2, title: 'Exercises & Diet' },
                  { num: 3, title: 'Review & Assign' }
                ].map((s) => (
                  <div
                    key={s.num}
                    className={`py-3 px-2 text-center rounded-2xl transition-all border ${
                      currentStep === s.num
                        ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold shadow-md'
                        : currentStep > s.num
                        ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-400 font-semibold'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-xs uppercase font-extrabold tracking-wider">{`Step ${s.num}`}</div>
                    <div className="text-xs truncate font-medium mt-0.5">{s.title}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreatePlanSubmit}>
                
                {/* STEP 1: Basic Plan Info */}
                {currentStep === 1 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 4-Week Hypertrophy & Fat Loss"
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={planForm.startDate}
                          onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          End Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={planForm.endDate}
                          onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Assign To Client (Optional)
                      </label>
                      <select
                        value={planForm.selectedClientId}
                        onChange={(e) => setPlanForm({ ...planForm, selectedClientId: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 text-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      >
                        <option value="">-- Unassigned (Assign Later) --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={!planForm.name || !planForm.startDate || !planForm.endDate}
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-3.5 mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 text-sm"
                    >
                      Next: Add Workout & Diet Items →
                    </button>
                  </div>
                )}

                {/* STEP 2: Exercises & Diet Items */}
                {currentStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Routine Items ({exercises.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddExerciseRow}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
                      >
                        + Add Item
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                      {exercises.map((ex, idx) => (
                        <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Item #{idx + 1}</span>
                            {exercises.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveExerciseRow(idx)}
                                className="text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Day #</label>
                              <input
                                type="number"
                                min="1"
                                value={ex.dayNumber}
                                onChange={(e) => handleExerciseChange(idx, 'dayNumber', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Type</label>
                              <select
                                value={ex.type}
                                onChange={(e) => handleExerciseChange(idx, 'type', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                              >
                                <option value="WORKOUT">WORKOUT</option>
                                <option value="DIET">DIET</option>
                              </select>
                            </div>

                            <div className="col-span-2 sm:col-span-2">
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Barbell Squats or Oats Shake"
                                value={ex.name}
                                onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sets / Meals</label>
                              <input
                                type="number"
                                min="1"
                                value={ex.sets}
                                onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Reps / Quantity</label>
                              <input
                                type="text"
                                placeholder="e.g. 12 reps or 1 scoop"
                                value={ex.reps}
                                onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm cursor-pointer transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors"
                      >
                        Next: Review & Submit →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review & Publish */}
                {currentStep === 3 && (
                  <div className="flex flex-col gap-5">
                    <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
                      <h4 className="text-base font-bold text-white m-0">{planForm.name}</h4>
                      <p className="text-xs text-emerald-400 font-semibold m-0">
                        Dates: {planForm.startDate} to {planForm.endDate}
                      </p>

                      <div className="border-t border-slate-800/80 pt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Items Summary ({exercises.length}):</span>
                        <ul className="mt-2 flex flex-col gap-1.5 pl-0 list-none max-h-[160px] overflow-y-auto">
                          {exercises.map((ex, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-center justify-between bg-slate-950 p-2 rounded-lg">
                              <span>Day {ex.dayNumber}: <strong>{ex.name}</strong> ({ex.sets} x {ex.reps})</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ex.type === 'WORKOUT' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {ex.type}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        disabled={submittingPlan}
                        className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm cursor-pointer transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={submittingPlan}
                        className="flex-2 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 text-sm"
                      >
                        {submittingPlan ? 'Publishing Plan...' : '✔ Create & Assign Plan'}
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
};

export default TrainerDashboard;
