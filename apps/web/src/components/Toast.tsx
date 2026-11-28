import { useToast } from '../hooks/toast';

/** Aviso efímero centrado abajo. Es la única confirmación que ve el azafato. */
export function Toast() {
  const { current } = useToast();
  if (!current) return null;

  return (
    <div
      role="status"
      className={[
        'fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-[10px] px-5 py-3 text-[17px] font-semibold shadow-toast',
        current.error ? 'bg-bad text-ink' : 'bg-brasa text-ink',
      ].join(' ')}
    >
      {current.text}
    </div>
  );
}
