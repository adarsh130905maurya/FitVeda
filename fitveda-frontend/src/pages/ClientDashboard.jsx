import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/ui/NavBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { mockPlan } from '../utils/mockData';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [plan] = useState(mockPlan);
  const [checkedExercises, setCheckedExercises] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);

  // Filter exercises for today (Day 1 for mock data simplicity)
  const todayExercises = plan.exercises.filter((ex) => ex.dayNumber === plan.currentDayNumber);
  
  const workouts = todayExercises.filter((ex) => ex.type === 'WORKOUT');
  const diets = todayExercises.filter((ex) => ex.type === 'DIET');

  const handleToggle = (id) => {
    if (success) return; // Prevent change after logging
    setCheckedExercises(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }, 1200);
  };

  const isAnyChecked = Object.values(checkedExercises).some(val => val === true);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar userName={user?.name || 'Client John'} onLogout={logout} />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{formattedDate}</span>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mt-1">
            Good morning, {user?.name?.split(' ')[0] || 'John'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Day {plan.currentDayNumber} of your {plan.name}
          </p>
        </div>

        {/* Plan Header Card */}
        <Card className="mb-8 border border-blue-500/10 shadow-lg shadow-blue-500/[0.02] relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Active Fitness Plan</span>
              <h2 className="text-xl font-bold text-slate-800 mt-0.5">{plan.name}</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Validity: {plan.startDate} to {plan.endDate}
              </p>
            </div>
            <Badge variant="WORKOUT">Active</Badge>
          </div>
        </Card>

        {/* Exercises / Diets lists */}
        <div className="flex flex-col gap-8">
          {/* Workouts */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Today's Workouts
            </h3>
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
          </div>

          {/* Diets */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707" />
              </svg>
              Diet / Nutrition
            </h3>
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
          </div>

          {/* Submit Button */}
          <div className="mt-4">
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!isAnyChecked || success}
              className={`w-full py-4 text-base font-bold shadow-lg transition-all duration-300 ${
                success 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-500 hover:to-emerald-600 shadow-green-500/10' 
                  : 'shadow-blue-500/10'
              }`}
            >
              {success ? '✓ Daily Progress Logged!' : "Log Today's Progress"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

// ChecklistItem Component
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
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none min-h-[72px]
        ${isChecked 
          ? 'bg-green-50/50 border-green-200/80 shadow-inner' 
          : 'bg-white border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
        }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Animated Custom Checkbox */}
        <div
          className={`h-6 w-6 rounded-lg flex items-center justify-center border transition-all duration-200 flex-shrink-0
            ${isChecked 
              ? 'bg-green-500 border-green-500 text-white scale-105' 
              : 'border-slate-300 bg-slate-50'
            }`}
        >
          {isChecked && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <h4 className={`font-bold transition-all duration-200 ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
            {exercise.name}
          </h4>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
            {exercise.sets} {exercise.type === 'WORKOUT' ? 'sets' : 'servings'} × {exercise.reps}
          </span>
        </div>
      </div>

      <Badge variant={exercise.type === 'WORKOUT' ? 'WORKOUT' : 'DIET'}>
        {exercise.type}
      </Badge>
    </div>
  );
};

export default ClientDashboard;
