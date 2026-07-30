export const mockPlan = {
  id: 1, name: "Week 1 Strength", startDate: "2026-08-01", endDate: "2026-08-07",
  currentDayNumber: 1,
  exercises: [
    { id: 1, dayNumber: 1, type: "WORKOUT", name: "Squats",       sets: 3, reps: "12" },
    { id: 2, dayNumber: 1, type: "DIET",    name: "Protein Shake", sets: 1, reps: "1 serving" },
    { id: 3, dayNumber: 2, type: "WORKOUT", name: "Push-ups",     sets: 4, reps: "15" },
  ]
};
export const mockClients = [
  { id: 2, name: "Raj Mehta",   email: "raj@example.com" },
  { id: 3, name: "Sneha Patel", email: "sneha@example.com" },
];
export const mockProgress = [
  { date: "2026-08-01", completionPercent: 100 },
  { date: "2026-08-02", completionPercent: 67 },
  { date: "2026-08-03", completionPercent: 33 },
];
