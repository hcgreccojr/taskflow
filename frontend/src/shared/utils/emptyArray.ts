const EMPTY: unknown[] = [];

/**
 * Sempre retorna a MESMA referência de array vazio. Um `?? []` inline dentro de
 * um seletor do zustand cria uma referência nova a cada render — o que faz o
 * React (via useSyncExternalStore) entrar em loop infinito de re-render
 * (invariant #185) porque o snapshot nunca é considerado estável.
 */
export function emptyArray<T>(): T[] {
  return EMPTY as T[];
}
