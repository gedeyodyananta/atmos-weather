/**
 * Cari rentang jam berurutan dengan rata-rata AQI terendah.
 * Dipakai badge "Jam Udara Terbaik" pada grafik tren 24 jam.
 */

const isAqi = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;

/**
 * @param {Array<{ time: string, aqi: number|null }>} hours
 * @param {number} [windowSize=3] jumlah jam berurutan
 * @returns {{ startIndex: number, endIndex: number, startTime: string, endTime: string, averageAqi: number, hours: number }|null}
 */
export function findBestAirWindow(hours, windowSize = 3) {
  const list = Array.isArray(hours) ? hours : [];
  const size = Math.max(1, Math.floor(windowSize));
  if (list.length < size) return null;

  let best = null;

  for (let start = 0; start <= list.length - size; start += 1) {
    const window = list.slice(start, start + size);
    const values = window.map((hour) => hour?.aqi).filter(isAqi);
    if (values.length !== size) continue;

    const average = values.reduce((total, value) => total + value, 0) / size;
    if (!best || average < best.averageAqi) {
      best = {
        startIndex: start,
        endIndex: start + size - 1,
        startTime: window[0].time,
        endTime: window[window.length - 1].time,
        averageAqi: Math.round(average * 10) / 10,
        hours: size,
      };
    }
  }

  return best;
}
