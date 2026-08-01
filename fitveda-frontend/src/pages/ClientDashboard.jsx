import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/ui/NavBar';
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

  const handleNotesChange = (exerciseId, notesText) => {
    setExerciseLogs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || { status: 'COMPLETED' }),
        notes: notesText,
      },
    }));
  };

  const handleSubmitProgress = async () => {
    const logEntries = Object.entries(exerciseLogs);
    if (logEntries.length === 0) return;

    setSubmittingLogs(true);
    setToast(null);

    try {
      for (const [exId, logData] of logEntries) {
        await submitProgress({
          exerciseId: Number(exId),
          status: logData.status,
          notes: logData.notes || 'Logged via client dashboard',
        });
      }

      setToast({ type: 'success', message: `Logged ${logEntries.length} items for today!` });
      setExerciseLogs({});
    } catch (err) {
      console.error('Submit progress failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to submit progress logs';
      setToast({ type: 'error', message: errMsg });
    } finally {
      setSubmittingLogs(false);
    }
  };

  const workouts = activePlan?.exercises?.filter((ex) => ex.type === 'WORKOUT') || [];
  const diets = activePlan?.exercises?.filter((ex) => ex.type === 'DIET') || [];

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <NavBar userName={user?.name || 'Client'} onLogout={logout} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* Toast Alert */}
      {toast && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          color: '#fff',
          backgroundColor: toast.type === 'success' ? '#22C55E' : '#EF4444',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
        <h1 style={{ color: '#1E293B', margin: 0 }}>Welcome Back, {user?.name || 'Client'}! 👋</h1>
        <p style={{ color: '#64748B', marginTop: '0.25rem' }}>Today: {formatDate(getTodayDateString())}</p>
      </header>

      {/* Active Plan Card */}
      {loadingPlan ? (
        <p>Loading your active plan...</p>
      ) : !activePlan ? (
        <div style={{ backgroundColor: '#F8FAFC', border: '1px border-dashed #CBD5E1', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#475569', margin: 0 }}>No Active Plan Assigned</h3>
          <p style={{ color: '#94A3B8', marginTop: '0.5rem' }}>Your trainer hasn't assigned a plan yet. Please check back soon!</p>
        </div>
      ) : (
        <div>
          <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CURRENT ACTIVE PLAN</span>
            <h2 style={{ color: '#1E3A8A', margin: '0.25rem 0 0.5rem' }}>{activePlan.name}</h2>
            <p style={{ color: '#3B82F6', margin: 0, fontSize: '0.9rem' }}>
              Duration: {activePlan.startDate} to {activePlan.endDate}
            </p>
          </div>

          {/* Workout Section */}
          <section style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#334155', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>🏋️ Workout Routine</h3>
            {workouts.length === 0 ? (
              <p style={{ color: '#94A3B8' }}>No workouts scheduled for today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {workouts.map((ex) => {
                  const isChecked = Boolean(exerciseLogs[ex.id]);
                  return (
                    <div
                      key={ex.id}
                      style={{
                        border: '1px solid',
                        borderColor: isChecked ? '#86EFAC' : '#E2E8F0',
                        backgroundColor: isChecked ? '#F0FDF4' : '#fff',
                        borderRadius: '8px',
                        padding: '1rem',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleExercise(ex.id)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                          <div>
                            <h4 style={{ margin: 0, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? '#64748B' : '#0F172A' }}>{ex.name}</h4>
                            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{ex.sets} sets × {ex.reps}</span>
                          </div>
                        </div>
                        <span style={{ padding: '0.25rem 0.6rem', backgroundColor: '#DBEAFE', color: '#1E40AF', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>WORKOUT</span>
                      </div>

                      {isChecked && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #DCFCE7' }}>
                          <input
                            type="text"
                            placeholder="Add optional note (e.g. felt easy, completed all sets)"
                            value={exerciseLogs[ex.id]?.notes || ''}
                            onChange={(e) => handleNotesChange(ex.id, e.target.value)}
                            style={{ width: '100%', padding: '0.4rem', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Diet Section */}
          <section style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#334155', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>🥗 Nutrition & Diet Plan</h3>
            {diets.length === 0 ? (
              <p style={{ color: '#94A3B8' }}>No diet items scheduled for today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {diets.map((ex) => {
                  const isChecked = Boolean(exerciseLogs[ex.id]);
                  return (
                    <div
                      key={ex.id}
                      style={{
                        border: '1px solid',
                        borderColor: isChecked ? '#86EFAC' : '#E2E8F0',
                        backgroundColor: isChecked ? '#F0FDF4' : '#fff',
                        borderRadius: '8px',
                        padding: '1rem',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleExercise(ex.id)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                          <div>
                            <h4 style={{ margin: 0, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? '#64748B' : '#0F172A' }}>{ex.name}</h4>
                            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Portion: {ex.reps}</span>
                          </div>
                        </div>
                        <span style={{ padding: '0.25rem 0.6rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>DIET</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Submit Button */}
          <div style={{ position: 'sticky', bottom: '2rem', textAlign: 'center' }}>
            <button
              onClick={handleSubmitProgress}
              disabled={Object.keys(exerciseLogs).length === 0 || submittingLogs}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: Object.keys(exerciseLogs).length > 0 ? '#16A34A' : '#94A3B8',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: Object.keys(exerciseLogs).length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {submittingLogs
                ? 'Submitting Logs...'
                : Object.keys(exerciseLogs).length > 0
                ? `✔ Log Selected Items (${Object.keys(exerciseLogs).length})`
                : 'Select Exercises to Log Progress'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ClientDashboard;
