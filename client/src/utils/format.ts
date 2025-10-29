import { useSettingsStore } from '@/stores/settingsStore';

export function formatCurrency(amount: number): string {
  const { settings } = useSettingsStore.getState();
  const locale = settings.language === 'id' ? 'id-ID' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${settings.currency} ${amount.toLocaleString(locale)}`;
  }
}

export function formatDate(input: string | number | Date): string {
  const { settings } = useSettingsStore.getState();
  const locale = settings.language === 'id' ? 'id-ID' : 'en-US';
  const date = new Date(input);
  try {
    return date.toLocaleDateString(locale, { timeZone: settings.timezone });
  } catch {
    return date.toLocaleDateString(locale);
  }
}



