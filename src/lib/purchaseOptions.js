import { formatCurrency, parseMoneyValue } from './currency'

export function emptyPurchaseOption() {
  return { label: '', store: '', price: '', url: '', notes: '', selected: false, purchased: false }
}

export function normalizePurchaseOption(option, index = 0) {
  if (typeof option === 'string') {
    return {
      label: '',
      store: '',
      price: '',
      url: option,
      notes: '',
      selected: false,
      purchased: false,
    }
  }

  const price = parseMoneyValue(option?.price ?? option?.estimated_price)

  return {
    label: option?.label || option?.name || option?.model || '',
    store: option?.store || '',
    price: price === null ? '' : formatCurrency(price),
    url: option?.url || '',
    notes: option?.notes || '',
    selected: Boolean(option?.selected || option?.preferred),
    purchased: Boolean(option?.purchased),
  }
}

export function purchaseOptionsFromItem(item) {
  if (!Array.isArray(item?.vendor_links)) return []
  return item.vendor_links.map((option, index) => normalizePurchaseOption(option, index))
}

export function optionHasContent(option) {
  return Boolean(
    option.label?.trim() ||
    option.store?.trim() ||
    option.url?.trim() ||
    option.notes?.trim() ||
    (parseMoneyValue(option.price) || 0) > 0,
  )
}

export function cleanPurchaseOptions(options) {
  let selectedAlreadyUsed = false

  return (options || []).filter(optionHasContent).map((option) => {
    const isSelected = Boolean(option.selected) && !selectedAlreadyUsed
    if (isSelected) selectedAlreadyUsed = true

    return {
      label: option.label?.trim() || '',
      store: option.store?.trim() || '',
      price: parseMoneyValue(option.price),
      url: option.url?.trim() || '',
      notes: option.notes?.trim() || '',
      selected: isSelected,
      purchased: Boolean(option.purchased),
    }
  })
}

export function optionPrice(option) {
  return parseMoneyValue(option?.price) || 0
}

export function selectedOption(item) {
  return purchaseOptionsFromItem(item).find((option) => option.selected && optionPrice(option) > 0)
}

export function lowestOption(item) {
  return purchaseOptionsFromItem(item)
    .filter((option) => optionPrice(option) > 0)
    .sort((a, b) => optionPrice(a) - optionPrice(b))[0]
}

export function itemEstimate(item) {
  const selectedPrice = optionPrice(selectedOption(item))
  return selectedPrice || Number(item.estimated_price) || 0
}

export function hasOptionEstimate(item) {
  return Boolean(selectedOption(item))
}
