import { useAtomValue } from 'jotai';

import type { JSX } from 'react';

import { globalOptionsAtom } from '../../jotai/store.js';
import { PageActions } from './PageActions.js';

export function HeaderPageActions({ pageSlug }: { pageSlug: string }): JSX.Element | null {
  const { hidePageActions } = useAtomValue(globalOptionsAtom);
  if (hidePageActions) return null;
  return <PageActions pageSlug={pageSlug} />;
}
