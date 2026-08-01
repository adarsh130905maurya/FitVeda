import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/ui/NavBar';
import Footer from '../components/ui/Footer';
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
      console.warn('Could not fetch client progress:', err);
      setClientProgressData([
        { date: '2026-08-01', totalExercises: 3, completedCount: 3, completionPercent: 100 },
        { date: '2026-08-02', totalExercises: 4, completedCount: 3, completionPercent: 75 },
      ]);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Exercise row management
  const handleAddExerciseRow = () => {
    setExercises((prev) => [
      ...prev,
      { dayNumber: 1, type: 'WORKOUT', name: '', sets: 3, reps: '10' },
    ]);
  };

  const handleRemoveExerciseRow = (index) => {
    if (exercises.length === 1) return;
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Form submit: Create Plan -> Add Exercises -> Assign Client
  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPlan(true);
    setToast(null);

    try {
      // 1. Create Plan
      const planPayload = {
        name: planForm.name,
        startDate: planForm.startDate,
        endDate: planForm.endDate,
      };

      const planRes = await createPlan(planPayload);
      const newPlanId = planRes.data.id;

      // 2. Add Exercises sequentially
      for (const ex of exercises) {
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
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <NavBar userName={user?.name || 'Trainer'} onLogout={logout} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
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

      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
        <h1 style={{ color: '#1E293B', margin: 0 }}>Trainer Dashboard</h1>
        <p style={{ color: '#64748B', marginTop: '0.25rem' }}>Manage your clients, build workout & diet plans, and track progress</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* LEFT COLUMN: Client List & Progress Panel */}
        <div>
          <section style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#334155' }}>Your Clients</h2>
              <button onClick={fetchClients} style={{ padding: '0.4rem 0.8rem', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Refresh</button>
            </div>

            {loadingClients ? (
              <p style={{ color: '#64748B' }}>Loading clients...</p>
            ) : clients.length === 0 ? (
              <p style={{ color: '#94A3B8' }}>No clients registered yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {clients.map((c) => (
                  <div key={c.id} style={{ backgroundColor: '#fff', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#0F172A' }}>{c.name}</h4>
                      <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{c.email}</span>
                    </div>
                    <button
                      onClick={() => handleViewProgress(c)}
                      style={{ padding: '0.5rem 1rem', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      View Progress
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Client Progress Drawer Details */}
          {selectedClient && (
            <section style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1E40AF' }}>Progress: {selectedClient.name}</h3>
                <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              {loadingProgress ? (
                <p>Loading client analytics...</p>
              ) : clientProgressData.length === 0 ? (
                <p style={{ color: '#64748B' }}>No progress logs recorded yet for this client.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {clientProgressData.map((item, idx) => (
                    <div key={idx} style={{ background: '#fff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{item.date}</strong></span>
                      <span style={{ color: item.completionPercent === 100 ? '#166534' : '#854D0E', fontWeight: 600 }}>
                        {item.completedCount}/{item.totalExercises} Completed ({item.completionPercent}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Multi-Step Plan Creator */}
        <div>
          <section style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem' }}>
            <h2 style={{ marginTop: 0, color: '#1E293B', fontSize: '1.25rem' }}>Create New Fitness & Diet Plan</h2>

            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    textAlign: 'center',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: currentStep === step ? '#2563EB' : '#F1F5F9',
                    color: currentStep === step ? '#fff' : '#64748B',
                  }}
                >
                  Step {step}: {step === 1 ? 'Details' : step === 2 ? 'Exercises' : 'Review'}
                </div>
              ))}
            </div>

            <form onSubmit={handleCreatePlanSubmit}>
              {/* STEP 1: Plan Details */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Plan Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 4-Week Fat Loss & Strength"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Start Date *</label>
                      <input
                        type="date"
                        required
                        value={planForm.startDate}
                        onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>End Date *</label>
                      <input
                        type="date"
                        required
                        value={planForm.endDate}
                        onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Assign Client</label>
                    <select
                      value={planForm.selectedClientId}
                      onChange={(e) => setPlanForm({ ...planForm, selectedClientId: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    >
                      <option value="">Select a client (Optional)</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={!planForm.name || !planForm.startDate || !planForm.endDate}
                    onClick={() => setCurrentStep(2)}
                    style={{ padding: '0.75rem', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Next: Add Exercises →
                  </button>
                </div>
              )}

              {/* STEP 2: Exercises */}
              {currentStep === 2 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>Exercises & Nutrition</h3>
                    <button
                      type="button"
                      onClick={handleAddExerciseRow}
                      style={{ padding: '0.4rem 0.8rem', background: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      + Add Row
                    </button>
                  </div>

                  {exercises.map((ex, index) => (
                    <div key={index} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Exercise #{index + 1}</span>
                        {exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExerciseRow(index)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <select
                          value={ex.type}
                          onChange={(e) => handleExerciseChange(index, 'type', e.target.value)}
                          style={{ padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        >
                          <option value="WORKOUT">WORKOUT</option>
                          <option value="DIET">DIET</option>
                        </select>

                        <input
                          type="number"
                          min="1"
                          placeholder="Day #"
                          value={ex.dayNumber}
                          onChange={(e) => handleExerciseChange(index, 'dayNumber', e.target.value)}
                          style={{ padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Exercise / Meal Name"
                        required
                        value={ex.name}
                        onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginBottom: '0.5rem' }}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          type="number"
                          placeholder="Sets (e.g. 4)"
                          value={ex.sets}
                          onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                          style={{ padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        />
                        <input
                          type="text"
                          placeholder="Reps / Portion (e.g. 12 reps)"
                          value={ex.reps}
                          onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                          style={{ padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        />
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      style={{ flex: 1, padding: '0.75rem', background: '#94A3B8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      style={{ flex: 1, padding: '0.75rem', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Review Plan →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Submit */}
              {currentStep === 3 && (
                <div>
                  <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#334155' }}>Summary Review</h3>
                  
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <p style={{ margin: '0 0 0.25rem' }}><strong>Plan:</strong> {planForm.name}</p>
                    <p style={{ margin: '0 0 0.25rem' }}><strong>Duration:</strong> {planForm.startDate} to {planForm.endDate}</p>
                    <p style={{ margin: 0 }}><strong>Total Items:</strong> {exercises.length} items</p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={submittingPlan}
                      style={{ flex: 1, padding: '0.75rem', background: '#94A3B8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPlan}
                      style={{ flex: 2, padding: '0.75rem', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {submittingPlan ? 'Creating Plan...' : '✔ Create & Assign Plan'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TrainerDashboard;
