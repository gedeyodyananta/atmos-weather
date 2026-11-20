/**
 * Pembungkus Geolocation API browser dengan pesan error yang bisa
 * diterjemahkan. Tidak menyimpan koordinat ke localStorage sampai pemanggil
 * memilih lokasi tersebut.
 */

export const GEO_ERROR_KEYS = Object.freeze({
  PERMISSION_DENIED: "geo.denied",
  POSITION_UNAVAILABLE: "geo.unavailable",
  TIMEOUT: "geo.timeout",
  UNSUPPORTED: "geo.unsupported",
});

/** @param {{ code?: number }|null} error */
export function mapGeolocationError(error) {
  switch (error?.code) {
    case 1:
      return GEO_ERROR_KEYS.PERMISSION_DENIED;
    case 2:
      return GEO_ERROR_KEYS.POSITION_UNAVAILABLE;
    case 3:
      return GEO_ERROR_KEYS.TIMEOUT;
    default:
      return GEO_ERROR_KEYS.UNSUPPORTED;
  }
}

/**
 * @param {{ timeout?: number, maximumAge?: number }} [options]
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number|null }>}
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    const geolocation = globalThis.navigator?.geolocation;
    if (!geolocation || typeof geolocation.getCurrentPosition !== "function") {
      reject({ key: GEO_ERROR_KEYS.UNSUPPORTED });
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        const latitude = position?.coords?.latitude;
        const longitude = position?.coords?.longitude;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
          reject({ key: GEO_ERROR_KEYS.POSITION_UNAVAILABLE });
          return;
        }
        resolve({
          latitude,
          longitude,
          accuracy: typeof position.coords.accuracy === "number" ? position.coords.accuracy : null,
        });
      },
      (error) => reject({ key: mapGeolocationError(error), code: error?.code ?? null }),
      {
        enableHighAccuracy: false,
        timeout: options.timeout ?? 10_000,
        maximumAge: options.maximumAge ?? 5 * 60 * 1000,
      }
    );
  });
}
