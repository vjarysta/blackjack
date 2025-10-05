const formatters: Record<string, Intl.NumberFormat> = {};

export function formatCurrency(amount: number, currency = "EUR"): string {
  if (!formatters[currency]) {
    formatters[currency] = new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return formatters[currency].format(amount);
}
