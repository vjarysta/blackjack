const cache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency: string): string {
  let formatter = cache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    cache.set(currency, formatter);
  }
  return formatter.format(amount);
}
