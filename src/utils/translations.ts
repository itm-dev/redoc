import type { TFunction } from '@redocly/theme/core/openapi';

/** UI text by translation key, e.g. `{ 'openapi.responses': 'Ответы' }`. */
export type Translations = Record<string, string>;

type TranslateOptions = Parameters<TFunction>[1];

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Accepts the `translations` option as given to `init` — an object, or its JSON text when it comes
 * from a `<redoc translations="...">` attribute — and keeps only string values.
 */
export function normalizeTranslations(value: unknown): Translations {
  let raw = value;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return {};
    try {
      raw = JSON.parse(text);
    } catch {
      console.warn('Ignoring "translations": not valid JSON:', value);
      return {};
    }
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    if (raw != null) console.warn('Ignoring "translations": expected an object of strings:', value);
    return {};
  }

  const result: Translations = {};
  for (const [key, text] of Object.entries(raw)) {
    if (typeof text === 'string') result[key] = text;
  }
  return result;
}

function defaultText(options: TranslateOptions): string | undefined {
  if (typeof options === 'string') return options;
  const defaultValue = options?.defaultValue;
  return typeof defaultValue === 'string' ? defaultValue : undefined;
}

function interpolate(text: string, options: TranslateOptions): string {
  if (!options || typeof options === 'string') return text;
  const values = options as Record<string, unknown>;
  return text.replace(PLACEHOLDER, (match, name: string) => {
    const value = values[name];
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * The platform's i18next answers from `translations.yaml`; the standalone has no i18next, so this
 * answers from a flat map the same way: a missing key falls back to the component's built-in
 * default, then to the key itself, and `{{name}}` takes its value from the options.
 */
export function createTranslate(translations: Translations): TFunction {
  return (key, options) => {
    const own = key !== undefined && Object.hasOwn(translations, key) ? translations[key] : undefined;
    return interpolate(own ?? defaultText(options) ?? key ?? '', options);
  };
}

/**
 * `useTranslate` and `useTranslationKeys` for `ThemeDataContext`. Both return the same objects on
 * every call, so components that depend on them do not re-render.
 */
export function createTranslationHooks(translations: Translations): {
  useTranslate: () => { translate: TFunction };
  useTranslationKeys: () => string[];
} {
  const translateHookValue = { translate: createTranslate(translations) };
  const keys = Object.keys(translations);
  return {
    useTranslate: () => translateHookValue,
    useTranslationKeys: () => keys,
  };
}
