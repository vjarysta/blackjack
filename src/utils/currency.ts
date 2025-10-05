const formatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2
});

export const formatCurrency = (amount: number): string => formatter.format(amount);
