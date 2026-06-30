export const formatCurrency = (amount) => {
  return `₵${parseFloat(amount || 0).toFixed(2)}`;
};

export const parseCurrency = (str) => {
  return parseFloat(str.replace(/[₵,]/g, '')) || 0;
};
