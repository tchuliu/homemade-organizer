const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

export function parseMoneyValue(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' && /[R$\s,.]/.test(value)) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return 0
    return Number(digits) / 100
  }
  const normalizedValue = typeof value === 'string' ? value.replace(',', '.') : value
  const numberValue = Number(normalizedValue)
  return Number.isFinite(numberValue) ? numberValue : null
}

export function formatCurrencyInput(value) {
  return formatCurrency(parseMoneyValue(value) || 0)
}
