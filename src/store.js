/**
 * State store tunggal (lihat SPEC §5.3).
 * Tanpa dependensi: satu objek state, satu daftar subscriber.
 */

export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState() {
      return state;
    },

    /**
     * @param {object|Function} patch objek partial atau updater (state) => partial
     */
    setState(patch) {
      const partial = typeof patch === "function" ? patch(state) : patch;
      if (!partial) return;
      state = { ...state, ...partial };
      for (const listener of listeners) listener(state);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
