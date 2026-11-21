/** true si el API exige PIN para escribir. */
export function isPinRequired(): boolean {
  return Boolean((process.env.BATAK_PIN ?? '').trim());
}

/**
 * Sin PIN, cualquiera que alcance el API puede apuntar, borrar partidas y
 * crear eventos: las lecturas son públicas y las escrituras no tienen más
 * barrera que esa variable.
 *
 * En local eso es cómodo y deliberado. En producción es un API abierto sin
 * ningún síntoma visible, así que preferimos que el despliegue falle de forma
 * ruidosa a que salga a la feria sin candado.
 */
export function assertPinModeIsSafe(): void {
  if (process.env.NODE_ENV === 'production' && !isPinRequired()) {
    throw new Error(
      'BATAK_PIN no está configurada y NODE_ENV=production: el API quedaría abierto a ' +
        'cualquiera con la URL. Define BATAK_PIN en las variables de entorno del proyecto ' +
        'de Vercel (Settings -> Environment Variables) y vuelve a desplegar.',
    );
  }
}
