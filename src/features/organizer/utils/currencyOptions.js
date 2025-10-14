/**
 * Currency Options
 *
 * Centralized currency options for category management.
 * Used across CategoryCreationWizard, CategoryEditWizard, and CategoryManager
 * to ensure consistent currency handling.
 */

/**
 * Currency options with specified ordering
 * Top 5 most common currencies, followed by alphabetical ordering
 */
export const currencyOptions = [
  { title: 'Canadian Dollar (CAD)', value: 'CAD', symbol: '$' },
  { title: 'US Dollar (USD)', value: 'USD', symbol: '$' },
  { title: 'Euro (EUR)', value: 'EUR', symbol: '€' },
  { title: 'Chinese Yuan (CNY)', value: 'CNY', symbol: '¥' },
  { title: 'British Pound (GBP)', value: 'GBP', symbol: '£' },
  // Alphabetical ordering for remaining currencies
  { title: 'Australian Dollar (AUD)', value: 'AUD', symbol: '$' },
  { title: 'Brazilian Real (BRL)', value: 'BRL', symbol: 'R$' },
  { title: 'Indian Rupee (INR)', value: 'INR', symbol: '₹' },
  { title: 'Japanese Yen (JPY)', value: 'JPY', symbol: '¥' },
  { title: 'Korean Won (KRW)', value: 'KRW', symbol: '₩' },
  { title: 'Mexican Peso (MXN)', value: 'MXN', symbol: '$' },
  { title: 'Russian Ruble (RUB)', value: 'RUB', symbol: '₽' },
  { title: 'Singapore Dollar (SGD)', value: 'SGD', symbol: '$' },
  { title: 'South African Rand (ZAR)', value: 'ZAR', symbol: 'R' },
  { title: 'Swiss Franc (CHF)', value: 'CHF', symbol: 'CHF' },
];

/**
 * Get the full title for a currency code
 * @param {string} currencyCode - The currency code (e.g., 'CAD', 'USD')
 * @returns {string} The full currency title (e.g., 'Canadian Dollar (CAD)')
 */
export function getCurrencyTitle(currencyCode) {
  if (!currencyCode) return '';

  const currency = currencyOptions.find((option) => option.value === currencyCode);
  return currency ? currency.title : currencyCode;
}

/**
 * Get the currency symbol for a currency code
 * @param {string} currencyCode - The currency code (e.g., 'CAD', 'USD')
 * @returns {string} The currency symbol (e.g., '$', '€')
 */
export function getCurrencySymbol(currencyCode) {
  if (!currencyCode) return '';

  const currency = currencyOptions.find((option) => option.value === currencyCode);
  return currency ? currency.symbol : currencyCode;
}
