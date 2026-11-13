import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';
import type { FetcherWithComponents } from 'react-router';

type SubmissionFetcher = Pick<FetcherWithComponents<unknown>, 'state' | 'data'>;

// Dialog state belongs to the editing session, not to a retained fetcher result.
// Only a new, successful mutation resets it. GETs, failures and stale results
// leave the draft intact; opening/cancelling starts a new editing session.
export function useSubmissionState<T>(fetcher: SubmissionFetcher, initialValue: T) {
  const [state, setState] = useState(() => ({
    value: initialValue,
    initialValue,
    previousFetcherState: fetcher.state,
    pending: null as { data: unknown } | null,
  }));

  if (fetcher.state !== state.previousFetcherState) {
    const completed = fetcher.state === 'idle' && state.pending !== null;
    const succeeded =
      completed &&
      fetcher.data !== state.pending?.data &&
      typeof fetcher.data === 'object' &&
      fetcher.data !== null &&
      'severity' in fetcher.data &&
      fetcher.data.severity === 'success';

    // A guarded render adjustment updates this hook's owner before commit,
    // without an effect-driven render or setting another component's state.
    setState({
      ...state,
      previousFetcherState: fetcher.state,
      pending: fetcher.state === 'submitting' ? { data: fetcher.data } : completed ? null : state.pending,
      value: succeeded ? state.initialValue : state.value,
    });
  }

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    setState((current) => ({
      ...current,
      value: value instanceof Function ? value(current.value) : value,
      pending: null,
    }));
  }, []);

  return [state.value, setValue] as const;
}
