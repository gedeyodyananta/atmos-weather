/**
 * HTTP client tunggal untuk semua permintaan Open-Meteo.
 *
 * Tanggung jawab (SPEC §5.4 aturan 4):
 * - timeout 10 detik + AbortController,
 * - normalisasi kegagalan menjadi `ApiError` dengan `{ code, retryable, messageKey }`,
 * - tidak ada `fetch` di luar `src/api/*`.
 */

import { REQUEST_TIMEOUT_MS } from "../config/constants.js";

export const ERROR_CODES = Object.freeze({
  NETWORK: "NETWORK",
  TIMEOUT: "TIMEOUT",
  HTTP_4XX: "HTTP_4XX",
  HTTP_5XX: "HTTP_5XX",
  PARSE: "PARSE",
  EMPTY_DATA: "EMPTY_DATA",
  // Ekstensi internal: permintaan dibatalkan oleh pemanggil, bukan kegagalan API.
  ABORTED: "ABORTED",
});

const DEFAULT_MESSAGE_KEYS = {
  NETWORK: "error.network",
  TIMEOUT: "error.timeout",
  HTTP_4XX: "error.http4xx",
  HTTP_5XX: "error.http5xx",
  PARSE: "error.parse",
  EMPTY_DATA: "error.emptyData",
  ABORTED: "error.aborted",
};

const DEFAULT_MESSAGES = {
  NETWORK: "Tidak dapat terhubung ke layanan cuaca.",
  TIMEOUT: "Permintaan ke layanan cuaca melebihi batas waktu.",
  HTTP_4XX: "Permintaan data cuaca ditolak.",
  HTTP_5XX: "Layanan cuaca sedang mengalami gangguan.",
  PARSE: "Respons layanan cuaca tidak dapat dibaca.",
  EMPTY_DATA: "Data cuaca tidak tersedia untuk lokasi ini.",
  ABORTED: "Permintaan dibatalkan.",
};

const RETRYABLE_BY_DEFAULT = {
  NETWORK: true,
  TIMEOUT: true,
  HTTP_4XX: false,
  HTTP_5XX: true,
  PARSE: true,
  EMPTY_DATA: false,
  ABORTED: false,
};

export class ApiError extends Error {
  constructor(code, { status = null, retryable, messageKey, message, url = null, cause = null } = {}) {
    super(message ?? DEFAULT_MESSAGES[code] ?? "Terjadi kesalahan saat memuat data.");
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.retryable = retryable ?? RETRYABLE_BY_DEFAULT[code] ?? false;
    this.messageKey = messageKey ?? DEFAULT_MESSAGE_KEYS[code] ?? "error.unknown";
    this.url = url;
    this.cause = cause;
  }

  toJSON() {
    return {
      code: this.code,
      status: this.status,
      retryable: this.retryable,
      messageKey: this.messageKey,
      message: this.message,
    };
  }
}

export function isApiError(error) {
  return error instanceof ApiError;
}

/** Ubah error apa pun menjadi `ApiError` agar lapisan atas selalu menerima bentuk yang sama. */
export function toApiError(error, { url = null } = {}) {
  if (isApiError(error)) return error;

  if (isAbortError(error)) {
    return new ApiError(ERROR_CODES.ABORTED, { url, cause: error });
  }

  return new ApiError(ERROR_CODES.NETWORK, {
    url,
    cause: error,
    message: error instanceof TypeError ? undefined : error?.message,
  });
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === 20;
}

/** Gabungkan beberapa signal tanpa meninggalkan listener pada signal yang berumur panjang. */
export function combineSignals(signals) {
  const list = signals.filter(Boolean);
  if (list.length === 0) return undefined;
  if (list.length === 1) return list[0];

  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any(list);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  for (const signal of list) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", abort, { once: true });
  }
  return controller.signal;
}

/** Bangun URL lengkap memakai URLSearchParams (tanpa string concatenation manual). */
export function buildUrl(endpoint, params = {}) {
  const url = new URL(endpoint);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  url.search = search.toString();
  return url.toString();
}

/**
 * Ambil JSON dengan timeout & normalisasi error.
 *
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<any>}
 */
export async function requestJson(url, options = {}) {
  const {
    signal,
    timeoutMs = REQUEST_TIMEOUT_MS,
    fetchImpl = globalThis.fetch,
  } = options;

  if (signal?.aborted) {
    throw new ApiError(ERROR_CODES.ABORTED, { url });
  }

  if (typeof fetchImpl !== "function") {
    throw new ApiError(ERROR_CODES.NETWORK, {
      url,
      message: "Fetch API tidak tersedia di lingkungan ini.",
    });
  }

  const controller = new AbortController();
  let timedOut = false;
  let timer = null;

  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener("abort", onAbort, { once: true });

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  try {
    let response;
    try {
      response = await fetchImpl(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      if (timedOut) throw new ApiError(ERROR_CODES.TIMEOUT, { url, cause: error });
      if (signal?.aborted || controller.signal.aborted || isAbortError(error)) {
        throw new ApiError(ERROR_CODES.ABORTED, { url, cause: error });
      }
      throw new ApiError(ERROR_CODES.NETWORK, { url, cause: error });
    }

    if (!response || typeof response.ok !== "boolean") {
      throw new ApiError(ERROR_CODES.PARSE, {
        url,
        message: "Respons layanan cuaca tidak dikenali.",
      });
    }

    if (!response.ok) {
      const status = Number(response.status) || null;
      const isServer = status !== null && status >= 500;
      const isRetryableClient = status === 408 || status === 429;
      throw new ApiError(isServer ? ERROR_CODES.HTTP_5XX : ERROR_CODES.HTTP_4XX, {
        url,
        status,
        retryable: isServer || isRetryableClient,
      });
    }

    let text;
    try {
      text = await response.text();
    } catch (error) {
      if (timedOut) throw new ApiError(ERROR_CODES.TIMEOUT, { url, cause: error });
      if (signal?.aborted) throw new ApiError(ERROR_CODES.ABORTED, { url, cause: error });
      throw new ApiError(ERROR_CODES.PARSE, { url, cause: error });
    }

    if (typeof text !== "string" || text.trim() === "") {
      throw new ApiError(ERROR_CODES.EMPTY_DATA, { url });
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ApiError(ERROR_CODES.PARSE, { url, cause: error });
    }
  } finally {
    if (timer !== null) clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

/** Validasi bentuk objek respons sebelum dipetakan ke model domain. */
export function assertObjectPayload(payload, url) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(ERROR_CODES.PARSE, {
      url,
      message: "Struktur respons layanan cuaca tidak sesuai.",
    });
  }
  return payload;
}
