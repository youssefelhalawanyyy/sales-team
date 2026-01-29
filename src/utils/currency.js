// Currency formatting utility
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'EGP 0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return 'EGP 0.00';
  
  return `EGP ${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Format number with commas
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0.00';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
