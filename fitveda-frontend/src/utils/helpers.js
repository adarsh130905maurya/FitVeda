// Helper utilities for date formatting and data transformation
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};
