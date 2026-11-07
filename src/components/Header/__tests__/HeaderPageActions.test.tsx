import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';

import type { RawApiDocsOptions } from '../../../types/options.js';

import { globalStoreAtom } from '../../../jotai/store.js';
import { normalizeOptions } from '../../../options/normalizeOptions.js';
import { HeaderPageActions } from '../HeaderPageActions.js';

vi.mock('../../../hooks/useCopySpecSlice.js', () => ({
  useCopySpecSlice: () => ({
    getText: async () => 'openapi: 3.1.0\n',
    contentKind: 'yaml',
    scope: { kind: 'document' },
    specUrl: 'https://api.example.com/openapi.yaml',
  }),
}));

function renderHeaderPageActions(options: Partial<RawApiDocsOptions> = {}) {
  const store = createStore();
  store.set(globalStoreAtom, {
    items: [],
    store: { schemaStore: {}, exampleStore: {}, securitySchemeStore: {} },
    options: normalizeOptions({
      specType: 'openapi',
      downloadUrls: [],
      metadata: {},
      basePath: '',
      ...options,
    } as RawApiDocsOptions),
  });

  return render(
    <JotaiProvider store={store}>
      <HeaderPageActions pageSlug="pets" />
    </JotaiProvider>,
  );
}

describe('HeaderPageActions', () => {
  it('shows the page actions by default', () => {
    renderHeaderPageActions();

    expect(screen.getByTestId('page-actions')).toBeInTheDocument();
  });

  it.each([true, 'true'])('hides the page actions with hidePageActions: %j', (hidePageActions) => {
    renderHeaderPageActions({ hidePageActions } as Partial<RawApiDocsOptions>);

    expect(screen.queryByTestId('page-actions')).not.toBeInTheDocument();
  });
});
