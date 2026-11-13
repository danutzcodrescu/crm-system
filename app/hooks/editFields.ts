import { FetcherWithComponents } from 'react-router';

import { Field } from '~/components/EditForm';

import { useSubmissionState } from './submissionState';

export function useEditFields(fetcher: FetcherWithComponents<unknown>) {
  const [fields, setFields] = useSubmissionState<Field[]>(fetcher, []);
  return { fields, setFields, setEditableData: setFields };
}
