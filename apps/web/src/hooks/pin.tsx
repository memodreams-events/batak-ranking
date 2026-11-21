import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, apiFetch, getPin, setPin as persistPin } from '../lib/api';

interface PinContextValue {
  /** true cuando el API exige PIN y este dispositivo todavía no tiene uno válido. */
  requerido: boolean;
  /** Comprueba el PIN contra el API y lo guarda si es correcto. */
  submit: (pin: string) => Promise<boolean>;
  /** Lo llaman las escrituras al recibir un 401: el PIN guardado ha dejado de valer. */
  markRejected: () => void;
}

const PinContext = createContext<PinContextValue | null>(null);

async function checkPin(pin: string): Promise<boolean> {
  try {
    await apiFetch('/batak/pin', { pin });
    return true;
  } catch (error) {
    // Un 401 significa PIN malo; un fallo de red no dice nada sobre el PIN, así
    // que no pedimos uno nuevo por estar el wifi caído.
    if (error instanceof ApiError && error.status === 401) return false;
    return true;
  }
}

export function PinProvider({ children }: { children: ReactNode }) {
  const [requerido, setRequerido] = useState(false);

  // Preguntamos al arrancar en vez de esperar a que falle la primera partida:
  // el azafato se encuentra el formulario del PIN antes de tener a alguien
  // delante esperando a que apunte su puntuación.
  useEffect(() => {
    let cancelled = false;
    void checkPin(getPin()).then((ok) => {
      if (!cancelled && !ok) setRequerido(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(async (pin: string) => {
    const ok = await checkPin(pin);
    if (ok) {
      persistPin(pin);
      setRequerido(false);
    }
    return ok;
  }, []);

  const markRejected = useCallback(() => setRequerido(true), []);

  const value = useMemo(
    () => ({ requerido, submit, markRejected }),
    [requerido, submit, markRejected],
  );
  return <PinContext.Provider value={value}>{children}</PinContext.Provider>;
}

export function usePin(): PinContextValue {
  const context = useContext(PinContext);
  if (!context) throw new Error('usePin fuera de <PinProvider>');
  return context;
}
