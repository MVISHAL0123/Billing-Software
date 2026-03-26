// Get the current business date (from localStorage or today)
export const getCurrentBusinessDate = () => {
  const storedDate = localStorage.getItem('businessDate');
  if (storedDate) {
    const date = new Date(storedDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  localStorage.setItem('businessDate', today.toISOString());
  return today;
};

// Format date for display
export const formatBusinessDate = (date) => {
  if (!date) date = getCurrentBusinessDate();
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get date string for API/database (YYYY-MM-DD)
export const getDateString = (date) => {
  if (!date) date = getCurrentBusinessDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if date is current business day
export const isCurrentBusinessDay = (date) => {
  const businessDate = getCurrentBusinessDate();
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return businessDate.getTime() === checkDate.getTime();
};
