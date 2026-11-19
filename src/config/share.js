/**
 * Konfigurasi nonrahasia untuk berbagi laporan cuaca.
 * Tidak ada API key, SDK, atau layanan berbayar di sini.
 */

export const SHARE_CONFIG = Object.freeze({
  whatsappBaseUrl: "https://wa.me/?text=",
  appName: "ATMOS",
  messageTemplate:
    "Cuaca di {location} saat ini: {temperature} ({condition}), AQI: {aqi} ({aqiCategory}) — dipantau via {appName}",
});
