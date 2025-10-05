const cache = new Map<string, Intl.NumberFormat>()

const getFormatter = (currency: string): Intl.NumberFormat => {
  if (!cache.has(currency)) {
    cache.set(
      currency,
      new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
  }
  return cache.get(currency) as Intl.NumberFormat
}

export const formatCurrency = (amount: number, currency: string = 'EUR'): string =>
  getFormatter(currency).format(amount)
