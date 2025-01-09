import { FetcherWithComponents } from '@remix-run/react';
import { useCallback, useEffect, useState } from 'react';

import { Field } from '~/components/EditForm';

export function useEditFields(fetcher: FetcherWithComponents<unknown>) {
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fields.length) {
      setFields([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state]);

  const setEditableData = useCallback((fieldsStructure: Field[]) => {
    setFields(fieldsStructure);
  }, []);

  return { fields, setFields, setEditableData };
}
