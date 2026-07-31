// Initial mock data structures for dev testing prior to backend integration

export const mockTrainerClients = [
  { id: 101, name: 'Rahul Sharma', email: 'rahul@example.com', activePlan: '12-Week Lean Bulk' },
  { id: 102, name: 'Ananya Verma', email: 'ananya@example.com', activePlan: 'Fat Loss Protocol' },
];

export const mockClientPlan = {
  id: 1,
  name: '12-Week Lean Bulk',
  startDate: '2026-07-01',
  endDate: '2026-09-30',
  exercises: [
    { id: 1, dayNumber: 1, type: 'WORKOUT', name: 'Barbell Bench Press', sets: 4, reps: '10-12' },
    { id: 2, dayNumber: 1, type: 'WORKOUT', name: 'Incline Dumbbell Fly', sets: 3, reps: '12' },
    { id: 3, dayNumber: 1, type: 'DIET', name: 'Post-workout Whey Protein + Oatmeal', sets: 1, reps: '1 serving' },
  ],
};
