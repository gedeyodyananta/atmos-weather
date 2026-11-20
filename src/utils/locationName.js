/**
 * Nama lokasi untuk ditampilkan. Lokasi hasil geolokasi disimpan dengan nama
 * terjemahan saat dipilih ("Lokasi saya"/"My location"); nama itu harus ikut
 * berganti ketika bahasa UI berubah.
 */

import { t } from "../i18n/index.js";

const DEVICE_LOCATION_NAMES = new Set(["Lokasi saya", "My location"]);

export function getLocationDisplayName(location) {
  if (!location) return "—";
  const name = typeof location.name === "string" ? location.name.trim() : "";
  if (location.isDeviceLocation === true || DEVICE_LOCATION_NAMES.has(name)) {
    return t("geo.name");
  }
  return location.name;
}
