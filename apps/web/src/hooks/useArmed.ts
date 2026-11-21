import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Borrado en dos toques: el primero arma el botón ("¿Seguro?"), el segundo
 * ejecuta. Se desarma solo a los 3 s.
 *
 * Un `confirm()` nativo bloquearía el iPad del stand y es justo lo que no
 * queremos con alguien esperando delante.
 */
export function useArmed(onConfirm: (id: string) => void, ms = 3000) {
  const [armed, setArmed] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const press = useCallback(
    (id: string) => {
      if (timer.current) clearTimeout(timer.current);
      if (armed === id) {
        setArmed(null);
        onConfirm(id);
        return;
      }
      setArmed(id);
      timer.current = setTimeout(() => setArmed(null), ms);
    },
    [armed, onConfirm, ms],
  );

  return { armed, press };
}
