const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2
});

export const formatCurrency = (amount: number): string => formatter.format(amount);
