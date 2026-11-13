import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';
import type { FetcherWithComponents } from 'react-router';

type SubmissionFetcher = Pick<FetcherWithComponents<unknown>, 'state' | 'data'>;

// Dialog state belongs to the editing session, not to a retained fetcher result.
// Record mutations from the form event, not an intermediate fetcher render:
// concurrent React may discard every submitting/loading render of a fast save.
// GETs, failures and stale results leave the current editing session intact.
export function useSubmissionState<T>(fetcher: SubmissionFetcher, initialValue: T) {
  const [state, setState] = useState(() => ({
    value: initialValue,
    initialValue,
    pending: null as { data: unknown } | null,
  }));

  if (fetcher.state === 'idle' && state.pending !== null && fetcher.data !== state.pending.data) {
    const succeeded =
      typeof fetcher.data === 'object' &&
      fetcher.data !== null &&
      'severity' in fetcher.data &&
      fetcher.data.severity === 'success';

    // A guarded render adjustment updates this hook's owner before commit,
    // without an effect-driven render or setting another component's state.
    setState({
      ...state,
      pending: null,
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

  const onSubmit = useCallback(() => {
    setState((current) => ({ ...current, pending: { data: fetcher.data } }));
  }, [fetcher.data]);

  return [state.value, setValue, onSubmit] as const;
}
