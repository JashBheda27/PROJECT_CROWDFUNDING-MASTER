export const daysLeft = (deadline) => {
  const deadlineTime = Number(deadline) * 1000; // 🔥 blockchain gives seconds
  const currentTime = Date.now();

  const remainingTime = deadlineTime - currentTime;

  const days = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0; // prevent -1
};

export const calculateBarPercentage = (goal, raisedAmount) => {
  if (!goal) return 0;

  const percentage = Number((raisedAmount * 100n) / goal);

  return percentage;
};

export const checkIfImage = (url, callback) => {
  const img = new Image();
  img.src = url;

  if (img.complete) callback(true);

  img.onload = () => callback(true);
  img.onerror = () => callback(false);
};
