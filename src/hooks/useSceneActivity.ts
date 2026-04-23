import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { perfMark, useRenderDiagnostics } from '../lib/perfDiagnostics';

export function useSceneActivity(name: string): boolean {
  const [active, setActive] = useState(false);

  useRenderDiagnostics(name);

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      perfMark(`scene:${name}:focus`);

      return () => {
        setActive(false);
        perfMark(`scene:${name}:blur`);
      };
    }, [name]),
  );

  return active;
}
