import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import dependencies from './app/i18n/locales/en/dependencies.json';
import findings from './app/i18n/locales/en/findings.json';
import insights from './app/i18n/locales/en/insights.json';
import maintenance from './app/i18n/locales/en/maintenance.json';
import modules from './app/i18n/locales/en/modules.json';
import shell from './app/i18n/locales/en/shell.json';
import workspace from './app/i18n/locales/en/workspace.json';

/** English only; the desktop's own init also reads native state and localStorage. */
export function initDemoI18n(): typeof i18n {
  if (i18n.isInitialized) return i18n;
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: { dependencies, findings, insights, maintenance, modules, shell, workspace } } },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}
