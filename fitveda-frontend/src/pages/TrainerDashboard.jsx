import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/ui/NavBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { mockClients, mockPlan } from '../utils/mockData';

const TrainerDashboard = () => {
  const { user, logout } = useAuth();
  const [clients] = useState(mockClients);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  
  // Plan form state
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [exercises, setExercises] = useState([
    { dayNumber: 1, type: 'WORKOUT', name: '', sets: 3, reps: '10' }
  ]);

  const handleAddExerciseRow = () => {
    setExercises([...exercises, { dayNumber: 1, type: 'WORKOUT', name: '', sets: 3, reps: '10' }]);
  };

  const handleRemoveExerciseRow = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleCreatePlanSubmit = (e) => {
    e.preventDefault();
    alert('Plan created successfully (Mock)!');
    setShowCreatePlan(false);
    setPlanName('');
    setStartDate('');
    setEndDate('');
    setSelectedClientId('');
    setExercises([{ dayNumber: 1, type: 'WORKOUT', name: '', sets: 3, reps: '10' }]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar userName={user?.name || 'Trainer Pari'} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Trainer Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your clients, design plans, and track progress analytics.</p>
          </div>
          <Button onClick={() => setShowCreatePlan(!showCreatePlan)} variant={showCreatePlan ? 'secondary' : 'primary'}>
            {showCreatePlan ? 'Cancel' : 'Create Workout Plan'}
          </Button>
        </div>

        {showCreatePlan ? (
          <Card className="mb-8 border border-slate-100/50 shadow-lg animate-slide-down">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Fitness & Diet Plan</h2>
            <form onSubmit={handleCreatePlanSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. 12-Week Lean Bulk"
                    className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client Assignment</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-primary outline-none bg-white"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Exercises & Meals</h3>
                  <Button type="button" onClick={handleAddExerciseRow} variant="secondary" className="py-2 px-4 text-xs">
                    + Add Row
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {exercises.map((ex, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-slate-50 rounded-xl items-end border border-slate-100">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium">Day Number</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={ex.dayNumber}
                          onChange={(e) => handleExerciseChange(index, 'dayNumber', parseInt(e.target.value))}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium">Type</label>
                        <select
                          value={ex.type}
                          onChange={(e) => handleExerciseChange(index, 'type', e.target.value)}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                          <option value="WORKOUT">Workout</option>
                          <option value="DIET">Diet / Meal</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs text-slate-500 font-medium">Name / Description</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Barbell Squats or 3 Scrambled Eggs"
                          value={ex.name}
                          onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium">Sets / Quantities</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={ex.sets}
                          onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-xs text-slate-500 font-medium">Reps / Serving</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 10 reps or 1 plate"
                            value={ex.reps}
                            onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                        </div>
                        {exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExerciseRow(index)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" onClick={() => setShowCreatePlan(false)} variant="secondary">
                  Cancel
                </Button>
                <Button type="submit">
                  Save and Assign Plan
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Assigned Clients</h2>
            {clients.length === 0 ? (
              <Card className="text-center py-12 border-dashed border-2">
                <p className="text-slate-400 font-medium">No clients registered under your trainer profile yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clients.map((client) => (
                  <Card key={client.id} hoverEffect className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm shadow-inner">
                          {client.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{client.name}</h3>
                          <p className="text-xs text-slate-400 font-semibold">{client.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="WORKOUT">Active Plan: Week 1</Badge>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedClient(client)} variant="secondary" className="w-full text-xs py-2">
                      View Progress Chart
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Progress Analytics panel (Mock layout) */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Analytics Panel</h2>
            {selectedClient ? (
              <Card className="border-blue-100 shadow-lg shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{selectedClient.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold">Weekly Completion Metrics</p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress Indicators */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Total Exercises Completed</span>
                      <span className="text-green-600">83%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full" style={{ width: '83%' }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Diet Plan Adherence</span>
                      <span className="text-blue-600">100%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daily Progress History</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-slate-500">Wednesday, 29 Jul</span>
                        <Badge variant="COMPLETED">100%</Badge>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-slate-500">Tuesday, 28 Jul</span>
                        <Badge variant="COMPLETED">67%</Badge>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-slate-500">Monday, 27 Jul</span>
                        <Badge variant="MISSED">33%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-12 border-dashed border-2">
                <p className="text-slate-400 font-medium">Select a client card to view completion analytics.</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainerDashboard;
