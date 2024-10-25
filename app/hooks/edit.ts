import { useNavigation } from '@remix-run/react';
import { useEffect, useState } from 'react';

export function useEditItem() {
  const [isEditing, setEditingState] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === 'idle' && isEditing) {
      setEditingState(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.state]);
  return { isEditing, setEditingState };
}
