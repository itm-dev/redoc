import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createTranslate,
  createTranslationHooks,
  normalizeTranslations,
} from '../translations.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizeTranslations', () => {
  it('keeps the string values of an object', () => {
    expect(normalizeTranslations({ responses: 'Ответы', count: 3, empty: '' })).toEqual({
      responses: 'Ответы',
      empty: '',
    });
  });

  it('parses the JSON text of a <redoc translations> attribute', () => {
    expect(normalizeTranslations(' {"responses":"Ответы"} ')).toEqual({ responses: 'Ответы' });
  });

  it('ignores text that is not JSON and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(normalizeTranslations('responses: Ответы')).toEqual({});
    expect(warn).toHaveBeenCalledOnce();
  });

  it.each([undefined, null, ''])('returns nothing for %j without a warning', (value) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(normalizeTranslations(value)).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([['an array', ['Ответы']], ['a number', 42], ['a JSON array', '["Ответы"]']])(
    'ignores %s and warns',
    (_, value) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(normalizeTranslations(value)).toEqual({});
      expect(warn).toHaveBeenCalledOnce();
    },
  );
});

describe('createTranslate', () => {
  const translate = createTranslate({
    responses: 'Ответы',
    'search.showMore': 'Ещё {{count}}',
    blank: '',
  });

  it('returns the translation of a known key', () => {
    expect(translate('responses', 'Responses')).toBe('Ответы');
    expect(translate('responses', { defaultValue: 'Responses' })).toBe('Ответы');
  });

  it('keeps an empty translation instead of falling back to the default', () => {
    expect(translate('blank', 'Blank')).toBe('');
  });

  it('falls back to the default text, then to the key', () => {
    expect(translate('request', 'Request')).toBe('Request');
    expect(translate('request', { defaultValue: 'Request' })).toBe('Request');
    expect(translate('request')).toBe('request');
    expect(translate(undefined)).toBe('');
  });

  it('does not treat inherited object properties as translations', () => {
    expect(translate('toString', 'To string')).toBe('To string');
  });

  it('fills {{name}} from the options and leaves unknown placeholders as they are', () => {
    expect(translate('search.showMore', { count: 4 })).toBe('Ещё 4');
    expect(translate('search.showMore')).toBe('Ещё {{count}}');
    expect(translate('missing', { defaultValue: '{{count}} more', count: 2 })).toBe('2 more');
  });
});

describe('createTranslationHooks', () => {
  it('returns the same values on every call', () => {
    const hooks = createTranslationHooks({ responses: 'Ответы' });

    expect(hooks.useTranslate()).toBe(hooks.useTranslate());
    expect(hooks.useTranslationKeys()).toBe(hooks.useTranslationKeys());
    expect(hooks.useTranslationKeys()).toEqual(['responses']);
    expect(hooks.useTranslate().translate('responses', 'Responses')).toBe('Ответы');
  });
});
