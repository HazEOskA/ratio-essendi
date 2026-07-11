// GENERATED FILE — do not edit. Rebuild with: npm run build:vercel
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@anthropic-ai/sdk/internal/tslib.mjs
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
var init_tslib = __esm({
  "node_modules/@anthropic-ai/sdk/internal/tslib.mjs"() {
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/uuid.mjs
var uuid4;
var init_uuid = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/uuid.mjs"() {
    uuid4 = function() {
      const { crypto: crypto2 } = globalThis;
      if (crypto2?.randomUUID) {
        uuid4 = crypto2.randomUUID.bind(crypto2);
        return crypto2.randomUUID();
      }
      const u8 = new Uint8Array(1);
      const randomByte = crypto2 ? () => crypto2.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/errors.mjs
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError;
var init_errors = __esm({
  "node_modules/@anthropic-ai/sdk/internal/errors.mjs"() {
    castToError = (err) => {
      if (err instanceof Error)
        return err;
      if (typeof err === "object" && err !== null) {
        try {
          if (Object.prototype.toString.call(err) === "[object Error]") {
            const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
            if (err.stack)
              error.stack = err.stack;
            if (err.cause && !error.cause)
              error.cause = err.cause;
            if (err.name)
              error.name = err.name;
            return error;
          }
        } catch {
        }
        try {
          return new Error(JSON.stringify(err));
        } catch {
        }
      }
      return new Error(err);
    };
  }
});

// node_modules/@anthropic-ai/sdk/core/error.mjs
var AnthropicError, APIError, APIUserAbortError, APIConnectionError, APIConnectionTimeoutError, RetryableError, BadRequestError, AuthenticationError, PermissionDeniedError, NotFoundError, ConflictError, UnprocessableEntityError, RateLimitError, InternalServerError;
var init_error = __esm({
  "node_modules/@anthropic-ai/sdk/core/error.mjs"() {
    init_errors();
    AnthropicError = class extends Error {
    };
    APIError = class _APIError extends AnthropicError {
      constructor(status, error, message, headers, type) {
        super(`${_APIError.makeMessage(status, error, message)}`);
        this.status = status;
        this.headers = headers;
        this.requestID = headers?.get("request-id");
        this.error = error;
        this.type = type ?? null;
      }
      static makeMessage(status, error, message) {
        const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
        if (status && msg) {
          return `${status} ${msg}`;
        }
        if (status) {
          return `${status} status code (no body)`;
        }
        if (msg) {
          return msg;
        }
        return "(no status code or body)";
      }
      static generate(status, errorResponse, message, headers) {
        if (!status || !headers) {
          return new APIConnectionError({ message, cause: castToError(errorResponse) });
        }
        const error = errorResponse;
        const type = error?.["error"]?.["type"];
        if (status === 400) {
          return new BadRequestError(status, error, message, headers, type);
        }
        if (status === 401) {
          return new AuthenticationError(status, error, message, headers, type);
        }
        if (status === 403) {
          return new PermissionDeniedError(status, error, message, headers, type);
        }
        if (status === 404) {
          return new NotFoundError(status, error, message, headers, type);
        }
        if (status === 409) {
          return new ConflictError(status, error, message, headers, type);
        }
        if (status === 422) {
          return new UnprocessableEntityError(status, error, message, headers, type);
        }
        if (status === 429) {
          return new RateLimitError(status, error, message, headers, type);
        }
        if (status >= 500) {
          return new InternalServerError(status, error, message, headers, type);
        }
        return new _APIError(status, error, message, headers, type);
      }
    };
    APIUserAbortError = class extends APIError {
      constructor({ message } = {}) {
        super(void 0, void 0, message || "Request was aborted.", void 0);
      }
    };
    APIConnectionError = class extends APIError {
      constructor({ message, cause }) {
        super(void 0, void 0, message || "Connection error.", void 0);
        if (cause)
          this.cause = cause;
      }
    };
    APIConnectionTimeoutError = class extends APIConnectionError {
      constructor({ message } = {}) {
        super({ message: message ?? "Request timed out." });
      }
    };
    RetryableError = class extends AnthropicError {
      constructor(message, { cause } = {}) {
        super(message ?? "Retryable error.");
        if (cause !== void 0)
          this.cause = cause;
      }
    };
    BadRequestError = class extends APIError {
    };
    AuthenticationError = class extends APIError {
    };
    PermissionDeniedError = class extends APIError {
    };
    NotFoundError = class extends APIError {
    };
    ConflictError = class extends APIError {
    };
    UnprocessableEntityError = class extends APIError {
    };
    RateLimitError = class extends APIError {
    };
    InternalServerError = class extends APIError {
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/values.mjs
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
var startsWithSchemeRegexp, isAbsoluteURL, isArray, isReadonlyArray, validatePositiveInteger, safeJSON;
var init_values = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/values.mjs"() {
    init_error();
    startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
    isAbsoluteURL = (url) => {
      return startsWithSchemeRegexp.test(url);
    };
    isArray = (val) => (isArray = Array.isArray, isArray(val));
    isReadonlyArray = isArray;
    validatePositiveInteger = (name, n) => {
      if (typeof n !== "number" || !Number.isInteger(n)) {
        throw new AnthropicError(`${name} must be an integer`);
      }
      if (n < 0) {
        throw new AnthropicError(`${name} must be a positive integer`);
      }
      return n;
    };
    safeJSON = (text) => {
      try {
        return JSON.parse(text);
      } catch (err) {
        return void 0;
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/sleep.mjs
var sleep;
var init_sleep = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/sleep.mjs"() {
    sleep = (ms, signal) => new Promise((resolve4) => {
      if (signal?.aborted)
        return resolve4();
      const onAbort = () => {
        clearTimeout(timer);
        resolve4();
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve4();
      }, ms);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
});

// node_modules/@anthropic-ai/sdk/version.mjs
var VERSION;
var init_version = __esm({
  "node_modules/@anthropic-ai/sdk/version.mjs"() {
    VERSION = "0.106.0";
  }
});

// node_modules/@anthropic-ai/sdk/internal/detect-platform.mjs
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
var isRunningInBrowser, getPlatformProperties, normalizeArch, normalizePlatform, _platformHeaders, getPlatformHeaders;
var init_detect_platform = __esm({
  "node_modules/@anthropic-ai/sdk/internal/detect-platform.mjs"() {
    init_version();
    isRunningInBrowser = () => {
      return (
        // @ts-ignore
        typeof window !== "undefined" && // @ts-ignore
        typeof window.document !== "undefined" && // @ts-ignore
        typeof navigator !== "undefined"
      );
    };
    getPlatformProperties = () => {
      const detectedPlatform = getDetectedPlatform();
      if (detectedPlatform === "deno") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": normalizePlatform(Deno.build.os),
          "X-Stainless-Arch": normalizeArch(Deno.build.arch),
          "X-Stainless-Runtime": "deno",
          "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
        };
      }
      if (typeof EdgeRuntime !== "undefined") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": `other:${EdgeRuntime}`,
          "X-Stainless-Runtime": "edge",
          "X-Stainless-Runtime-Version": globalThis.process.version
        };
      }
      if (detectedPlatform === "node") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
          "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
          "X-Stainless-Runtime": "node",
          "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
        };
      }
      const browserInfo = getBrowserInfo();
      if (browserInfo) {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": "unknown",
          "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
          "X-Stainless-Runtime-Version": browserInfo.version
        };
      }
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": VERSION,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": "unknown",
        "X-Stainless-Runtime": "unknown",
        "X-Stainless-Runtime-Version": "unknown"
      };
    };
    normalizeArch = (arch) => {
      if (arch === "x32")
        return "x32";
      if (arch === "x86_64" || arch === "x64")
        return "x64";
      if (arch === "arm")
        return "arm";
      if (arch === "aarch64" || arch === "arm64")
        return "arm64";
      if (arch)
        return `other:${arch}`;
      return "unknown";
    };
    normalizePlatform = (platform) => {
      platform = platform.toLowerCase();
      if (platform.includes("ios"))
        return "iOS";
      if (platform === "android")
        return "Android";
      if (platform === "darwin")
        return "MacOS";
      if (platform === "win32")
        return "Windows";
      if (platform === "freebsd")
        return "FreeBSD";
      if (platform === "openbsd")
        return "OpenBSD";
      if (platform === "linux")
        return "Linux";
      if (platform)
        return `Other:${platform}`;
      return "Unknown";
    };
    getPlatformHeaders = () => {
      return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/shims.mjs
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new Anthropic({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function makeReadableStream(...args) {
  const ReadableStream2 = globalThis.ReadableStream;
  if (typeof ReadableStream2 === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream2(...args);
}
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {
    },
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
function ReadableStreamToAsyncIterable(stream) {
  if (stream[Symbol.asyncIterator])
    return stream;
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function CancelReadableStream(stream) {
  if (stream === null || typeof stream !== "object")
    return;
  if (stream[Symbol.asyncIterator]) {
    await stream[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}
var init_shims = __esm({
  "node_modules/@anthropic-ai/sdk/internal/shims.mjs"() {
  }
});

// node_modules/@anthropic-ai/sdk/internal/request-options.mjs
var FallbackEncoder;
var init_request_options = __esm({
  "node_modules/@anthropic-ai/sdk/internal/request-options.mjs"() {
    FallbackEncoder = ({ headers, body }) => {
      return {
        bodyHeaders: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      };
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/qs/formats.mjs
var default_format, default_formatter, formatters, RFC1738;
var init_formats = __esm({
  "node_modules/@anthropic-ai/sdk/internal/qs/formats.mjs"() {
    default_format = "RFC3986";
    default_formatter = (v) => String(v);
    formatters = {
      RFC1738: (v) => String(v).replace(/%20/g, "+"),
      RFC3986: default_formatter
    };
    RFC1738 = "RFC1738";
  }
});

// node_modules/@anthropic-ai/sdk/internal/qs/utils.mjs
function is_buffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
}
function maybe_map(val, fn) {
  if (isArray(val)) {
    const mapped = [];
    for (let i = 0; i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
}
var has, hex_table, limit, encode;
var init_utils = __esm({
  "node_modules/@anthropic-ai/sdk/internal/qs/utils.mjs"() {
    init_formats();
    init_values();
    has = (obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key));
    hex_table = /* @__PURE__ */ (() => {
      const array = [];
      for (let i = 0; i < 256; ++i) {
        array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
      }
      return array;
    })();
    limit = 1024;
    encode = (str, _defaultEncoder, charset, _kind, format) => {
      if (str.length === 0) {
        return str;
      }
      let string = str;
      if (typeof str === "symbol") {
        string = Symbol.prototype.toString.call(str);
      } else if (typeof str !== "string") {
        string = String(str);
      }
      if (charset === "iso-8859-1") {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
          return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
        });
      }
      let out = "";
      for (let j = 0; j < string.length; j += limit) {
        const segment = string.length >= limit ? string.slice(j, j + limit) : string;
        const arr = [];
        for (let i = 0; i < segment.length; ++i) {
          let c = segment.charCodeAt(i);
          if (c === 45 || // -
          c === 46 || // .
          c === 95 || // _
          c === 126 || // ~
          c >= 48 && c <= 57 || // 0-9
          c >= 65 && c <= 90 || // a-z
          c >= 97 && c <= 122 || // A-Z
          format === RFC1738 && (c === 40 || c === 41)) {
            arr[arr.length] = segment.charAt(i);
            continue;
          }
          if (c < 128) {
            arr[arr.length] = hex_table[c];
            continue;
          }
          if (c < 2048) {
            arr[arr.length] = hex_table[192 | c >> 6] + hex_table[128 | c & 63];
            continue;
          }
          if (c < 55296 || c >= 57344) {
            arr[arr.length] = hex_table[224 | c >> 12] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
            continue;
          }
          i += 1;
          c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
          arr[arr.length] = hex_table[240 | c >> 18] + hex_table[128 | c >> 12 & 63] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
        }
        out += arr.join("");
      }
      return out;
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/qs/stringify.mjs
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
function inner_stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder2, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== void 0 && !find_flag) {
    const pos = tmp_sc.get(object);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        find_flag = true;
      }
    }
    if (typeof tmp_sc.get(sentinel) === "undefined") {
      step = 0;
    }
  }
  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate?.(obj);
  } else if (generateArrayPrefix === "comma" && isArray(obj)) {
    obj = maybe_map(obj, function(value) {
      if (value instanceof Date) {
        return serializeDate?.(value);
      }
      return value;
    });
  }
  if (obj === null) {
    if (strictNullHandling) {
      return encoder2 && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder2(prefix, defaults.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder2) {
      const key_value = encodeValuesOnly ? prefix : encoder2(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder2(obj, defaults.encoder, charset, "value", format))
      ];
    }
    return [formatter?.(prefix) + "=" + formatter?.(String(obj))];
  }
  const values = [];
  if (typeof obj === "undefined") {
    return values;
  }
  let obj_keys;
  if (generateArrayPrefix === "comma" && isArray(obj)) {
    if (encodeValuesOnly && encoder2) {
      obj = maybe_map(obj, encoder2);
    }
    obj_keys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
  } else if (isArray(filter)) {
    obj_keys = filter;
  } else {
    const keys = Object.keys(obj);
    obj_keys = sort ? keys.sort(sort) : keys;
  }
  const encoded_prefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
  const adjusted_prefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encoded_prefix + "[]" : encoded_prefix;
  if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
    return adjusted_prefix + "[]";
  }
  for (let j = 0; j < obj_keys.length; ++j) {
    const key = obj_keys[j];
    const value = (
      // @ts-ignore
      typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key]
    );
    if (skipNulls && value === null) {
      continue;
    }
    const encoded_key = allowDots && encodeDotInKeys ? key.replace(/\./g, "%2E") : key;
    const key_prefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjusted_prefix, encoded_key) : adjusted_prefix : adjusted_prefix + (allowDots ? "." + encoded_key : "[" + encoded_key + "]");
    sideChannel.set(object, step);
    const valueSideChannel = /* @__PURE__ */ new WeakMap();
    valueSideChannel.set(sentinel, sideChannel);
    push_to_array(values, inner_stringify(
      value,
      key_prefix,
      generateArrayPrefix,
      commaRoundTrip,
      allowEmptyArrays,
      strictNullHandling,
      skipNulls,
      encodeDotInKeys,
      // @ts-ignore
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder2,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      valueSideChannel
    ));
  }
  return values;
}
function normalize_stringify_options(opts = defaults) {
  if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  }
  if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  }
  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }
  const charset = opts.charset || defaults.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  let format = default_format;
  if (typeof opts.format !== "undefined") {
    if (!has(formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  const formatter = formatters[format];
  let filter = defaults.filter;
  if (typeof opts.filter === "function" || isArray(opts.filter)) {
    filter = opts.filter;
  }
  let arrayFormat;
  if (opts.arrayFormat && opts.arrayFormat in array_prefix_generators) {
    arrayFormat = opts.arrayFormat;
  } else if ("indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = defaults.arrayFormat;
  }
  if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  const allowDots = typeof opts.allowDots === "undefined" ? !!opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
    // @ts-ignore
    allowDots,
    allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
    arrayFormat,
    charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
    commaRoundTrip: !!opts.commaRoundTrip,
    delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
    encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
    filter,
    format,
    formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
    // @ts-ignore
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
  };
}
function stringify(object, opts = {}) {
  let obj = object;
  const options = normalize_stringify_options(opts);
  let obj_keys;
  let filter;
  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray(options.filter)) {
    filter = options.filter;
    obj_keys = filter;
  }
  const keys = [];
  if (typeof obj !== "object" || obj === null) {
    return "";
  }
  const generateArrayPrefix = array_prefix_generators[options.arrayFormat];
  const commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
  if (!obj_keys) {
    obj_keys = Object.keys(obj);
  }
  if (options.sort) {
    obj_keys.sort(options.sort);
  }
  const sideChannel = /* @__PURE__ */ new WeakMap();
  for (let i = 0; i < obj_keys.length; ++i) {
    const key = obj_keys[i];
    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    push_to_array(keys, inner_stringify(
      obj[key],
      key,
      // @ts-expect-error
      generateArrayPrefix,
      commaRoundTrip,
      options.allowEmptyArrays,
      options.strictNullHandling,
      options.skipNulls,
      options.encodeDotInKeys,
      options.encode ? options.encoder : null,
      options.filter,
      options.sort,
      options.allowDots,
      options.serializeDate,
      options.format,
      options.formatter,
      options.encodeValuesOnly,
      options.charset,
      sideChannel
    ));
  }
  const joined = keys.join(options.delimiter);
  let prefix = options.addQueryPrefix === true ? "?" : "";
  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      prefix += "utf8=%26%2310003%3B&";
    } else {
      prefix += "utf8=%E2%9C%93&";
    }
  }
  return joined.length > 0 ? prefix + joined : "";
}
var array_prefix_generators, push_to_array, toISOString, defaults, sentinel;
var init_stringify = __esm({
  "node_modules/@anthropic-ai/sdk/internal/qs/stringify.mjs"() {
    init_utils();
    init_formats();
    init_values();
    array_prefix_generators = {
      brackets(prefix) {
        return String(prefix) + "[]";
      },
      comma: "comma",
      indices(prefix, key) {
        return String(prefix) + "[" + key + "]";
      },
      repeat(prefix) {
        return String(prefix);
      }
    };
    push_to_array = function(arr, value_or_array) {
      Array.prototype.push.apply(arr, isArray(value_or_array) ? value_or_array : [value_or_array]);
    };
    defaults = {
      addQueryPrefix: false,
      allowDots: false,
      allowEmptyArrays: false,
      arrayFormat: "indices",
      charset: "utf-8",
      charsetSentinel: false,
      delimiter: "&",
      encode: true,
      encodeDotInKeys: false,
      encoder: encode,
      encodeValuesOnly: false,
      format: default_format,
      formatter: default_formatter,
      /** @deprecated */
      indices: false,
      serializeDate(date) {
        return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date);
      },
      skipNulls: false,
      strictNullHandling: false
    };
    sentinel = {};
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/query.mjs
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "brackets" });
}
var init_query = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/query.mjs"() {
    init_stringify();
  }
});

// node_modules/@anthropic-ai/sdk/lib/credentials/types.mjs
function requireSecureTokenEndpoint(baseURL) {
  if (!baseURL)
    return;
  let u;
  try {
    u = new URL(baseURL);
  } catch (err) {
    throw new WorkloadIdentityError(`Invalid token endpoint base URL "${baseURL}": ${err}`);
  }
  if (u.protocol === "https:")
    return;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (u.protocol === "http:" && (host === "localhost" || host === "127.0.0.1" || host === "::1")) {
    return;
  }
  throw new WorkloadIdentityError(`Refusing to send credential over non-https token endpoint "${baseURL}"`);
}
async function parseTokenResponse(resp, requestId) {
  const text = await readLimitedText(resp);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new WorkloadIdentityError(`Token endpoint returned non-JSON response (status ${resp.status})`, resp.status, redactSensitive(text), requestId);
  }
  if (!data.access_token) {
    throw new WorkloadIdentityError(`Token endpoint response missing access_token: ${JSON.stringify(redactSensitive(data))}`, resp.status, redactSensitive(data), requestId);
  }
  if (data.token_type && data.token_type.toLowerCase() !== "bearer") {
    throw new WorkloadIdentityError(`Token endpoint response: unsupported token_type "${data.token_type}" (want Bearer)`, resp.status, redactSensitive(data), requestId);
  }
  return data;
}
function redactSensitive(body) {
  if (body == null)
    return body;
  if (typeof body === "string") {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      if (body.length <= MAX_ERROR_BODY_CHARS)
        return body;
      return body.slice(0, MAX_ERROR_BODY_CHARS) + `... <${body.length - MAX_ERROR_BODY_CHARS} more chars>`;
    }
    return JSON.stringify(redactSensitive(parsed));
  }
  if (typeof body === "object" && !Array.isArray(body)) {
    const out = {};
    for (const [k, v] of Object.entries(body)) {
      if (SAFE_ERROR_KEYS.has(k))
        out[k] = v;
    }
    return out;
  }
  return null;
}
async function checkCredentialsFileSafety(path5, onWarn = (m) => console.warn(`anthropic-sdk: ${m}`)) {
  if (typeof process === "undefined" || process.platform === "win32")
    return;
  const fs4 = await import("node:fs");
  let resolved = path5;
  let st;
  try {
    resolved = await fs4.promises.realpath(path5);
    st = await fs4.promises.stat(resolved);
  } catch {
    return;
  }
  const mode = st.mode & 511;
  if (mode & 18) {
    throw new WorkloadIdentityError(`Credentials file at ${resolved} is group/world-writable (mode 0o${mode.toString(8)}); this allows other local users to plant tokens. Run \`chmod 600 ${resolved}\`.`);
  }
  if (mode & 36) {
    throw new WorkloadIdentityError(`Credentials file at ${resolved} is group/world-readable (mode 0o${mode.toString(8)}); run \`chmod 600 ${resolved}\` before retrying.`);
  }
  if (typeof process.getuid === "function" && st.uid !== process.getuid()) {
    onWarn(`credentials file at ${resolved} is owned by uid ${st.uid} (current process uid ${process.getuid()}); verify this is intentional.`);
  }
}
async function writeCredentialsFileAtomic(targetPath, data) {
  const fs4 = await import("node:fs");
  const path5 = await import("node:path");
  const dir = path5.dirname(targetPath);
  await fs4.promises.mkdir(dir, { recursive: true, mode: 448 });
  const tmpPath = `${targetPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    const fh = await fs4.promises.open(tmpPath, "w", 384);
    try {
      await fh.writeFile(JSON.stringify(data, null, 2));
      await fh.sync();
    } finally {
      await fh.close();
    }
    await fs4.promises.rename(tmpPath, targetPath);
  } catch (err) {
    await fs4.promises.unlink(tmpPath).catch(() => {
    });
    throw err;
  }
  try {
    const dirFh = await fs4.promises.open(dir, "r");
    try {
      await dirFh.sync();
    } finally {
      await dirFh.close();
    }
  } catch {
  }
}
async function readLimitedText(resp) {
  if (!resp.body) {
    return "";
  }
  const reader = resp.body.getReader();
  const chunks = [];
  let received = 0;
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done)
      break;
    if (received + value.length > MAX_TOKEN_RESPONSE_BYTES) {
      const remaining = MAX_TOKEN_RESPONSE_BYTES - received;
      if (remaining > 0)
        chunks.push(value.subarray(0, remaining));
      await reader.cancel();
      break;
    }
    chunks.push(value);
    received += value.length;
  }
  let merged;
  if (chunks.length === 1) {
    merged = chunks[0];
  } else {
    merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
  }
  return new TextDecoder("utf-8").decode(merged);
}
var GRANT_TYPE_JWT_BEARER, GRANT_TYPE_REFRESH_TOKEN, TOKEN_ENDPOINT, OAUTH_API_BETA_HEADER, FEDERATION_BETA_HEADER, ADVISORY_REFRESH_THRESHOLD_IN_SECONDS, MANDATORY_REFRESH_THRESHOLD_IN_SECONDS, ADVISORY_REFRESH_BACKOFF_IN_SECONDS, MAX_TOKEN_RESPONSE_BYTES, MAX_ERROR_BODY_CHARS, SAFE_ERROR_KEYS, WorkloadIdentityError;
var init_types = __esm({
  "node_modules/@anthropic-ai/sdk/lib/credentials/types.mjs"() {
    init_error();
    GRANT_TYPE_JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer";
    GRANT_TYPE_REFRESH_TOKEN = "refresh_token";
    TOKEN_ENDPOINT = "/v1/oauth/token";
    OAUTH_API_BETA_HEADER = "oauth-2025-04-20";
    FEDERATION_BETA_HEADER = "oidc-federation-2026-04-01";
    ADVISORY_REFRESH_THRESHOLD_IN_SECONDS = 120;
    MANDATORY_REFRESH_THRESHOLD_IN_SECONDS = 30;
    ADVISORY_REFRESH_BACKOFF_IN_SECONDS = 5;
    MAX_TOKEN_RESPONSE_BYTES = 1 << 20;
    MAX_ERROR_BODY_CHARS = 2e3;
    SAFE_ERROR_KEYS = /* @__PURE__ */ new Set(["error", "error_description", "error_uri"]);
    WorkloadIdentityError = class extends AnthropicError {
      constructor(message, statusCode = null, body = null, requestId = null) {
        super(message);
        this.statusCode = statusCode;
        this.body = body;
        this.requestId = requestId;
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/time.mjs
function nowAsSeconds() {
  return Math.floor(Date.now() / 1e3);
}
var init_time = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/time.mjs"() {
  }
});

// node_modules/@anthropic-ai/sdk/lib/credentials/token-cache.mjs
var TokenCache;
var init_token_cache = __esm({
  "node_modules/@anthropic-ai/sdk/lib/credentials/token-cache.mjs"() {
    init_types();
    init_time();
    TokenCache = class {
      constructor(provider, onAdvisoryRefreshError) {
        this.cached = null;
        this.pendingRefresh = null;
        this.nextForce = false;
        this.lastAdvisoryError = 0;
        this.provider = provider;
        this.onAdvisoryRefreshError = onAdvisoryRefreshError;
      }
      async getToken() {
        const force = this.nextForce;
        this.nextForce = false;
        const cached = this.cached;
        if (force || cached == null) {
          const token2 = await this.refresh(force);
          return token2.token;
        }
        if (cached.expiresAt == null) {
          return cached.token;
        }
        const remaining = cached.expiresAt - nowAsSeconds();
        if (remaining > ADVISORY_REFRESH_THRESHOLD_IN_SECONDS) {
          return cached.token;
        }
        if (remaining > MANDATORY_REFRESH_THRESHOLD_IN_SECONDS) {
          this.backgroundRefresh();
          return cached.token;
        }
        const token = await this.refresh();
        return token.token;
      }
      /**
       * Clears the cached token and marks the next {@link getToken} as a forced
       * refresh, so the underlying provider bypasses any on-disk freshness check.
       * Called after a 401 — the server has just told us the token is bad even
       * if its `expires_at` still looks fresh.
       */
      invalidate() {
        this.cached = null;
        this.nextForce = true;
      }
      /**
       * Mandatory refresh. Joins any in-flight refresh unless forced — a forced
       * refresh must not coalesce into a non-forced one that may re-serve the
       * same stale disk token.
       */
      refresh(force = false) {
        if (this.pendingRefresh && !force) {
          return this.pendingRefresh;
        }
        return this.doRefresh(force);
      }
      /**
       * Advisory background refresh. Shares the same in-flight promise as
       * mandatory refreshes for deduplication, but swallows errors so the
       * stale cached token keeps being served. Backs off for
       * {@link ADVISORY_REFRESH_BACKOFF_IN_SECONDS} after a failure so an
       * outage during the advisory window doesn't hammer the token endpoint.
       */
      backgroundRefresh() {
        if (this.pendingRefresh) {
          return;
        }
        if (nowAsSeconds() - this.lastAdvisoryError < ADVISORY_REFRESH_BACKOFF_IN_SECONDS) {
          return;
        }
        this.doRefresh().catch((err) => {
          this.lastAdvisoryError = nowAsSeconds();
          this.onAdvisoryRefreshError?.(err);
        });
      }
      /**
       * Core refresh. Sets {@link pendingRefresh} so concurrent callers
       * (both advisory and mandatory) coalesce into a single provider call.
       */
      doRefresh(force = false) {
        this.pendingRefresh = this.provider(force ? { forceRefresh: true } : void 0).then((token) => {
          this.cached = token;
          this.pendingRefresh = null;
          return token;
        }, (err) => {
          this.pendingRefresh = null;
          throw err;
        });
        return this.pendingRefresh;
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/env.mjs
var readEnv;
var init_env = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/env.mjs"() {
    readEnv = (env) => {
      if (typeof globalThis.process !== "undefined") {
        return globalThis.process.env?.[env]?.trim() || void 0;
      }
      if (typeof globalThis.Deno !== "undefined") {
        return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
      }
      return void 0;
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/bytes.mjs
function concatBytes(buffers) {
  let length = 0;
  for (const buffer of buffers) {
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers) {
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
function encodeUTF8(str) {
  let encoder2;
  return (encodeUTF8_ ?? (encoder2 = new globalThis.TextEncoder(), encodeUTF8_ = encoder2.encode.bind(encoder2)))(str);
}
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}
var encodeUTF8_, decodeUTF8_;
var init_bytes = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/bytes.mjs"() {
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/base64.mjs
var init_base64 = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/base64.mjs"() {
    init_error();
    init_bytes();
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/log.mjs
function noop() {
}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
function filterLogger(logger, logLevel) {
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  return filterLogger(logger, logLevel);
}
function defaultLogger() {
  const envLevel = readEnv("ANTHROPIC_LOG");
  if (!cachedDefaultLogger || envLevel !== lastEnvLevel) {
    lastEnvLevel = envLevel;
    cachedDefaultLogger = filterLogger(console, parseLogLevel(envLevel, "process.env['ANTHROPIC_LOG']", filterLogger(console, defaultLogLevel)) ?? defaultLogLevel);
  }
  return cachedDefaultLogger;
}
var defaultLogLevel, levelNumbers, parseLogLevel, noopLogger, cachedLoggers, lastEnvLevel, cachedDefaultLogger, formatRequestDetails;
var init_log = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/log.mjs"() {
    init_values();
    init_env();
    defaultLogLevel = "warn";
    levelNumbers = {
      off: 0,
      error: 200,
      warn: 300,
      info: 400,
      debug: 500
    };
    parseLogLevel = (maybeLevel, sourceName, logger) => {
      if (!maybeLevel) {
        return void 0;
      }
      if (hasOwn(levelNumbers, maybeLevel)) {
        return maybeLevel;
      }
      logger.warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
      return void 0;
    };
    noopLogger = {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop
    };
    cachedLoggers = /* @__PURE__ */ new WeakMap();
    formatRequestDetails = (details) => {
      if (details.options) {
        details.options = { ...details.options };
        delete details.options["headers"];
      }
      if (details.headers) {
        details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
          name,
          name.toLowerCase() === "authorization" || name.toLowerCase() === "api-key" || name.toLowerCase() === "x-api-key" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
        ]));
      }
      if ("retryOfRequestLogID" in details) {
        if (details.retryOfRequestLogID) {
          details.retryOf = details.retryOfRequestLogID;
        }
        delete details.retryOfRequestLogID;
      }
      return details;
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils.mjs
var init_utils2 = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils.mjs"() {
    init_values();
    init_base64();
    init_env();
    init_log();
    init_uuid();
    init_sleep();
    init_query();
  }
});

// node_modules/@anthropic-ai/sdk/core/credentials.mjs
function validateProfileName(name) {
  if (!name) {
    throw new Error("profile name is empty");
  }
  if (name === "." || name === "..") {
    throw new Error(`profile name "${name}" is not allowed`);
  }
  if (name.includes("/") || name.includes("\\")) {
    throw new Error(`profile name "${name}" must not contain path separators`);
  }
  if (!PROFILE_NAME_PATTERN.test(name)) {
    throw new Error(`profile name "${name}" contains disallowed characters (allowed: letters, digits, '_', '.', '-')`);
  }
}
var CREDENTIALS_FILE_VERSION, PROFILE_NAME_PATTERN, loadConfigWithSource, getCredentialsPath, getRootConfigPath, supportsLocalConfigFiles, getActiveProfileName;
var init_credentials = __esm({
  "node_modules/@anthropic-ai/sdk/core/credentials.mjs"() {
    init_detect_platform();
    init_utils2();
    CREDENTIALS_FILE_VERSION = "1.0";
    PROFILE_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
    loadConfigWithSource = async (profile) => {
      var _a2, _b;
      const rootConfigPath = await getRootConfigPath();
      if (rootConfigPath === null) {
        return null;
      }
      const profileName = profile ?? await getActiveProfileName();
      if (profileName === null) {
        return null;
      }
      validateProfileName(profileName);
      const fs4 = await import("node:fs");
      const path5 = await import("node:path");
      const configPath = path5.join(rootConfigPath, "configs", `${profileName}.json`);
      let configRaw;
      try {
        configRaw = await fs4.promises.readFile(configPath, "utf-8");
      } catch (err) {
        if (err?.code !== "ENOENT") {
          throw new Error(`failed to read config file ${configPath}: ${err}`);
        }
        configRaw = null;
      }
      if (configRaw === null) {
        const organizationId = readEnv("ANTHROPIC_ORGANIZATION_ID");
        const identityTokenFile = readEnv("ANTHROPIC_IDENTITY_TOKEN_FILE");
        const federationRuleId = readEnv("ANTHROPIC_FEDERATION_RULE_ID");
        if (federationRuleId && organizationId) {
          return {
            fromFile: false,
            config: {
              organization_id: organizationId,
              // A defaulted-but-empty CI variable (`ANTHROPIC_WORKSPACE_ID=""`) is
              // treated as unset — readEnv coerces empty to undefined, and the body
              // builder's truthy check skips it — so `"workspace_id": ""` never goes
              // on the wire.
              workspace_id: readEnv("ANTHROPIC_WORKSPACE_ID"),
              base_url: readEnv("ANTHROPIC_BASE_URL"),
              authentication: {
                type: "oidc_federation",
                federation_rule_id: federationRuleId,
                service_account_id: readEnv("ANTHROPIC_SERVICE_ACCOUNT_ID"),
                identity_token: identityTokenFile ? { source: "file", path: identityTokenFile } : void 0,
                scope: readEnv("ANTHROPIC_SCOPE")
              }
            }
          };
        }
        return null;
      }
      let config;
      try {
        config = JSON.parse(configRaw);
      } catch (err) {
        throw new Error(`failed to parse config file ${configPath}: ${err}`);
      }
      if (!config.authentication) {
        throw new Error(`config file ${configPath} is missing "authentication"`);
      }
      const authType = config.authentication.type;
      if (authType !== "oidc_federation" && authType !== "user_oauth") {
        throw new Error(`authentication.type "${authType}" is not a known authentication type`);
      }
      config.organization_id ?? (config.organization_id = readEnv("ANTHROPIC_ORGANIZATION_ID"));
      config.workspace_id ?? (config.workspace_id = readEnv("ANTHROPIC_WORKSPACE_ID"));
      config.base_url ?? (config.base_url = readEnv("ANTHROPIC_BASE_URL"));
      (_a2 = config.authentication).scope ?? (_a2.scope = readEnv("ANTHROPIC_SCOPE"));
      if (config.authentication.type === "oidc_federation") {
        if (!config.authentication.identity_token) {
          const identityTokenFile = readEnv("ANTHROPIC_IDENTITY_TOKEN_FILE");
          if (identityTokenFile) {
            config.authentication.identity_token = {
              source: "file",
              path: identityTokenFile
            };
          }
        }
        if (!config.authentication.federation_rule_id) {
          config.authentication.federation_rule_id = readEnv("ANTHROPIC_FEDERATION_RULE_ID") ?? "";
        }
        (_b = config.authentication).service_account_id ?? (_b.service_account_id = readEnv("ANTHROPIC_SERVICE_ACCOUNT_ID"));
      }
      return { config, fromFile: true };
    };
    getCredentialsPath = async (config, profile) => {
      if (config?.authentication.credentials_path) {
        return config.authentication.credentials_path;
      }
      const rootConfigPath = await getRootConfigPath();
      if (!rootConfigPath) {
        return null;
      }
      const profileName = profile ?? await getActiveProfileName();
      if (!profileName) {
        return null;
      }
      validateProfileName(profileName);
      const path5 = await import("node:path");
      return path5.join(rootConfigPath, "credentials", `${profileName}.json`);
    };
    getRootConfigPath = async () => {
      if (!supportsLocalConfigFiles()) {
        return null;
      }
      const path5 = await import("node:path");
      const configDir = readEnv("ANTHROPIC_CONFIG_DIR");
      if (configDir) {
        return configDir;
      }
      const os = getPlatformHeaders()["X-Stainless-OS"];
      if (os === "Windows") {
        const appData = readEnv("APPDATA");
        if (appData) {
          return path5.join(appData, "Anthropic");
        }
        const userProfile = readEnv("USERPROFILE");
        if (userProfile) {
          return path5.join(userProfile, "AppData", "Roaming", "Anthropic");
        }
        return null;
      }
      const xdgConfigHome = readEnv("XDG_CONFIG_HOME");
      if (xdgConfigHome) {
        return path5.join(xdgConfigHome, "anthropic");
      }
      const home = readEnv("HOME");
      if (home) {
        return path5.join(home, ".config", "anthropic");
      }
      return null;
    };
    supportsLocalConfigFiles = () => {
      const runtime = getPlatformHeaders()["X-Stainless-Runtime"];
      return runtime === "node" || runtime === "deno";
    };
    getActiveProfileName = async () => {
      const rootConfigPath = await getRootConfigPath();
      if (!rootConfigPath) {
        return null;
      }
      const profileName = readEnv("ANTHROPIC_PROFILE");
      if (profileName) {
        return profileName;
      }
      const fs4 = await import("node:fs");
      const path5 = await import("node:path");
      const filePath = path5.join(rootConfigPath, "active_config");
      try {
        return (await fs4.promises.readFile(filePath, "utf-8")).trim() || "default";
      } catch (err) {
        if (err?.code !== "ENOENT") {
          throw new Error(`failed to read ${filePath}: ${err}`);
        }
        return "default";
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/lib/credentials/identity-token.mjs
function identityTokenFromFile(path5) {
  if (!path5) {
    throw new AnthropicError("Identity token file path is empty");
  }
  return async () => {
    const fs4 = await import("node:fs");
    let content;
    try {
      content = await fs4.promises.readFile(path5, "utf-8");
    } catch (err) {
      throw new AnthropicError(`Failed to read identity token file at ${path5}: ${err}`);
    }
    const token = content.trim();
    if (!token) {
      throw new AnthropicError(`Identity token file at ${path5} is empty`);
    }
    return token;
  };
}
function identityTokenFromValue(token) {
  if (!token) {
    throw new AnthropicError("Identity token value is empty");
  }
  return () => token;
}
var init_identity_token = __esm({
  "node_modules/@anthropic-ai/sdk/lib/credentials/identity-token.mjs"() {
    init_error();
  }
});

// node_modules/@anthropic-ai/sdk/lib/credentials/oidc-federation.mjs
function oidcFederationProvider(config) {
  return async () => {
    requireSecureTokenEndpoint(config.baseURL);
    const jwt = await config.identityTokenProvider();
    if (jwt.length > 16 * 1024) {
      throw new WorkloadIdentityError(`Identity token is ${Math.ceil(jwt.length / 1024)} KiB, exceeds the 16 KiB assertion limit`);
    }
    const body = {
      grant_type: GRANT_TYPE_JWT_BEARER,
      assertion: jwt,
      federation_rule_id: config.federationRuleId,
      organization_id: config.organizationId
    };
    if (config.serviceAccountId) {
      body["service_account_id"] = config.serviceAccountId;
    }
    if (config.workspaceId) {
      body["workspace_id"] = config.workspaceId;
    }
    const url = `${config.baseURL}${TOKEN_ENDPOINT}`;
    let resp;
    try {
      resp = await config.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-beta": `${OAUTH_API_BETA_HEADER},${FEDERATION_BETA_HEADER}`,
          "User-Agent": config.userAgent || `anthropic-sdk-typescript/${VERSION} oidcFederationProvider`
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new WorkloadIdentityError(`Failed to reach token endpoint ${url}: ${err}`);
    }
    const requestId = resp.headers.get("Request-Id");
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      const redacted = redactSensitive(text);
      let hint = "";
      if (resp.status === 401) {
        const hintMiddle = config.workspaceId ? "" : "If your federation rule is scoped to multiple workspaces, set the ANTHROPIC_WORKSPACE_ID environment variable, the 'workspace_id' config key, or the `workspaceId` option. ";
        hint = ` Ensure your federation rule matches your identity token. ${hintMiddle}View your authentication events in the Workload identity page of Claude Console for more details.`;
      }
      throw new WorkloadIdentityError(`Token exchange failed with status ${resp.status}${requestId ? ` (request-id ${requestId})` : ""}: ${redacted}${hint}`, resp.status, redacted, requestId);
    }
    const data = await parseTokenResponse(resp, requestId);
    const expiresIn = Number(data.expires_in);
    if (!Number.isFinite(expiresIn)) {
      throw new WorkloadIdentityError(`Token endpoint response missing required fields: ${JSON.stringify(redactSensitive(data))}`, resp.status, redactSensitive(data), requestId);
    }
    return {
      token: data.access_token,
      expiresAt: nowAsSeconds() + expiresIn
    };
  };
}
var init_oidc_federation = __esm({
  "node_modules/@anthropic-ai/sdk/lib/credentials/oidc-federation.mjs"() {
    init_types();
    init_time();
    init_version();
  }
});

// node_modules/@anthropic-ai/sdk/lib/credentials/user-oauth.mjs
function userOAuthProvider(config) {
  return async (opts) => {
    const fs4 = await import("node:fs");
    await checkCredentialsFileSafety(config.credentialsPath, config.onSafetyWarning);
    let raw;
    try {
      raw = await fs4.promises.readFile(config.credentialsPath, "utf-8");
    } catch (err) {
      throw new WorkloadIdentityError(`Credentials file not found at ${config.credentialsPath}: ${err}`);
    }
    let creds;
    try {
      creds = JSON.parse(raw);
    } catch (err) {
      throw new WorkloadIdentityError(`Credentials file at ${config.credentialsPath} is not valid JSON: ${err}`);
    }
    const accessToken = creds.access_token;
    if (!accessToken) {
      throw new WorkloadIdentityError(`Credentials file at ${config.credentialsPath} must include 'access_token'`);
    }
    const expiresAt = creds.expires_at;
    if (!opts?.forceRefresh && (expiresAt == null || nowAsSeconds() < expiresAt - MANDATORY_REFRESH_THRESHOLD_IN_SECONDS)) {
      return { token: accessToken, expiresAt: expiresAt ?? null };
    }
    const refreshToken = creds.refresh_token;
    if (!config.clientId || !refreshToken) {
      throw new WorkloadIdentityError(`Access token at ${config.credentialsPath} has expired and no refresh is available (client_id ${config.clientId ? "set" : "empty"}, refresh_token ${refreshToken ? "set" : "empty"})`);
    }
    requireSecureTokenEndpoint(config.baseURL);
    const body = {
      grant_type: GRANT_TYPE_REFRESH_TOKEN,
      refresh_token: refreshToken,
      client_id: config.clientId
    };
    const url = `${config.baseURL}${TOKEN_ENDPOINT}`;
    let resp;
    try {
      resp = await config.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-beta": OAUTH_API_BETA_HEADER,
          "User-Agent": config.userAgent || `anthropic-sdk-typescript/${VERSION} userOAuthProvider`
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new WorkloadIdentityError(`User OAuth refresh failed to reach token endpoint: ${err}`);
    }
    const requestId = resp.headers.get("Request-Id");
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new WorkloadIdentityError(`User OAuth refresh failed (HTTP ${resp.status}): ${redactSensitive(text)}`, resp.status, redactSensitive(text), requestId);
    }
    const data = await parseTokenResponse(resp, requestId);
    const expiresIn = Number(data.expires_in);
    if (!Number.isFinite(expiresIn)) {
      throw new WorkloadIdentityError(`User OAuth refresh response missing or invalid expires_in: ${JSON.stringify(redactSensitive(data))}`, resp.status, redactSensitive(data), requestId);
    }
    const newExpiresAt = nowAsSeconds() + expiresIn;
    const newRefreshToken = data.refresh_token || refreshToken;
    await writeCredentialsFileAtomic(config.credentialsPath, {
      ...creds,
      version: CREDENTIALS_FILE_VERSION,
      type: "oauth_token",
      access_token: data.access_token,
      expires_at: newExpiresAt,
      refresh_token: newRefreshToken
    });
    return { token: data.access_token, expiresAt: newExpiresAt };
  };
}
var init_user_oauth = __esm({
  "node_modules/@anthropic-ai/sdk/lib/credentials/user-oauth.mjs"() {
    init_credentials();
    init_types();
    init_time();
    init_version();
  }
});

// node_modules/@anthropic-ai/sdk/lib/credentials/credential-chain.mjs
function resolveCredentialsFromConfig(config, options) {
  const credentialsPath = config.authentication.credentials_path ?? null;
  const effectiveBaseURL = (config.base_url || options.baseURL).replace(/\/+$/, "");
  const provider = buildProvider(config, credentialsPath, effectiveBaseURL, options);
  const extraHeaders = {};
  if (config.workspace_id && config.authentication.type === "user_oauth") {
    extraHeaders["anthropic-workspace-id"] = config.workspace_id;
  }
  return { provider, extraHeaders, baseURL: config.base_url || void 0 };
}
async function defaultCredentials(options, profile) {
  const loaded = await loadConfigWithSource(profile);
  if (!loaded) {
    return null;
  }
  const { config, fromFile } = loaded;
  const withPath = config.authentication.credentials_path || !fromFile ? config : {
    ...config,
    authentication: {
      ...config.authentication,
      credentials_path: await getCredentialsPath(config, profile) ?? void 0
    }
  };
  return resolveCredentialsFromConfig(withPath, options);
}
function buildProvider(config, credentialsPath, baseURL, options) {
  switch (config.authentication.type) {
    case "oidc_federation": {
      const auth = config.authentication;
      const identityProvider = resolveIdentityTokenProvider(auth);
      if (!identityProvider) {
        throw new WorkloadIdentityError("oidc_federation config requires an identity token (set authentication.identity_token, ANTHROPIC_IDENTITY_TOKEN_FILE, or ANTHROPIC_IDENTITY_TOKEN)");
      }
      if (!auth.federation_rule_id) {
        throw new WorkloadIdentityError("oidc_federation config requires 'federation_rule_id'. Set it in authentication.federation_rule_id in your profile, or via ANTHROPIC_FEDERATION_RULE_ID (profile takes precedence).");
      }
      if (!config.organization_id) {
        throw new WorkloadIdentityError("oidc_federation config requires organization_id (set ANTHROPIC_ORGANIZATION_ID or config.organization_id)");
      }
      const exchange = oidcFederationProvider({
        identityTokenProvider: identityProvider,
        federationRuleId: auth.federation_rule_id,
        organizationId: config.organization_id,
        serviceAccountId: auth.service_account_id,
        workspaceId: config.workspace_id,
        baseURL,
        fetch: options.fetch,
        userAgent: options.userAgent
      });
      if (credentialsPath) {
        return cachedExchangeProvider(exchange, credentialsPath, options.onCacheWriteError, options.onSafetyWarning);
      }
      return exchange;
    }
    case "user_oauth": {
      if (!credentialsPath) {
        throw new WorkloadIdentityError("user_oauth config requires authentication.credentials_path (or load via a profile so it defaults to <config_dir>/credentials/<profile>.json)");
      }
      return userOAuthProvider({
        credentialsPath,
        clientId: config.authentication.client_id,
        baseURL,
        fetch: options.fetch,
        userAgent: options.userAgent,
        onSafetyWarning: options.onSafetyWarning
      });
    }
    default: {
      const t = config.authentication.type;
      throw new WorkloadIdentityError(`authentication.type "${t}" is not a known authentication type`);
    }
  }
}
function resolveIdentityTokenProvider(auth) {
  if (auth.identity_token) {
    const source = auth.identity_token.source;
    if (source !== "file") {
      throw new WorkloadIdentityError(`identity_token.source "${source}" is not supported by this SDK version (only "file")`);
    }
    if (!auth.identity_token.path) {
      throw new WorkloadIdentityError(`identity_token.source "file" requires a non-empty path`);
    }
    return identityTokenFromFile(auth.identity_token.path);
  }
  const tokenFile = readEnv("ANTHROPIC_IDENTITY_TOKEN_FILE");
  if (tokenFile) {
    return identityTokenFromFile(tokenFile);
  }
  const tokenValue = readEnv("ANTHROPIC_IDENTITY_TOKEN");
  if (tokenValue) {
    return identityTokenFromValue(tokenValue);
  }
  return null;
}
function cachedExchangeProvider(exchange, credentialsPath, onCacheWriteError, onSafetyWarning) {
  return async (opts) => {
    const fs4 = await import("node:fs");
    await checkCredentialsFileSafety(credentialsPath, onSafetyWarning);
    let existing;
    try {
      const raw = await fs4.promises.readFile(credentialsPath, "utf-8");
      existing = JSON.parse(raw);
      const token = existing?.["access_token"];
      if (token && !opts?.forceRefresh) {
        const expiresAt = existing?.["expires_at"];
        if (expiresAt == null || nowAsSeconds() < expiresAt - MANDATORY_REFRESH_THRESHOLD_IN_SECONDS) {
          return { token, expiresAt: expiresAt ?? null };
        }
      }
    } catch (err) {
      const code = err?.code;
      if (code !== "ENOENT" && !(err instanceof SyntaxError)) {
        onCacheWriteError?.(err);
      }
    }
    const result = await exchange(opts);
    try {
      await writeCredentialsFileAtomic(credentialsPath, {
        ...existing ?? {},
        version: CREDENTIALS_FILE_VERSION,
        type: "oauth_token",
        access_token: result.token,
        expires_at: result.expiresAt
      });
    } catch (err) {
      onCacheWriteError?.(err);
    }
    return result;
  };
}
var init_credential_chain = __esm({
  "node_modules/@anthropic-ai/sdk/lib/credentials/credential-chain.mjs"() {
    init_env();
    init_credentials();
    init_types();
    init_time();
    init_identity_token();
    init_oidc_federation();
    init_user_oauth();
  }
});

// node_modules/@anthropic-ai/sdk/internal/decoders/line.mjs
function findNewlineIndex(buffer, startIndex) {
  const newline = 10;
  const carriage = 13;
  for (let i = startIndex ?? 0; i < buffer.length; i++) {
    if (buffer[i] === newline) {
      return { preceding: i, index: i + 1, carriage: false };
    }
    if (buffer[i] === carriage) {
      return { preceding: i, index: i + 1, carriage: true };
    }
  }
  return null;
}
function findDoubleNewlineIndex(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
}
var _LineDecoder_buffer, _LineDecoder_carriageReturnIndex, LineDecoder;
var init_line = __esm({
  "node_modules/@anthropic-ai/sdk/internal/decoders/line.mjs"() {
    init_tslib();
    init_bytes();
    LineDecoder = class {
      constructor() {
        _LineDecoder_buffer.set(this, void 0);
        _LineDecoder_carriageReturnIndex.set(this, void 0);
        __classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array(), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
      }
      decode(chunk) {
        if (chunk == null) {
          return [];
        }
        const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
        __classPrivateFieldSet(this, _LineDecoder_buffer, concatBytes([__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
        const lines = [];
        let patternIndex;
        while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
          if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
            __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
            continue;
          }
          if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
            lines.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
            __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
            __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
            continue;
          }
          const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
          const line = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
          lines.push(line);
          __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
          __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        }
        return lines;
      }
      flush() {
        if (!__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
          return [];
        }
        return this.decode("\n");
      }
    };
    _LineDecoder_buffer = /* @__PURE__ */ new WeakMap(), _LineDecoder_carriageReturnIndex = /* @__PURE__ */ new WeakMap();
    LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]);
    LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
  }
});

// node_modules/@anthropic-ai/sdk/core/streaming.mjs
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
      throw new AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
    }
    throw new AnthropicError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();
  const iter = ReadableStreamToAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array();
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}
function partition(str, delimiter2) {
  const index = str.indexOf(delimiter2);
  if (index !== -1) {
    return [str.substring(0, index), delimiter2, str.substring(index + delimiter2.length)];
  }
  return [str, "", ""];
}
var _Stream_client, Stream, SSEDecoder;
var init_streaming = __esm({
  "node_modules/@anthropic-ai/sdk/core/streaming.mjs"() {
    init_tslib();
    init_error();
    init_shims();
    init_line();
    init_shims();
    init_errors();
    init_values();
    init_bytes();
    init_log();
    init_error();
    Stream = class _Stream {
      constructor(iterator, controller, client) {
        this.iterator = iterator;
        _Stream_client.set(this, void 0);
        this.controller = controller;
        __classPrivateFieldSet(this, _Stream_client, client, "f");
      }
      /**
       * Iterate the raw Server-Sent Events from `response` — `{event, data, raw}`
       * objects, before any JSON parsing or event-name filtering.
       *
       * This reads `response.body` directly (not a clone), so the response is
       * consumed. Use this in middleware that fully replaces the stream body; for
       * read-only observation of parsed events, use `ctx.parse()` instead.
       */
      static rawEvents(response, controller = new AbortController()) {
        return _iterSSEMessages(response, controller);
      }
      static fromSSEResponse(response, controller, client) {
        let consumed = false;
        const logger = client ? loggerFor(client) : console;
        async function* iterator() {
          if (consumed) {
            throw new AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const sse of _iterSSEMessages(response, controller)) {
              if (sse.event === "completion") {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              }
              if (sse.event === "message_start" || sse.event === "message_delta" || sse.event === "message_stop" || sse.event === "content_block_start" || sse.event === "content_block_delta" || sse.event === "content_block_stop" || sse.event === "message" || sse.event === "user.message" || sse.event === "user.interrupt" || sse.event === "user.tool_confirmation" || sse.event === "user.custom_tool_result" || sse.event === "user.tool_result" || sse.event === "agent.message" || sse.event === "agent.thinking" || sse.event === "agent.tool_use" || sse.event === "agent.tool_result" || sse.event === "agent.mcp_tool_use" || sse.event === "agent.mcp_tool_result" || sse.event === "agent.custom_tool_use" || sse.event === "agent.thread_context_compacted" || sse.event === "session.status_running" || sse.event === "session.status_idle" || sse.event === "session.status_rescheduled" || sse.event === "session.status_terminated" || sse.event === "session.error" || sse.event === "session.deleted" || sse.event === "session.updated" || sse.event === "span.model_request_start" || sse.event === "span.model_request_end" || sse.event === "span.outcome_evaluation_start" || sse.event === "span.outcome_evaluation_ongoing" || sse.event === "span.outcome_evaluation_end" || sse.event === "user.define_outcome" || sse.event === "agent.thread_message_received" || sse.event === "agent.thread_message_sent" || sse.event === "agent.session_thread_message_received" || sse.event === "agent.session_thread_message_sent" || sse.event === "session.thread_created" || sse.event === "session.thread_status_created" || sse.event === "session.thread_status_running" || sse.event === "session.thread_status_idle" || sse.event === "session.thread_status_rescheduled" || sse.event === "session.thread_status_terminated" || sse.event === "system.message") {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              }
              if (sse.event === "ping") {
                continue;
              }
              if (sse.event === "error") {
                const body = safeJSON(sse.data) ?? sse.data;
                const type = body?.error?.type;
                throw new APIError(void 0, body, void 0, response.headers, type);
              }
            }
            done = true;
          } catch (e) {
            if (isAbortError(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
          }
        }
        return new _Stream(iterator, controller, client);
      }
      /**
       * Generates a Stream from a newline-separated ReadableStream
       * where each item is a JSON value.
       */
      static fromReadableStream(readableStream, controller, client) {
        let consumed = false;
        async function* iterLines() {
          const lineDecoder = new LineDecoder();
          const iter = ReadableStreamToAsyncIterable(readableStream);
          for await (const chunk of iter) {
            for (const line of lineDecoder.decode(chunk)) {
              yield line;
            }
          }
          for (const line of lineDecoder.flush()) {
            yield line;
          }
        }
        async function* iterator() {
          if (consumed) {
            throw new AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const line of iterLines()) {
              if (done)
                continue;
              if (line)
                yield JSON.parse(line);
            }
            done = true;
          } catch (e) {
            if (isAbortError(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
          }
        }
        return new _Stream(iterator, controller, client);
      }
      [(_Stream_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        return this.iterator();
      }
      /**
       * Splits the stream into two streams which can be
       * independently read from at different speeds.
       */
      tee() {
        const left = [];
        const right = [];
        const iterator = this.iterator();
        const teeIterator = (queue) => {
          return {
            next: () => {
              if (queue.length === 0) {
                const result = iterator.next();
                left.push(result);
                right.push(result);
              }
              return queue.shift();
            }
          };
        };
        return [
          new _Stream(() => teeIterator(left), this.controller, __classPrivateFieldGet(this, _Stream_client, "f")),
          new _Stream(() => teeIterator(right), this.controller, __classPrivateFieldGet(this, _Stream_client, "f"))
        ];
      }
      /**
       * Converts this stream to a newline-separated ReadableStream of
       * JSON stringified values in the stream
       * which can be turned back into a Stream with `Stream.fromReadableStream()`.
       */
      toReadableStream() {
        const self = this;
        let iter;
        return makeReadableStream({
          async start() {
            iter = self[Symbol.asyncIterator]();
          },
          async pull(ctrl) {
            try {
              const { value, done } = await iter.next();
              if (done)
                return ctrl.close();
              const bytes = encodeUTF8(JSON.stringify(value) + "\n");
              ctrl.enqueue(bytes);
            } catch (err) {
              ctrl.error(err);
            }
          },
          async cancel() {
            await iter.return?.();
          }
        });
      }
    };
    SSEDecoder = class {
      constructor() {
        this.event = null;
        this.data = [];
        this.chunks = [];
      }
      decode(line) {
        if (line.endsWith("\r")) {
          line = line.substring(0, line.length - 1);
        }
        if (!line) {
          if (!this.event && !this.data.length)
            return null;
          const sse = {
            event: this.event,
            data: this.data.join("\n"),
            raw: this.chunks
          };
          this.event = null;
          this.data = [];
          this.chunks = [];
          return sse;
        }
        this.chunks.push(line);
        if (line.startsWith(":")) {
          return null;
        }
        let [fieldname, _, value] = partition(line, ":");
        if (value.startsWith(" ")) {
          value = value.substring(1);
        }
        if (fieldname === "event") {
          this.event = value;
        } else if (fieldname === "data") {
          this.data.push(value);
        }
        return null;
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/parse.mjs
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
    if (props.options.stream) {
      loggerFor(client).debug("response", response.status, response.url, response.headers, response.body);
      return Stream.fromSSEResponse(response, props.controller);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0") {
        return void 0;
      }
      const json2 = await response.json();
      return addRequestID(json2, response);
    }
    const text = await response.text();
    return text;
  })();
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}
function addRequestID(value, response) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return Object.defineProperty(value, "_request_id", {
    value: response.headers.get("request-id"),
    enumerable: false
  });
}
var init_parse = __esm({
  "node_modules/@anthropic-ai/sdk/internal/parse.mjs"() {
    init_streaming();
    init_log();
  }
});

// node_modules/@anthropic-ai/sdk/core/middleware.mjs
function isFetchOriginError(err) {
  return typeof err === "object" && err !== null && fetchOriginErrors.has(err);
}
function isRetryableError(err) {
  const seen = /* @__PURE__ */ new Set();
  while (typeof err === "object" && err !== null && !seen.has(err)) {
    seen.add(err);
    if (isFetchOriginError(err) || isAbortError(err) || err instanceof APIConnectionError || err instanceof RetryableError) {
      return true;
    }
    err = err.cause;
  }
  return false;
}
function wrapFetchWithMiddleware(fetchFn, middleware, options, client) {
  return async (url, init = {}) => {
    if (middleware.length === 0) {
      return fetchFn.call(void 0, url, init);
    }
    const headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers);
    const response = await applyMiddleware(fetchFn, middleware, options, client)({
      ...init,
      headers,
      url: typeof url === "string" ? url : url instanceof URL ? url.href : url.url
    });
    if (response.bodyUsed || response.body?.locked) {
      throw new AnthropicError("middleware consumed the response body; use response.clone() to inspect it, or return new Response(body, response) to consume and replace it");
    }
    return response;
  };
}
function createMiddlewareContext(options, client) {
  const cache = /* @__PURE__ */ new WeakMap();
  return {
    options,
    // Resolved per chain, so changes to the client's `logLevel`/`logger`
    // apply to subsequent requests.
    logger: client ? loggerFor(client) : defaultLogger(),
    parse(response) {
      if (options?.stream && response.ok) {
        return parseMiddlewareResponse(response, options);
      }
      let parsed = cache.get(response);
      if (!parsed) {
        parsed = parseMiddlewareResponse(response, options);
        cache.set(response, parsed);
      }
      return parsed;
    }
  };
}
async function parseMiddlewareResponse(response, options) {
  if (response.bodyUsed || response.body?.locked) {
    throw new AnthropicError("cannot ctx.parse() a response whose body was already consumed; call ctx.parse() instead of reading the body, or read via response.clone()");
  }
  if (options?.stream && response.ok) {
    return Stream.fromSSEResponse(response.clone(), new AbortController());
  }
  if (response.status === 204) {
    return null;
  }
  if (options?.__binaryResponse) {
    return response;
  }
  const contentType = response.headers.get("content-type");
  const mediaType = contentType?.split(";")[0]?.trim();
  const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
  if (isJSON) {
    if (response.headers.get("content-length") === "0") {
      return void 0;
    }
    return addRequestID(await response.clone().json(), response);
  }
  return await response.clone().text();
}
function applyMiddleware(fetchFn, middleware, options, client) {
  let next = async ({ url, ...init }) => {
    try {
      return await fetchFn.call(void 0, url, init);
    } catch (err) {
      const error = castToError(err);
      fetchOriginErrors.add(error);
      throw error;
    }
  };
  const ctx = createMiddlewareContext(options, client);
  for (let i = middleware.length - 1; i >= 0; i--) {
    const mw = middleware[i];
    const nextInner = next;
    next = async (request) => mw(request, nextInner, ctx);
  }
  return next;
}
var fetchOriginErrors;
var init_middleware = __esm({
  "node_modules/@anthropic-ai/sdk/core/middleware.mjs"() {
    init_errors();
    init_parse();
    init_log();
    init_error();
    init_streaming();
    fetchOriginErrors = /* @__PURE__ */ new WeakSet();
  }
});

// node_modules/@anthropic-ai/sdk/core/api-promise.mjs
var _APIPromise_client, APIPromise;
var init_api_promise = __esm({
  "node_modules/@anthropic-ai/sdk/core/api-promise.mjs"() {
    init_tslib();
    init_parse();
    APIPromise = class _APIPromise extends Promise {
      constructor(client, responsePromise, parseResponse = defaultParseResponse) {
        super((resolve4) => {
          resolve4(null);
        });
        this.responsePromise = responsePromise;
        this.parseResponse = parseResponse;
        _APIPromise_client.set(this, void 0);
        __classPrivateFieldSet(this, _APIPromise_client, client, "f");
      }
      _thenUnwrap(transform) {
        return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => addRequestID(transform(await this.parseResponse(client, props), props), props.response));
      }
      /**
       * Gets the raw `Response` instance instead of parsing the response
       * data.
       *
       * If you want to parse the response body but still get the `Response`
       * instance, you can use {@link withResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      asResponse() {
        return this.responsePromise.then((p) => p.response);
      }
      /**
       * Gets the parsed response data, the raw `Response` instance and the ID of the request,
       * returned via the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * If you just want to get the raw `Response` instance without parsing it,
       * you can use {@link asResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      async withResponse() {
        const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
        return { data, response, request_id: response.headers.get("request-id") };
      }
      parse() {
        if (!this.parsedPromise) {
          this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
        }
        return this.parsedPromise;
      }
      then(onfulfilled, onrejected) {
        return this.parse().then(onfulfilled, onrejected);
      }
      catch(onrejected) {
        return this.parse().catch(onrejected);
      }
      finally(onfinally) {
        return this.parse().finally(onfinally);
      }
    };
    _APIPromise_client = /* @__PURE__ */ new WeakMap();
  }
});

// node_modules/@anthropic-ai/sdk/core/pagination.mjs
var _AbstractPage_client, AbstractPage, PagePromise, Page, PageCursor;
var init_pagination = __esm({
  "node_modules/@anthropic-ai/sdk/core/pagination.mjs"() {
    init_tslib();
    init_error();
    init_parse();
    init_api_promise();
    init_values();
    AbstractPage = class {
      constructor(client, response, body, options) {
        _AbstractPage_client.set(this, void 0);
        __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
        this.options = options;
        this.response = response;
        this.body = body;
      }
      hasNextPage() {
        const items = this.getPaginatedItems();
        if (!items.length)
          return false;
        return this.nextPageRequestOptions() != null;
      }
      async getNextPage() {
        const nextOptions = this.nextPageRequestOptions();
        if (!nextOptions) {
          throw new AnthropicError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
        }
        return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
      }
      async *iterPages() {
        let page = this;
        yield page;
        while (page.hasNextPage()) {
          page = await page.getNextPage();
          yield page;
        }
      }
      async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        for await (const page of this.iterPages()) {
          for (const item of page.getPaginatedItems()) {
            yield item;
          }
        }
      }
    };
    PagePromise = class extends APIPromise {
      constructor(client, request, Page2) {
        super(client, request, async (client2, props) => new Page2(client2, props.response, await defaultParseResponse(client2, props), props.options));
      }
      /**
       * Allow auto-paginating iteration on an unawaited list call, eg:
       *
       *    for await (const item of client.items.list()) {
       *      console.log(item)
       *    }
       */
      async *[Symbol.asyncIterator]() {
        const page = await this;
        for await (const item of page) {
          yield item;
        }
      }
    };
    Page = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.has_more = body.has_more || false;
        this.first_id = body.first_id || null;
        this.last_id = body.last_id || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      hasNextPage() {
        if (this.has_more === false) {
          return false;
        }
        return super.hasNextPage();
      }
      nextPageRequestOptions() {
        if (this.options.query?.["before_id"]) {
          const first_id = this.first_id;
          if (!first_id) {
            return null;
          }
          return {
            ...this.options,
            query: {
              ...maybeObj(this.options.query),
              before_id: first_id
            }
          };
        }
        const cursor = this.last_id;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            after_id: cursor
          }
        };
      }
    };
    PageCursor = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.next_page = body.next_page || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      nextPageRequestOptions() {
        const cursor = this.next_page;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            page: cursor
          }
        };
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/uploads.mjs
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value, stripPath) {
  const val = typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "";
  return stripPath ? val.split(/[\\/]/).pop() || void 0 : val;
}
function supportsFormData(fetchObject) {
  const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
  const cached = supportsFormDataMap.get(fetch2);
  if (cached)
    return cached;
  const promise = (async () => {
    try {
      const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
      const data = new FormData();
      if (data.toString() === await new FetchResponse(data).text()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  })();
  supportsFormDataMap.set(fetch2, promise);
  return promise;
}
var checkFileSupport, isAsyncIterable, multipartFormRequestOptions, supportsFormDataMap, createForm, isNamedBlob, addFormValue;
var init_uploads = __esm({
  "node_modules/@anthropic-ai/sdk/internal/uploads.mjs"() {
    init_shims();
    checkFileSupport = () => {
      if (typeof File === "undefined") {
        const { process: process2 } = globalThis;
        const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
        throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
      }
    };
    isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
    multipartFormRequestOptions = async (opts, fetch2, stripFilenames = true) => {
      return { ...opts, body: await createForm(opts.body, fetch2, stripFilenames) };
    };
    supportsFormDataMap = /* @__PURE__ */ new WeakMap();
    createForm = async (body, fetch2, stripFilenames = true) => {
      if (!await supportsFormData(fetch2)) {
        throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
      }
      const form = new FormData();
      await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value, stripFilenames)));
      return form;
    };
    isNamedBlob = (value) => value instanceof Blob && "name" in value;
    addFormValue = async (form, key, value, stripFilenames) => {
      if (value === void 0)
        return;
      if (value == null) {
        throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        form.append(key, String(value));
      } else if (value instanceof Response) {
        let options = {};
        const contentType = value.headers.get("Content-Type");
        if (contentType) {
          options = { type: contentType };
        }
        form.append(key, makeFile([await value.blob()], getName(value, stripFilenames), options));
      } else if (isAsyncIterable(value)) {
        form.append(key, makeFile([await new Response(ReadableStreamFrom(value)).blob()], getName(value, stripFilenames)));
      } else if (isNamedBlob(value)) {
        form.append(key, makeFile([value], getName(value, stripFilenames), { type: value.type }));
      } else if (Array.isArray(value)) {
        await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry, stripFilenames)));
      } else if (typeof value === "object") {
        await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop, stripFilenames)));
      } else {
        throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/to-file.mjs
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  name || (name = getName(value, true));
  if (isFileLike(value)) {
    if (value instanceof File && name == null && options == null) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], name ?? value.name, {
      type: value.type,
      lastModified: value.lastModified,
      ...options
    });
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
  value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}
var isBlobLike, isFileLike, isResponseLike;
var init_to_file = __esm({
  "node_modules/@anthropic-ai/sdk/internal/to-file.mjs"() {
    init_uploads();
    init_uploads();
    isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
    isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
    isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
  }
});

// node_modules/@anthropic-ai/sdk/core/uploads.mjs
var init_uploads2 = __esm({
  "node_modules/@anthropic-ai/sdk/core/uploads.mjs"() {
    init_to_file();
  }
});

// node_modules/@anthropic-ai/sdk/resources/shared.mjs
var init_shared = __esm({
  "node_modules/@anthropic-ai/sdk/resources/shared.mjs"() {
  }
});

// node_modules/@anthropic-ai/sdk/core/resource.mjs
var APIResource;
var init_resource = __esm({
  "node_modules/@anthropic-ai/sdk/core/resource.mjs"() {
    APIResource = class {
      constructor(client) {
        this._client = client;
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/headers.mjs
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === void 0)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, clearSentinel];
      }
      yield [name, value];
    }
  }
}
var brand_privateNullableHeaders, clearSentinel, APPEND_HEADERS, appendHeaderValue, buildHeaders;
var init_headers = __esm({
  "node_modules/@anthropic-ai/sdk/internal/headers.mjs"() {
    init_values();
    brand_privateNullableHeaders = /* @__PURE__ */ Symbol.for("brand.privateNullableHeaders");
    clearSentinel = /* @__PURE__ */ Symbol("clear");
    APPEND_HEADERS = /* @__PURE__ */ new Set(["x-stainless-helper"]);
    appendHeaderValue = (existing, addition) => {
      const tokens = existing ? existing.split(",").map((t) => t.trim()).filter(Boolean) : [];
      for (const tok of addition.split(",").map((t) => t.trim())) {
        if (tok && !tokens.includes(tok))
          tokens.push(tok);
      }
      return tokens.join(", ");
    };
    buildHeaders = (newHeaders) => {
      const targetHeaders = new Headers();
      const nullHeaders = /* @__PURE__ */ new Set();
      for (const headers of newHeaders) {
        const seenHeaders = /* @__PURE__ */ new Set();
        for (const [name, value] of iterateHeaders(headers)) {
          const lowerName = name.toLowerCase();
          if (APPEND_HEADERS.has(lowerName)) {
            if (value === clearSentinel)
              continue;
            if (value === null) {
              targetHeaders.delete(name);
              nullHeaders.add(lowerName);
            } else {
              targetHeaders.set(name, appendHeaderValue(targetHeaders.get(name), value));
              nullHeaders.delete(lowerName);
            }
            continue;
          }
          if (value === clearSentinel || !seenHeaders.has(lowerName)) {
            targetHeaders.delete(name);
            seenHeaders.add(lowerName);
            if (value === clearSentinel)
              continue;
          }
          if (value === null) {
            targetHeaders.delete(name);
            nullHeaders.add(lowerName);
          } else {
            targetHeaders.append(name, value);
            nullHeaders.delete(lowerName);
          }
        }
      }
      return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/path.mjs
function encodeURIPath(str) {
  return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY, createPathTagFunction, path;
var init_path = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/path.mjs"() {
    init_error();
    EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
    createPathTagFunction = (pathEncoder = encodeURIPath) => function path5(statics, ...params) {
      if (statics.length === 1)
        return statics[0];
      let postPath = false;
      const invalidSegments = [];
      const path6 = statics.reduce((previousValue, currentValue, index) => {
        if (/[?#]/.test(currentValue)) {
          postPath = true;
        }
        const value = params[index];
        let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
        if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
        value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
          encoded = value + "";
          invalidSegments.push({
            start: previousValue.length + currentValue.length,
            length: encoded.length,
            error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
          });
        }
        return previousValue + currentValue + (index === params.length ? "" : encoded);
      }, "");
      const pathOnly = path6.split(/[?#]/, 1)[0];
      const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
      let match;
      while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
        invalidSegments.push({
          start: match.index,
          length: match[0].length,
          error: `Value "${match[0]}" can't be safely passed as a path parameter`
        });
      }
      invalidSegments.sort((a, b) => a.start - b.start);
      if (invalidSegments.length > 0) {
        let lastEnd = 0;
        const underline = invalidSegments.reduce((acc, segment) => {
          const spaces = " ".repeat(segment.start - lastEnd);
          const arrows = "^".repeat(segment.length);
          lastEnd = segment.start + segment.length;
          return acc + spaces + arrows;
        }, "");
        throw new AnthropicError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path6}
${underline}`);
      }
      return path6;
    };
    path = /* @__PURE__ */ createPathTagFunction(encodeURIPath);
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/deployment-runs.mjs
var DeploymentRuns;
var init_deployment_runs = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/deployment-runs.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    DeploymentRuns = class extends APIResource {
      /**
       * Get Deployment Run
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeploymentRun =
       *   await client.beta.deploymentRuns.retrieve(
       *     'deployment_run_id',
       *   );
       * ```
       */
      retrieve(deploymentRunID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/deployment_runs/${deploymentRunID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Deployment Runs
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsDeploymentRun of client.beta.deploymentRuns.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/deployment_runs?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/deployments.mjs
var Deployments;
var init_deployments = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/deployments.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Deployments = class extends APIResource {
      /**
       * Create Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.create({
       *     agent: 'string',
       *     environment_id: 'x',
       *     initial_events: [
       *       {
       *         content: [
       *           {
       *             text: 'Where is my order #1234?',
       *             type: 'text',
       *           },
       *         ],
       *         type: 'user.message',
       *       },
       *     ],
       *     name: 'x',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/deployments?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.retrieve('deployment_id');
       * ```
       */
      retrieve(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/deployments/${deploymentID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.update('deployment_id');
       * ```
       */
      update(deploymentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/deployments/${deploymentID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Deployments
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsDeployment of client.beta.deployments.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/deployments?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.archive('deployment_id');
       * ```
       */
      archive(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/deployments/${deploymentID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Pause Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.pause('deployment_id');
       * ```
       */
      pause(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/deployments/${deploymentID}/pause?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Run Deployment Now
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeploymentRun =
       *   await client.beta.deployments.run('deployment_id');
       * ```
       */
      run(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/deployments/${deploymentID}/run?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Unpause Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.unpause('deployment_id');
       * ```
       */
      unpause(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/deployments/${deploymentID}/unpause?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/stainless-helper-header.mjs
function helperHeader(value) {
  return { [STAINLESS_HELPER_HEADER]: value };
}
function wasCreatedByStainlessHelper(value) {
  return typeof value === "object" && value !== null && SDK_HELPER_SYMBOL in value;
}
function collectStainlessHelpers(tools, messages) {
  const helpers = /* @__PURE__ */ new Set();
  if (tools) {
    for (const tool of tools) {
      if (wasCreatedByStainlessHelper(tool)) {
        helpers.add(tool[SDK_HELPER_SYMBOL]);
      }
    }
  }
  if (messages) {
    for (const message of messages) {
      if (wasCreatedByStainlessHelper(message)) {
        helpers.add(message[SDK_HELPER_SYMBOL]);
      }
      const content = message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (wasCreatedByStainlessHelper(block)) {
            helpers.add(block[SDK_HELPER_SYMBOL]);
          }
        }
      }
    }
  }
  return Array.from(helpers);
}
function stainlessHelperHeader(tools, messages) {
  const helpers = collectStainlessHelpers(tools, messages);
  if (helpers.length === 0)
    return {};
  return { [STAINLESS_HELPER_HEADER]: helpers.join(", ") };
}
function stainlessHelperHeaderFromFile(file) {
  if (wasCreatedByStainlessHelper(file)) {
    return { [STAINLESS_HELPER_HEADER]: file[SDK_HELPER_SYMBOL] };
  }
  return {};
}
var STAINLESS_HELPER_HEADER, STAINLESS_HELPER_METHOD_HEADER, SDK_HELPER_SYMBOL;
var init_stainless_helper_header = __esm({
  "node_modules/@anthropic-ai/sdk/internal/stainless-helper-header.mjs"() {
    STAINLESS_HELPER_HEADER = "x-stainless-helper";
    STAINLESS_HELPER_METHOD_HEADER = "x-stainless-helper-method";
    SDK_HELPER_SYMBOL = /* @__PURE__ */ Symbol("anthropic.sdk.stainlessHelper");
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/files.mjs
var Files;
var init_files = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/files.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_stainless_helper_header();
    init_uploads();
    init_path();
    Files = class extends APIResource {
      /**
       * List Files
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const fileMetadata of client.beta.files.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/files?beta=true", Page, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete File
       *
       * @example
       * ```ts
       * const deletedFile = await client.beta.files.delete(
       *   'file_id',
       * );
       * ```
       */
      delete(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path`/v1/files/${fileID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Download File
       *
       * @example
       * ```ts
       * const response = await client.beta.files.download(
       *   'file_id',
       * );
       *
       * const content = await response.blob();
       * console.log(content);
       * ```
       */
      download(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/files/${fileID}/content?beta=true`, {
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString(),
              Accept: "application/binary"
            },
            options?.headers
          ]),
          __binaryResponse: true
        });
      }
      /**
       * Get File Metadata
       *
       * @example
       * ```ts
       * const fileMetadata =
       *   await client.beta.files.retrieveMetadata('file_id');
       * ```
       */
      retrieveMetadata(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/files/${fileID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Upload File
       *
       * @example
       * ```ts
       * const fileMetadata = await client.beta.files.upload({
       *   file: fs.createReadStream('path/to/file'),
       * });
       * ```
       */
      upload(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/files?beta=true", multipartFormRequestOptions({
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            stainlessHelperHeaderFromFile(body.file),
            options?.headers
          ])
        }, this._client));
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/models.mjs
var Models;
var init_models = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/models.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Models = class extends APIResource {
      /**
       * Get a specific model.
       *
       * The Models API response can be used to determine information about a specific
       * model or resolve a model alias to a model ID.
       *
       * @example
       * ```ts
       * const betaModelInfo = await client.beta.models.retrieve(
       *   'model_id',
       * );
       * ```
       */
      retrieve(modelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/models/${modelID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List available models.
       *
       * The Models API response can be used to determine which models are available for
       * use in the API. More recently released models are listed first.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaModelInfo of client.beta.models.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/models?beta=true", Page, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/user-profiles.mjs
var UserProfiles;
var init_user_profiles = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/user-profiles.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    UserProfiles = class extends APIResource {
      /**
       * Create User Profile
       *
       * @example
       * ```ts
       * const betaUserProfile =
       *   await client.beta.userProfiles.create();
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/user_profiles?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get User Profile
       *
       * @example
       * ```ts
       * const betaUserProfile =
       *   await client.beta.userProfiles.retrieve(
       *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
       *   );
       * ```
       */
      retrieve(userProfileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/user_profiles/${userProfileID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update User Profile
       *
       * @example
       * ```ts
       * const betaUserProfile =
       *   await client.beta.userProfiles.update(
       *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
       *   );
       * ```
       */
      update(userProfileID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/user_profiles/${userProfileID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List User Profiles
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaUserProfile of client.beta.userProfiles.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/user_profiles?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Create Enrollment URL
       *
       * @example
       * ```ts
       * const betaUserProfileEnrollmentURL =
       *   await client.beta.userProfiles.createEnrollmentURL(
       *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
       *   );
       * ```
       */
      createEnrollmentURL(userProfileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/user_profiles/${userProfileID}/enrollment_url?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-03-24"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/standardwebhooks/dist/timing_safe_equal.js
var require_timing_safe_equal = __commonJS({
  "node_modules/standardwebhooks/dist/timing_safe_equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timingSafeEqual = void 0;
    function assert(expr, msg = "") {
      if (!expr) {
        throw new Error(msg);
      }
    }
    function timingSafeEqual(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      if (!(a instanceof DataView)) {
        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
      }
      if (!(b instanceof DataView)) {
        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
      }
      assert(a instanceof DataView);
      assert(b instanceof DataView);
      const length = a.byteLength;
      let out = 0;
      let i = -1;
      while (++i < length) {
        out |= a.getUint8(i) ^ b.getUint8(i);
      }
      return out === 0;
    }
    exports.timingSafeEqual = timingSafeEqual;
  }
});

// node_modules/@stablelib/base64/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/@stablelib/base64/lib/base64.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var INVALID_BYTE = 256;
    var Coder = (
      /** @class */
      (function() {
        function Coder2(_paddingCharacter) {
          if (_paddingCharacter === void 0) {
            _paddingCharacter = "=";
          }
          this._paddingCharacter = _paddingCharacter;
        }
        Coder2.prototype.encodedLength = function(length) {
          if (!this._paddingCharacter) {
            return (length * 8 + 5) / 6 | 0;
          }
          return (length + 2) / 3 * 4 | 0;
        };
        Coder2.prototype.encode = function(data) {
          var out = "";
          var i = 0;
          for (; i < data.length - 2; i += 3) {
            var c = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            out += this._encodeByte(c >>> 1 * 6 & 63);
            out += this._encodeByte(c >>> 0 * 6 & 63);
          }
          var left = data.length - i;
          if (left > 0) {
            var c = data[i] << 16 | (left === 2 ? data[i + 1] << 8 : 0);
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            if (left === 2) {
              out += this._encodeByte(c >>> 1 * 6 & 63);
            } else {
              out += this._paddingCharacter || "";
            }
            out += this._paddingCharacter || "";
          }
          return out;
        };
        Coder2.prototype.maxDecodedLength = function(length) {
          if (!this._paddingCharacter) {
            return (length * 6 + 7) / 8 | 0;
          }
          return length / 4 * 3 | 0;
        };
        Coder2.prototype.decodedLength = function(s) {
          return this.maxDecodedLength(s.length - this._getPaddingLength(s));
        };
        Coder2.prototype.decode = function(s) {
          if (s.length === 0) {
            return new Uint8Array(0);
          }
          var paddingLength = this._getPaddingLength(s);
          var length = s.length - paddingLength;
          var out = new Uint8Array(this.maxDecodedLength(length));
          var op = 0;
          var i = 0;
          var haveBad = 0;
          var v0 = 0, v1 = 0, v2 = 0, v3 = 0;
          for (; i < length - 4; i += 4) {
            v0 = this._decodeChar(s.charCodeAt(i + 0));
            v1 = this._decodeChar(s.charCodeAt(i + 1));
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            v3 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v0 << 2 | v1 >>> 4;
            out[op++] = v1 << 4 | v2 >>> 2;
            out[op++] = v2 << 6 | v3;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v1 & INVALID_BYTE;
            haveBad |= v2 & INVALID_BYTE;
            haveBad |= v3 & INVALID_BYTE;
          }
          if (i < length - 1) {
            v0 = this._decodeChar(s.charCodeAt(i));
            v1 = this._decodeChar(s.charCodeAt(i + 1));
            out[op++] = v0 << 2 | v1 >>> 4;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v1 & INVALID_BYTE;
          }
          if (i < length - 2) {
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            out[op++] = v1 << 4 | v2 >>> 2;
            haveBad |= v2 & INVALID_BYTE;
          }
          if (i < length - 3) {
            v3 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v2 << 6 | v3;
            haveBad |= v3 & INVALID_BYTE;
          }
          if (haveBad !== 0) {
            throw new Error("Base64Coder: incorrect characters for decoding");
          }
          return out;
        };
        Coder2.prototype._encodeByte = function(b) {
          var result = b;
          result += 65;
          result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
          result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
          result += 61 - b >>> 8 & 52 - 48 - 62 + 43;
          result += 62 - b >>> 8 & 62 - 43 - 63 + 47;
          return String.fromCharCode(result);
        };
        Coder2.prototype._decodeChar = function(c) {
          var result = INVALID_BYTE;
          result += (42 - c & c - 44) >>> 8 & -INVALID_BYTE + c - 43 + 62;
          result += (46 - c & c - 48) >>> 8 & -INVALID_BYTE + c - 47 + 63;
          result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
          result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
          result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
          return result;
        };
        Coder2.prototype._getPaddingLength = function(s) {
          var paddingLength = 0;
          if (this._paddingCharacter) {
            for (var i = s.length - 1; i >= 0; i--) {
              if (s[i] !== this._paddingCharacter) {
                break;
              }
              paddingLength++;
            }
            if (s.length < 4 || paddingLength > 2) {
              throw new Error("Base64Coder: incorrect padding");
            }
          }
          return paddingLength;
        };
        return Coder2;
      })()
    );
    exports.Coder = Coder;
    var stdCoder = new Coder();
    function encode2(data) {
      return stdCoder.encode(data);
    }
    exports.encode = encode2;
    function decode(s) {
      return stdCoder.decode(s);
    }
    exports.decode = decode;
    var URLSafeCoder = (
      /** @class */
      (function(_super) {
        __extends(URLSafeCoder2, _super);
        function URLSafeCoder2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        URLSafeCoder2.prototype._encodeByte = function(b) {
          var result = b;
          result += 65;
          result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
          result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
          result += 61 - b >>> 8 & 52 - 48 - 62 + 45;
          result += 62 - b >>> 8 & 62 - 45 - 63 + 95;
          return String.fromCharCode(result);
        };
        URLSafeCoder2.prototype._decodeChar = function(c) {
          var result = INVALID_BYTE;
          result += (44 - c & c - 46) >>> 8 & -INVALID_BYTE + c - 45 + 62;
          result += (94 - c & c - 96) >>> 8 & -INVALID_BYTE + c - 95 + 63;
          result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
          result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
          result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
          return result;
        };
        return URLSafeCoder2;
      })(Coder)
    );
    exports.URLSafeCoder = URLSafeCoder;
    var urlSafeCoder = new URLSafeCoder();
    function encodeURLSafe(data) {
      return urlSafeCoder.encode(data);
    }
    exports.encodeURLSafe = encodeURLSafe;
    function decodeURLSafe(s) {
      return urlSafeCoder.decode(s);
    }
    exports.decodeURLSafe = decodeURLSafe;
    exports.encodedLength = function(length) {
      return stdCoder.encodedLength(length);
    };
    exports.maxDecodedLength = function(length) {
      return stdCoder.maxDecodedLength(length);
    };
    exports.decodedLength = function(s) {
      return stdCoder.decodedLength(s);
    };
  }
});

// node_modules/fast-sha256/sha256.js
var require_sha256 = __commonJS({
  "node_modules/fast-sha256/sha256.js"(exports, module) {
    (function(root, factory) {
      var exports2 = {};
      factory(exports2);
      var sha256 = exports2["default"];
      for (var k in exports2) {
        sha256[k] = exports2[k];
      }
      if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = sha256;
      } else if (typeof define === "function" && define.amd) {
        define(function() {
          return sha256;
        });
      } else {
        root.sha256 = sha256;
      }
    })(exports, function(exports2) {
      "use strict";
      exports2.__esModule = true;
      exports2.digestLength = 32;
      exports2.blockSize = 64;
      var K = new Uint32Array([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      function hashBlocks(w, v, p, pos, len) {
        var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
        while (len >= 64) {
          a = v[0];
          b = v[1];
          c = v[2];
          d = v[3];
          e = v[4];
          f = v[5];
          g = v[6];
          h = v[7];
          for (i = 0; i < 16; i++) {
            j = pos + i * 4;
            w[i] = (p[j] & 255) << 24 | (p[j + 1] & 255) << 16 | (p[j + 2] & 255) << 8 | p[j + 3] & 255;
          }
          for (i = 16; i < 64; i++) {
            u = w[i - 2];
            t1 = (u >>> 17 | u << 32 - 17) ^ (u >>> 19 | u << 32 - 19) ^ u >>> 10;
            u = w[i - 15];
            t2 = (u >>> 7 | u << 32 - 7) ^ (u >>> 18 | u << 32 - 18) ^ u >>> 3;
            w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
          }
          for (i = 0; i < 64; i++) {
            t1 = (((e >>> 6 | e << 32 - 6) ^ (e >>> 11 | e << 32 - 11) ^ (e >>> 25 | e << 32 - 25)) + (e & f ^ ~e & g) | 0) + (h + (K[i] + w[i] | 0) | 0) | 0;
            t2 = ((a >>> 2 | a << 32 - 2) ^ (a >>> 13 | a << 32 - 13) ^ (a >>> 22 | a << 32 - 22)) + (a & b ^ a & c ^ b & c) | 0;
            h = g;
            g = f;
            f = e;
            e = d + t1 | 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 | 0;
          }
          v[0] += a;
          v[1] += b;
          v[2] += c;
          v[3] += d;
          v[4] += e;
          v[5] += f;
          v[6] += g;
          v[7] += h;
          pos += 64;
          len -= 64;
        }
        return pos;
      }
      var Hash = (
        /** @class */
        (function() {
          function Hash2() {
            this.digestLength = exports2.digestLength;
            this.blockSize = exports2.blockSize;
            this.state = new Int32Array(8);
            this.temp = new Int32Array(64);
            this.buffer = new Uint8Array(128);
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            this.reset();
          }
          Hash2.prototype.reset = function() {
            this.state[0] = 1779033703;
            this.state[1] = 3144134277;
            this.state[2] = 1013904242;
            this.state[3] = 2773480762;
            this.state[4] = 1359893119;
            this.state[5] = 2600822924;
            this.state[6] = 528734635;
            this.state[7] = 1541459225;
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            return this;
          };
          Hash2.prototype.clean = function() {
            for (var i = 0; i < this.buffer.length; i++) {
              this.buffer[i] = 0;
            }
            for (var i = 0; i < this.temp.length; i++) {
              this.temp[i] = 0;
            }
            this.reset();
          };
          Hash2.prototype.update = function(data, dataLength) {
            if (dataLength === void 0) {
              dataLength = data.length;
            }
            if (this.finished) {
              throw new Error("SHA256: can't update because hash was finished.");
            }
            var dataPos = 0;
            this.bytesHashed += dataLength;
            if (this.bufferLength > 0) {
              while (this.bufferLength < 64 && dataLength > 0) {
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
              }
              if (this.bufferLength === 64) {
                hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                this.bufferLength = 0;
              }
            }
            if (dataLength >= 64) {
              dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
              dataLength %= 64;
            }
            while (dataLength > 0) {
              this.buffer[this.bufferLength++] = data[dataPos++];
              dataLength--;
            }
            return this;
          };
          Hash2.prototype.finish = function(out) {
            if (!this.finished) {
              var bytesHashed = this.bytesHashed;
              var left = this.bufferLength;
              var bitLenHi = bytesHashed / 536870912 | 0;
              var bitLenLo = bytesHashed << 3;
              var padLength = bytesHashed % 64 < 56 ? 64 : 128;
              this.buffer[left] = 128;
              for (var i = left + 1; i < padLength - 8; i++) {
                this.buffer[i] = 0;
              }
              this.buffer[padLength - 8] = bitLenHi >>> 24 & 255;
              this.buffer[padLength - 7] = bitLenHi >>> 16 & 255;
              this.buffer[padLength - 6] = bitLenHi >>> 8 & 255;
              this.buffer[padLength - 5] = bitLenHi >>> 0 & 255;
              this.buffer[padLength - 4] = bitLenLo >>> 24 & 255;
              this.buffer[padLength - 3] = bitLenLo >>> 16 & 255;
              this.buffer[padLength - 2] = bitLenLo >>> 8 & 255;
              this.buffer[padLength - 1] = bitLenLo >>> 0 & 255;
              hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
              this.finished = true;
            }
            for (var i = 0; i < 8; i++) {
              out[i * 4 + 0] = this.state[i] >>> 24 & 255;
              out[i * 4 + 1] = this.state[i] >>> 16 & 255;
              out[i * 4 + 2] = this.state[i] >>> 8 & 255;
              out[i * 4 + 3] = this.state[i] >>> 0 & 255;
            }
            return this;
          };
          Hash2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          Hash2.prototype._saveState = function(out) {
            for (var i = 0; i < this.state.length; i++) {
              out[i] = this.state[i];
            }
          };
          Hash2.prototype._restoreState = function(from, bytesHashed) {
            for (var i = 0; i < this.state.length; i++) {
              this.state[i] = from[i];
            }
            this.bytesHashed = bytesHashed;
            this.finished = false;
            this.bufferLength = 0;
          };
          return Hash2;
        })()
      );
      exports2.Hash = Hash;
      var HMAC = (
        /** @class */
        (function() {
          function HMAC2(key) {
            this.inner = new Hash();
            this.outer = new Hash();
            this.blockSize = this.inner.blockSize;
            this.digestLength = this.inner.digestLength;
            var pad = new Uint8Array(this.blockSize);
            if (key.length > this.blockSize) {
              new Hash().update(key).finish(pad).clean();
            } else {
              for (var i = 0; i < key.length; i++) {
                pad[i] = key[i];
              }
            }
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54;
            }
            this.inner.update(pad);
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54 ^ 92;
            }
            this.outer.update(pad);
            this.istate = new Uint32Array(8);
            this.ostate = new Uint32Array(8);
            this.inner._saveState(this.istate);
            this.outer._saveState(this.ostate);
            for (var i = 0; i < pad.length; i++) {
              pad[i] = 0;
            }
          }
          HMAC2.prototype.reset = function() {
            this.inner._restoreState(this.istate, this.inner.blockSize);
            this.outer._restoreState(this.ostate, this.outer.blockSize);
            return this;
          };
          HMAC2.prototype.clean = function() {
            for (var i = 0; i < this.istate.length; i++) {
              this.ostate[i] = this.istate[i] = 0;
            }
            this.inner.clean();
            this.outer.clean();
          };
          HMAC2.prototype.update = function(data) {
            this.inner.update(data);
            return this;
          };
          HMAC2.prototype.finish = function(out) {
            if (this.outer.finished) {
              this.outer.finish(out);
            } else {
              this.inner.finish(out);
              this.outer.update(out, this.digestLength).finish(out);
            }
            return this;
          };
          HMAC2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          return HMAC2;
        })()
      );
      exports2.HMAC = HMAC;
      function hash(data) {
        var h = new Hash().update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      exports2.hash = hash;
      exports2["default"] = hash;
      function hmac(key, data) {
        var h = new HMAC(key).update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      exports2.hmac = hmac;
      function fillBuffer(buffer, hmac2, info, counter) {
        var num = counter[0];
        if (num === 0) {
          throw new Error("hkdf: cannot expand more");
        }
        hmac2.reset();
        if (num > 1) {
          hmac2.update(buffer);
        }
        if (info) {
          hmac2.update(info);
        }
        hmac2.update(counter);
        hmac2.finish(buffer);
        counter[0]++;
      }
      var hkdfSalt = new Uint8Array(exports2.digestLength);
      function hkdf(key, salt, info, length) {
        if (salt === void 0) {
          salt = hkdfSalt;
        }
        if (length === void 0) {
          length = 32;
        }
        var counter = new Uint8Array([1]);
        var okm = hmac(salt, key);
        var hmac_ = new HMAC(okm);
        var buffer = new Uint8Array(hmac_.digestLength);
        var bufpos = buffer.length;
        var out = new Uint8Array(length);
        for (var i = 0; i < length; i++) {
          if (bufpos === buffer.length) {
            fillBuffer(buffer, hmac_, info, counter);
            bufpos = 0;
          }
          out[i] = buffer[bufpos++];
        }
        hmac_.clean();
        buffer.fill(0);
        counter.fill(0);
        return out;
      }
      exports2.hkdf = hkdf;
      function pbkdf2(password, salt, iterations, dkLen) {
        var prf = new HMAC(password);
        var len = prf.digestLength;
        var ctr = new Uint8Array(4);
        var t = new Uint8Array(len);
        var u = new Uint8Array(len);
        var dk = new Uint8Array(dkLen);
        for (var i = 0; i * len < dkLen; i++) {
          var c = i + 1;
          ctr[0] = c >>> 24 & 255;
          ctr[1] = c >>> 16 & 255;
          ctr[2] = c >>> 8 & 255;
          ctr[3] = c >>> 0 & 255;
          prf.reset();
          prf.update(salt);
          prf.update(ctr);
          prf.finish(u);
          for (var j = 0; j < len; j++) {
            t[j] = u[j];
          }
          for (var j = 2; j <= iterations; j++) {
            prf.reset();
            prf.update(u).finish(u);
            for (var k = 0; k < len; k++) {
              t[k] ^= u[k];
            }
          }
          for (var j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j];
          }
        }
        for (var i = 0; i < len; i++) {
          t[i] = u[i] = 0;
        }
        for (var i = 0; i < 4; i++) {
          ctr[i] = 0;
        }
        prf.clean();
        return dk;
      }
      exports2.pbkdf2 = pbkdf2;
    });
  }
});

// node_modules/standardwebhooks/dist/index.js
var require_dist = __commonJS({
  "node_modules/standardwebhooks/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Webhook = exports.WebhookVerificationError = void 0;
    var timing_safe_equal_1 = require_timing_safe_equal();
    var base64 = require_base64();
    var sha256 = require_sha256();
    var WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;
    var ExtendableError = class _ExtendableError extends Error {
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _ExtendableError.prototype);
        this.name = "ExtendableError";
        this.stack = new Error(message).stack;
      }
    };
    var WebhookVerificationError = class _WebhookVerificationError extends ExtendableError {
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _WebhookVerificationError.prototype);
        this.name = "WebhookVerificationError";
      }
    };
    exports.WebhookVerificationError = WebhookVerificationError;
    var Webhook2 = class _Webhook {
      constructor(secret, options) {
        if (!secret) {
          throw new Error("Secret can't be empty.");
        }
        if ((options === null || options === void 0 ? void 0 : options.format) === "raw") {
          if (secret instanceof Uint8Array) {
            this.key = secret;
          } else {
            this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
          }
        } else {
          if (typeof secret !== "string") {
            throw new Error("Expected secret to be of type string");
          }
          if (secret.startsWith(_Webhook.prefix)) {
            secret = secret.substring(_Webhook.prefix.length);
          }
          this.key = base64.decode(secret);
        }
      }
      verify(payload, headers_) {
        const headers = {};
        for (const key of Object.keys(headers_)) {
          headers[key.toLowerCase()] = headers_[key];
        }
        const msgId = headers["webhook-id"];
        const msgSignature = headers["webhook-signature"];
        const msgTimestamp = headers["webhook-timestamp"];
        if (!msgSignature || !msgId || !msgTimestamp) {
          throw new WebhookVerificationError("Missing required headers");
        }
        const timestamp = this.verifyTimestamp(msgTimestamp);
        const computedSignature = this.sign(msgId, timestamp, payload);
        const expectedSignature = computedSignature.split(",")[1];
        const passedSignatures = msgSignature.split(" ");
        const encoder2 = new globalThis.TextEncoder();
        for (const versionedSignature of passedSignatures) {
          const [version, signature] = versionedSignature.split(",");
          if (version !== "v1") {
            continue;
          }
          if ((0, timing_safe_equal_1.timingSafeEqual)(encoder2.encode(signature), encoder2.encode(expectedSignature))) {
            return JSON.parse(payload.toString());
          }
        }
        throw new WebhookVerificationError("No matching signature found");
      }
      sign(msgId, timestamp, payload) {
        if (typeof payload === "string") {
        } else if (payload.constructor.name === "Buffer") {
          payload = payload.toString();
        } else {
          throw new Error("Expected payload to be of type string or Buffer.");
        }
        const encoder2 = new TextEncoder();
        const timestampNumber = Math.floor(timestamp.getTime() / 1e3);
        const toSign = encoder2.encode(`${msgId}.${timestampNumber}.${payload}`);
        const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
        return `v1,${expectedSignature}`;
      }
      verifyTimestamp(timestampHeader) {
        const now = Math.floor(Date.now() / 1e3);
        const timestamp = parseInt(timestampHeader, 10);
        if (isNaN(timestamp)) {
          throw new WebhookVerificationError("Invalid Signature Headers");
        }
        if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too old");
        }
        if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too new");
        }
        return new Date(timestamp * 1e3);
      }
    };
    exports.Webhook = Webhook2;
    Webhook2.prefix = "whsec_";
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/webhooks.mjs
var import_standardwebhooks, Webhooks;
var init_webhooks = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/webhooks.mjs"() {
    init_resource();
    import_standardwebhooks = __toESM(require_dist(), 1);
    Webhooks = class extends APIResource {
      unwrap(body, { headers, key }) {
        if (headers !== void 0) {
          const keyStr = key === void 0 ? this._client.webhookKey : key;
          if (keyStr === null)
            throw new Error("Webhook key must not be null in order to unwrap");
          const wh = new import_standardwebhooks.Webhook(keyStr);
          wh.verify(body, headers);
        }
        return JSON.parse(body);
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/agents/versions.mjs
var Versions;
var init_versions = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/agents/versions.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Versions = class extends APIResource {
      /**
       * List Agent Versions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsAgent of client.beta.agents.versions.list(
       *   'agent_011CZkYpogX7uDKUyvBTophP',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(agentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/agents/${agentID}/versions?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/agents/agents.mjs
var Agents;
var init_agents = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/agents/agents.mjs"() {
    init_resource();
    init_versions();
    init_versions();
    init_pagination();
    init_headers();
    init_path();
    Agents = class extends APIResource {
      constructor() {
        super(...arguments);
        this.versions = new Versions(this._client);
      }
      /**
       * Create Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.create({
       *     model: 'claude-sonnet-4-6',
       *     name: 'My First Agent',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/agents?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.retrieve(
       *     'agent_011CZkYpogX7uDKUyvBTophP',
       *   );
       * ```
       */
      retrieve(agentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.get(path`/v1/agents/${agentID}?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.update(
       *     'agent_011CZkYpogX7uDKUyvBTophP',
       *     { version: 1 },
       *   );
       * ```
       */
      update(agentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/agents/${agentID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Agents
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsAgent of client.beta.agents.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/agents?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.archive(
       *     'agent_011CZkYpogX7uDKUyvBTophP',
       *   );
       * ```
       */
      archive(agentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/agents/${agentID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Agents.Versions = Versions;
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/abort.mjs
function linkAbort(external, controller) {
  if (!external)
    return () => {
    };
  if (external.aborted) {
    controller.abort();
    return () => {
    };
  }
  const onAbort = () => controller.abort();
  external.addEventListener("abort", onAbort);
  return () => external.removeEventListener("abort", onAbort);
}
var init_abort = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/abort.mjs"() {
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/backoff.mjs
function isStatus(e, code) {
  return e instanceof APIError && e.status === code;
}
function is4xx(e) {
  return e instanceof APIError && typeof e.status === "number" && e.status >= 400 && e.status < 500;
}
function isFatal4xx(e) {
  return is4xx(e) && !isStatus(e, 408) && !isStatus(e, 409) && !isStatus(e, 429);
}
function backoff(attempt, baseMs, capMs) {
  return Math.min(baseMs * 2 ** attempt, capMs);
}
function jitter(lowMs, highMs) {
  return lowMs + Math.random() * (highMs - lowMs);
}
function applyJitter(ms) {
  return ms * (1 - Math.random() * 0.25);
}
var init_backoff = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/backoff.mjs"() {
    init_error();
  }
});

// node_modules/@anthropic-ai/sdk/lib/helper-client.mjs
function copyClientForHelper(client, { authToken, helper }) {
  if (!authToken) {
    throw new AnthropicError(`copyClientForHelper: expected a non-empty authToken but received ${JSON.stringify(authToken)}`);
  }
  const internal = client;
  const parentDefaults = internal._options.defaultHeaders;
  const parentAuthExtraHeaders = internal._authState?.extraHeaders;
  const inheritedAuthExtraHeaders = parentAuthExtraHeaders ? Object.fromEntries(Object.entries(parentAuthExtraHeaders).filter(([name]) => {
    const lower = name.toLowerCase();
    return lower !== "authorization" && lower !== "x-api-key";
  })) : void 0;
  const defaultHeaders = buildHeaders([
    inheritedAuthExtraHeaders,
    parentDefaults,
    { [STAINLESS_HELPER_HEADER]: helper }
  ]);
  return client.withOptions({
    apiKey: null,
    authToken,
    baseURL: client.baseURL,
    credentials: void 0,
    defaultHeaders
  });
}
var init_helper_client = __esm({
  "node_modules/@anthropic-ai/sdk/lib/helper-client.mjs"() {
    init_error();
    init_headers();
    init_stainless_helper_header();
  }
});

// node_modules/@anthropic-ai/sdk/lib/environments/poller.mjs
function backoff2(attempt) {
  return backoff(attempt, POLL_BACKOFF_BASE_MS, POLL_BACKOFF_CAP_MS);
}
function defaultWorkerId() {
  const env = globalThis.process?.env;
  const host = env?.["HOSTNAME"];
  return host ? `${host}-${uuid4()}` : uuid4();
}
var _WorkPoller_runnerClient, _WorkPoller_consumed, _WorkPoller_controller, _WorkPoller_detachExternal, _WorkPoller_autoStop, _WorkPoller_drain, _WorkPoller_blockMs, _WorkPoller_reclaimOlderThanMs, _WorkPoller_requestOpts, POLL_BLOCK_MS, POLL_BACKOFF_BASE_MS, POLL_BACKOFF_CAP_MS, WorkPoller;
var init_poller = __esm({
  "node_modules/@anthropic-ai/sdk/lib/environments/poller.mjs"() {
    init_tslib();
    init_error();
    init_log();
    init_sleep();
    init_uuid();
    init_abort();
    init_headers();
    init_backoff();
    init_helper_client();
    init_backoff();
    POLL_BLOCK_MS = 999;
    POLL_BACKOFF_BASE_MS = 1e3;
    POLL_BACKOFF_CAP_MS = 6e4;
    WorkPoller = class {
      constructor(opts) {
        _WorkPoller_runnerClient.set(this, void 0);
        _WorkPoller_consumed.set(this, false);
        _WorkPoller_controller.set(this, void 0);
        _WorkPoller_detachExternal.set(this, void 0);
        _WorkPoller_autoStop.set(this, void 0);
        _WorkPoller_drain.set(this, void 0);
        _WorkPoller_blockMs.set(this, void 0);
        _WorkPoller_reclaimOlderThanMs.set(this, void 0);
        _WorkPoller_requestOpts.set(this, void 0);
        this.client = opts.client;
        this.environmentId = opts.environmentId;
        this.environmentKey = opts.environmentKey;
        this.workerId = opts.workerId ?? defaultWorkerId();
        __classPrivateFieldSet(this, _WorkPoller_runnerClient, copyClientForHelper(opts.client, {
          authToken: opts.environmentKey,
          helper: "environments-work-poller"
        }), "f");
        __classPrivateFieldSet(this, _WorkPoller_autoStop, opts.autoStop ?? true, "f");
        __classPrivateFieldSet(this, _WorkPoller_drain, opts.drain ?? false, "f");
        __classPrivateFieldSet(this, _WorkPoller_blockMs, opts.blockMs === void 0 ? POLL_BLOCK_MS : opts.blockMs, "f");
        __classPrivateFieldSet(this, _WorkPoller_reclaimOlderThanMs, opts.reclaimOlderThanMs ?? null, "f");
        __classPrivateFieldSet(this, _WorkPoller_requestOpts, opts.requestOptions, "f");
        __classPrivateFieldSet(this, _WorkPoller_controller, new AbortController(), "f");
        __classPrivateFieldSet(this, _WorkPoller_detachExternal, linkAbort(opts.signal, __classPrivateFieldGet(this, _WorkPoller_controller, "f")), "f");
      }
      /** Read-only view of this iterator's abort signal. */
      get signal() {
        return __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal;
      }
      /** Abort the iterator. The current `for await` will exit cleanly. */
      abort() {
        __classPrivateFieldGet(this, _WorkPoller_controller, "f").abort();
      }
      async *[(_WorkPoller_runnerClient = /* @__PURE__ */ new WeakMap(), _WorkPoller_consumed = /* @__PURE__ */ new WeakMap(), _WorkPoller_controller = /* @__PURE__ */ new WeakMap(), _WorkPoller_detachExternal = /* @__PURE__ */ new WeakMap(), _WorkPoller_autoStop = /* @__PURE__ */ new WeakMap(), _WorkPoller_drain = /* @__PURE__ */ new WeakMap(), _WorkPoller_blockMs = /* @__PURE__ */ new WeakMap(), _WorkPoller_reclaimOlderThanMs = /* @__PURE__ */ new WeakMap(), _WorkPoller_requestOpts = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        if (__classPrivateFieldGet(this, _WorkPoller_consumed, "f")) {
          throw new AnthropicError("Cannot iterate over a consumed WorkPoller");
        }
        __classPrivateFieldSet(this, _WorkPoller_consumed, true, "f");
        const log = loggerFor(this.client);
        log.info("poller starting", {
          component: "work-poller",
          environment_id: this.environmentId
        });
        try {
          let attempt = 0;
          while (!__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted) {
            let work;
            try {
              work = await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.poll(this.environmentId, {
                "Anthropic-Worker-ID": this.workerId,
                ...__classPrivateFieldGet(this, _WorkPoller_blockMs, "f") !== null ? { block_ms: __classPrivateFieldGet(this, _WorkPoller_blockMs, "f") } : {},
                ...__classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") !== null ? { reclaim_older_than_ms: __classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") } : {}
              }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
            } catch (e) {
              if (__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted)
                return;
              if (isFatal4xx(e)) {
                log.error("poll failed permanently, stopping poller", { error: String(e) });
                throw e;
              }
              const wait = applyJitter(backoff2(attempt));
              log.warn("poll failed, backing off", { error: String(e), backoff_ms: wait });
              attempt++;
              await sleep(wait, __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
              continue;
            }
            attempt = 0;
            if (work == null) {
              if (__classPrivateFieldGet(this, _WorkPoller_drain, "f"))
                return;
              await sleep(jitter(1e3, 3e3), __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
              continue;
            }
            log.info("claimed work", {
              component: "work-poller",
              environment_id: this.environmentId,
              work_id: work.id,
              work_type: work.data.type
            });
            try {
              await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.ack(work.id, { environment_id: work.environment_id }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
            } catch (e) {
              log.error("ack failed", { work_id: work.id, error: String(e) });
              continue;
            }
            try {
              yield work;
            } finally {
              if (__classPrivateFieldGet(this, _WorkPoller_autoStop, "f")) {
                try {
                  await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.stop(work.id, { environment_id: work.environment_id }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]) });
                } catch (e) {
                  if (!isStatus(e, 409))
                    log.warn("stop failed", { work_id: work.id, error: String(e) });
                }
              }
            }
          }
        } finally {
          __classPrivateFieldGet(this, _WorkPoller_detachExternal, "f").call(this);
        }
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/async-queue.mjs
var _AsyncQueue_items, _AsyncQueue_waiters, _AsyncQueue_closed, AsyncQueue;
var init_async_queue = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/async-queue.mjs"() {
    init_tslib();
    AsyncQueue = class {
      constructor() {
        _AsyncQueue_items.set(this, []);
        _AsyncQueue_waiters.set(this, []);
        _AsyncQueue_closed.set(this, false);
      }
      /** Enqueue an item, or hand it directly to a waiting reader. Returns `false` once closed. */
      push(item) {
        if (__classPrivateFieldGet(this, _AsyncQueue_closed, "f"))
          return false;
        const w = __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").shift();
        if (w)
          w({ done: false, value: item });
        else
          __classPrivateFieldGet(this, _AsyncQueue_items, "f").push(item);
        return true;
      }
      /** Mark the queue done. Idempotent; wakes every pending reader with `done: true`. */
      close() {
        if (__classPrivateFieldGet(this, _AsyncQueue_closed, "f"))
          return;
        __classPrivateFieldSet(this, _AsyncQueue_closed, true, "f");
        while (__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").length > 0) {
          const w = __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").shift();
          w({ done: true, value: void 0 });
        }
      }
      /**
       * Resolve with the next item, or `done: true` once the queue is closed and
       * drained. When `signal` is supplied, aborting it resolves a pending read
       * with `done: true` (cancellation is pushed down here rather than handled by
       * an outer `Promise.race`).
       */
      next(signal) {
        if (__classPrivateFieldGet(this, _AsyncQueue_items, "f").length > 0) {
          return Promise.resolve({ done: false, value: __classPrivateFieldGet(this, _AsyncQueue_items, "f").shift() });
        }
        if (__classPrivateFieldGet(this, _AsyncQueue_closed, "f") || signal?.aborted) {
          return Promise.resolve({ done: true, value: void 0 });
        }
        return new Promise((resolve4) => {
          const waiter = (r) => {
            signal?.removeEventListener("abort", onAbort);
            resolve4(r);
          };
          const onAbort = () => {
            const idx = __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").indexOf(waiter);
            if (idx >= 0)
              __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").splice(idx, 1);
            resolve4({ done: true, value: void 0 });
          };
          __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").push(waiter);
          signal?.addEventListener("abort", onAbort, { once: true });
        });
      }
      /** Synchronously remove and return the next buffered item, or `undefined` if empty. */
      tryShift() {
        return __classPrivateFieldGet(this, _AsyncQueue_items, "f").shift();
      }
    };
    _AsyncQueue_items = /* @__PURE__ */ new WeakMap(), _AsyncQueue_waiters = /* @__PURE__ */ new WeakMap(), _AsyncQueue_closed = /* @__PURE__ */ new WeakMap();
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/ToolError.mjs
var ToolError;
var init_ToolError = __esm({
  "node_modules/@anthropic-ai/sdk/lib/tools/ToolError.mjs"() {
    ToolError = class extends Error {
      constructor(content) {
        const message = typeof content === "string" ? content : content.map((block) => {
          if (block.type === "text")
            return block.text;
          return `[${block.type}]`;
        }).join(" ");
        super(message);
        this.name = "ToolError";
        this.content = content;
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/BetaRunnableTool.mjs
function toolName(tool) {
  return "name" in tool ? tool.name : tool.mcp_server_name;
}
function toolErrorContent(e) {
  return e instanceof ToolError ? e.content : `Error: ${e instanceof Error ? e.message : String(e)}`;
}
async function runRunnableTool(tool, rawInput, context) {
  try {
    const input = tool.parse ? tool.parse(rawInput) : rawInput;
    const content = await tool.run(input, context);
    return { content, isError: false };
  } catch (e) {
    return { content: toolErrorContent(e), isError: true };
  }
}
var init_BetaRunnableTool = __esm({
  "node_modules/@anthropic-ai/sdk/lib/tools/BetaRunnableTool.mjs"() {
    init_ToolError();
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/SessionToolRunner.mjs
function isEndTurnIdle(ev) {
  return ev.type === "session.status_idle" && ev.stop_reason?.type === "end_turn";
}
function buildResultEvent(ev, isError, content) {
  if (ev.type === "agent.custom_tool_use") {
    return { type: "user.custom_tool_result", custom_tool_use_id: ev.id, is_error: isError, content };
  }
  return { type: "user.tool_result", tool_use_id: ev.id, is_error: isError, content };
}
function toSessionContent(content) {
  if (typeof content === "string")
    return [{ type: "text", text: content || "(no output)" }];
  const out = content.map((b) => {
    if (b.type === "text")
      return { type: "text", text: b.text || "(no output)" };
    if (b.type === "image" || b.type === "document")
      return b;
    if (b.type === "search_result") {
      return {
        type: "search_result",
        source: b.source,
        title: b.title,
        content: b.content.map((c) => ({ type: "text", text: c.text })),
        citations: { enabled: b.citations?.enabled ?? false }
      };
    }
    return { type: "text", text: JSON.stringify(b) };
  });
  return out.length > 0 ? out : [{ type: "text", text: "(no output)" }];
}
var _SessionToolRunner_instances, _SessionToolRunner_consumed, _SessionToolRunner_controller, _SessionToolRunner_detachExternal, _SessionToolRunner_requestOpts, _SessionToolRunner_toolByName, _SessionToolRunner_logger, _SessionToolRunner_seen, _SessionToolRunner_answered, _SessionToolRunner_results, _SessionToolRunner_inFlightCount, _SessionToolRunner_onIdle, _SessionToolRunner_idleTimer, _SessionToolRunner_requestOptions, _SessionToolRunner_streamLoop, _SessionToolRunner_reconcile, _SessionToolRunner_ingestHistory, _SessionToolRunner_handleStreamEvent, _SessionToolRunner_armIdleTimer, _SessionToolRunner_disarmIdleTimer, _SessionToolRunner_execute, _SessionToolRunner_sendResult, _SessionToolRunner_drain, STREAM_BACKOFF_START_MS, STREAM_BACKOFF_CAP_MS, TOOL_TIMEOUT_MS, DRAIN_TIMEOUT_MS, SEND_RETRIES, DEFAULT_MAX_IDLE_MS, SessionToolRunner;
var init_SessionToolRunner = __esm({
  "node_modules/@anthropic-ai/sdk/lib/tools/SessionToolRunner.mjs"() {
    init_tslib();
    init_error();
    init_log();
    init_sleep();
    init_backoff();
    init_abort();
    init_async_queue();
    init_headers();
    init_stainless_helper_header();
    init_BetaRunnableTool();
    STREAM_BACKOFF_START_MS = 500;
    STREAM_BACKOFF_CAP_MS = 1e4;
    TOOL_TIMEOUT_MS = 12e4;
    DRAIN_TIMEOUT_MS = 3e4;
    SEND_RETRIES = 3;
    DEFAULT_MAX_IDLE_MS = 6e4;
    SessionToolRunner = class {
      constructor(sessionId, opts) {
        _SessionToolRunner_instances.add(this);
        _SessionToolRunner_consumed.set(this, false);
        _SessionToolRunner_controller.set(this, void 0);
        _SessionToolRunner_detachExternal.set(this, void 0);
        _SessionToolRunner_requestOpts.set(this, void 0);
        _SessionToolRunner_toolByName.set(this, void 0);
        _SessionToolRunner_logger.set(this, void 0);
        _SessionToolRunner_seen.set(this, /* @__PURE__ */ new Set());
        _SessionToolRunner_answered.set(this, /* @__PURE__ */ new Set());
        _SessionToolRunner_results.set(this, new AsyncQueue());
        _SessionToolRunner_inFlightCount.set(this, 0);
        _SessionToolRunner_onIdle.set(this, null);
        _SessionToolRunner_idleTimer.set(this, void 0);
        this.client = opts.client;
        this.sessionId = sessionId;
        this.tools = opts.tools;
        this.maxIdleMs = opts.maxIdleMs ?? DEFAULT_MAX_IDLE_MS;
        __classPrivateFieldSet(this, _SessionToolRunner_logger, loggerFor(opts.client), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_toolByName, new Map(opts.tools.map((t) => [toolName(t), t])), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_controller, new AbortController(), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_detachExternal, linkAbort(opts.signal, __classPrivateFieldGet(this, _SessionToolRunner_controller, "f")), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_requestOpts, opts.requestOptions, "f");
      }
      /** Read-only view of this runner's abort signal. */
      get signal() {
        return __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal;
      }
      /** Abort the runner. Background tasks will wind down and `for await` will exit cleanly. */
      abort() {
        __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
      }
      async *[(_SessionToolRunner_consumed = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_controller = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_detachExternal = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_requestOpts = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_toolByName = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_logger = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_seen = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_answered = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_results = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_inFlightCount = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_onIdle = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_idleTimer = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_instances = /* @__PURE__ */ new WeakSet(), Symbol.asyncIterator)]() {
        if (__classPrivateFieldGet(this, _SessionToolRunner_consumed, "f")) {
          throw new AnthropicError("Cannot iterate over a consumed SessionToolRunner");
        }
        __classPrivateFieldSet(this, _SessionToolRunner_consumed, true, "f");
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("session tool runner starting", {
          component: "session-tool-runner",
          session_id: this.sessionId
        });
        const streamPromise = __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_streamLoop).call(this).catch((e) => {
          if (!__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal.aborted) {
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error("stream loop failed", { error: String(e) });
          }
          __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
        });
        try {
          while (true) {
            const next = await __classPrivateFieldGet(this, _SessionToolRunner_results, "f").next(__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal);
            if (next.done)
              break;
            yield next.value;
          }
          await streamPromise;
          let pending;
          while ((pending = __classPrivateFieldGet(this, _SessionToolRunner_results, "f").tryShift()) !== void 0) {
            yield pending;
          }
        } finally {
          __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
          __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_disarmIdleTimer).call(this);
          await streamPromise;
          try {
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_drain).call(this);
          } catch (e) {
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("drain failed", { error: String(e) });
          }
          __classPrivateFieldGet(this, _SessionToolRunner_results, "f").close();
          for (const t of this.tools) {
            try {
              await t.close?.();
            } catch (e) {
              __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("tool.close failed", { tool: toolName(t), error: String(e) });
            }
          }
          __classPrivateFieldGet(this, _SessionToolRunner_detachExternal, "f").call(this);
        }
      }
    };
    _SessionToolRunner_requestOptions = function _SessionToolRunner_requestOptions2() {
      return {
        ...__classPrivateFieldGet(this, _SessionToolRunner_requestOpts, "f"),
        headers: buildHeaders([helperHeader("session-tool-runner"), __classPrivateFieldGet(this, _SessionToolRunner_requestOpts, "f")?.headers]),
        signal: __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal
      };
    }, _SessionToolRunner_streamLoop = // ===== event stream =====
    async function _SessionToolRunner_streamLoop2() {
      const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
      let backoff3 = STREAM_BACKOFF_START_MS;
      while (!ctrl.signal.aborted) {
        try {
          const stream = await this.client.beta.sessions.events.stream(this.sessionId, {}, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this));
          await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_reconcile).call(this);
          for await (const ev of stream) {
            backoff3 = STREAM_BACKOFF_START_MS;
            if (await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_handleStreamEvent).call(this, ev))
              return;
          }
        } catch (e) {
          ctrl.signal.throwIfAborted();
          if (isFatal4xx(e)) {
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error("permanent stream failure, shutting down", { error: String(e) });
            ctrl.abort();
            throw e;
          }
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("stream disconnected, reconnecting", {
            error: String(e),
            backoff_ms: backoff3
          });
        }
        ctrl.signal.throwIfAborted();
        await sleep(backoff3, ctrl.signal);
        backoff3 = Math.min(backoff3 * 2, STREAM_BACKOFF_CAP_MS);
      }
    }, _SessionToolRunner_reconcile = /**
     * Read full history before dispatching so a `tool_use` whose result appears
     * later in the same history is not re-executed. Runs after the live stream is
     * already attached (see {@link SessionToolRunner.#streamLoop}).
     */
    async function _SessionToolRunner_reconcile2() {
      const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
      const pending = [];
      let lastWasEndTurn = false;
      try {
        for await (const ev of this.client.beta.sessions.events.list(this.sessionId, { limit: 1e3 }, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this))) {
          __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_ingestHistory).call(this, ev, pending);
          lastWasEndTurn = isEndTurnIdle(ev);
        }
      } catch (e) {
        ctrl.signal.throwIfAborted();
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("reconcile list failed", { error: String(e) });
        for (const ev of pending)
          __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").delete(ev.id);
        return;
      }
      const unanswered = pending.filter((ev) => !__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id));
      if (lastWasEndTurn && unanswered.length === 0)
        __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_armIdleTimer).call(this);
      else
        __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_disarmIdleTimer).call(this);
      for (const ev of unanswered)
        await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_execute).call(this, ev);
    }, _SessionToolRunner_ingestHistory = function _SessionToolRunner_ingestHistory2(ev, pending) {
      if (ev.type === "agent.tool_use" || ev.type === "agent.custom_tool_use") {
        __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").add(ev.id);
        if (!__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id))
          pending.push(ev);
      } else if (ev.type === "user.tool_result") {
        __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.tool_use_id);
      } else if (ev.type === "user.custom_tool_result") {
        __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.custom_tool_use_id);
      }
    }, _SessionToolRunner_handleStreamEvent = /** Returns true when the runner should exit. */
    async function _SessionToolRunner_handleStreamEvent2(ev) {
      if (isEndTurnIdle(ev))
        __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_armIdleTimer).call(this);
      else
        __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_disarmIdleTimer).call(this);
      switch (ev.type) {
        case "agent.tool_use":
        case "agent.custom_tool_use":
          if (!__classPrivateFieldGet(this, _SessionToolRunner_seen, "f").has(ev.id)) {
            __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").add(ev.id);
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_execute).call(this, ev);
          }
          return false;
        case "user.tool_result":
          __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.tool_use_id);
          return false;
        case "user.custom_tool_result":
          __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.custom_tool_use_id);
          return false;
        case "session.status_terminated":
        case "session.deleted":
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("session terminated", {
            component: "session-tool-runner",
            session_id: this.sessionId
          });
          __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
          return true;
        default:
          return false;
      }
    }, _SessionToolRunner_armIdleTimer = function _SessionToolRunner_armIdleTimer2() {
      __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_disarmIdleTimer).call(this);
      if (this.maxIdleMs <= 0)
        return;
      __classPrivateFieldSet(this, _SessionToolRunner_idleTimer, setTimeout(() => {
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("session idle after end_turn; stopping", {
          component: "session-tool-runner",
          session_id: this.sessionId,
          max_idle_ms: this.maxIdleMs
        });
        __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
      }, this.maxIdleMs), "f");
    }, _SessionToolRunner_disarmIdleTimer = function _SessionToolRunner_disarmIdleTimer2() {
      if (__classPrivateFieldGet(this, _SessionToolRunner_idleTimer, "f") !== void 0) {
        clearTimeout(__classPrivateFieldGet(this, _SessionToolRunner_idleTimer, "f"));
        __classPrivateFieldSet(this, _SessionToolRunner_idleTimer, void 0, "f");
      }
    }, _SessionToolRunner_execute = // ===== tool execution =====
    async function _SessionToolRunner_execute2(ev) {
      var _a2, _b;
      if (__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id))
        return;
      __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("executing tool", {
        component: "session-tool-runner",
        session_id: this.sessionId,
        tool: ev.name,
        tool_use_id: ev.id
      });
      __classPrivateFieldSet(this, _SessionToolRunner_inFlightCount, (_a2 = __classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f"), _a2++, _a2), "f");
      try {
        const tool = __classPrivateFieldGet(this, _SessionToolRunner_toolByName, "f").get(ev.name);
        if (!tool) {
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("tool not owned by this runner; leaving the tool_use_id pending for its owner", {
            component: "session-tool-runner",
            session_id: this.sessionId,
            tool: ev.name,
            tool_use_id: ev.id
          });
          __classPrivateFieldGet(this, _SessionToolRunner_results, "f").push({ event: ev, toolUseId: ev.id, name: ev.name, isError: false, posted: false });
          return;
        }
        let content;
        let isError;
        const toolCtrl = new AbortController();
        const detachTool = linkAbort(__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal, toolCtrl);
        const timer = setTimeout(() => toolCtrl.abort(), TOOL_TIMEOUT_MS);
        try {
          const outcome = await runRunnableTool(tool, ev.input, {
            toolUse: ev,
            toolUseBlock: ev,
            signal: toolCtrl.signal
          });
          content = outcome.content;
          isError = outcome.isError;
        } finally {
          clearTimeout(timer);
          detachTool();
        }
        const result = buildResultEvent(ev, isError, toSessionContent(content));
        const posted = await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_sendResult).call(this, result, ev.id);
        __classPrivateFieldGet(this, _SessionToolRunner_results, "f").push({
          event: ev,
          result,
          toolUseId: ev.id,
          name: ev.name,
          isError,
          posted
        });
      } finally {
        __classPrivateFieldSet(this, _SessionToolRunner_inFlightCount, (_b = __classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f"), _b--, _b), "f");
        if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") === 0)
          __classPrivateFieldGet(this, _SessionToolRunner_onIdle, "f")?.call(this);
      }
    }, _SessionToolRunner_sendResult = async function _SessionToolRunner_sendResult2(result, toolUseId) {
      const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
      let lastErr;
      for (let i = 0; i < SEND_RETRIES; i++) {
        ctrl.signal.throwIfAborted();
        try {
          await this.client.beta.sessions.events.send(this.sessionId, { events: [result] }, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this));
          __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(toolUseId);
          return true;
        } catch (e) {
          lastErr = e;
          if (isFatal4xx(e))
            break;
          if (i < SEND_RETRIES - 1)
            await sleep((i + 1) * 1e3, ctrl.signal);
        }
      }
      __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error("failed to send tool result", {
        tool_use_id: toolUseId,
        error: String(lastErr)
      });
      return false;
    }, _SessionToolRunner_drain = /** Wait (bounded) for in-flight tool executions to finish during teardown. */
    async function _SessionToolRunner_drain2() {
      if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") === 0)
        return;
      await Promise.race([new Promise((r) => __classPrivateFieldSet(this, _SessionToolRunner_onIdle, r, "f")), sleep(DRAIN_TIMEOUT_MS)]);
      __classPrivateFieldSet(this, _SessionToolRunner_onIdle, null, "f");
      if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") > 0) {
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("drain timeout exceeded");
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/lib/transform-json-schema.mjs
var init_transform_json_schema = __esm({
  "node_modules/@anthropic-ai/sdk/lib/transform-json-schema.mjs"() {
    init_utils2();
  }
});

// node_modules/@anthropic-ai/sdk/helpers/beta/json-schema.mjs
function betaTool(options) {
  if (options.inputSchema.type !== "object") {
    throw new Error(`JSON schema for tool "${options.name}" must be an object, but got ${options.inputSchema.type}`);
  }
  return {
    type: "custom",
    name: options.name,
    input_schema: options.inputSchema,
    description: options.description,
    run: options.run,
    parse: (content) => content,
    ...options.close ? { close: options.close } : {}
  };
}
var init_json_schema = __esm({
  "node_modules/@anthropic-ai/sdk/helpers/beta/json-schema.mjs"() {
    init_sdk();
    init_transform_json_schema();
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/promise.mjs
function promiseWithResolvers() {
  let resolve4;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve4 = res;
    reject = rej;
  });
  return { promise, resolve: resolve4, reject };
}
var init_promise = __esm({
  "node_modules/@anthropic-ai/sdk/internal/utils/promise.mjs"() {
  }
});

// node_modules/@anthropic-ai/sdk/tools/agent-toolset/fs-util.mjs
import * as fs from "node:fs/promises";
import * as path2 from "node:path";
import { randomUUID as randomUUID8 } from "node:crypto";
async function realpathOrSelf(p) {
  try {
    return await fs.realpath(p);
  } catch {
    return p;
  }
}
async function canonicalize(abs) {
  const tail = [];
  let prefix = abs;
  for (; ; ) {
    let real;
    try {
      real = await fs.realpath(prefix);
    } catch {
      let isLink = false;
      try {
        isLink = (await fs.lstat(prefix)).isSymbolicLink();
      } catch {
      }
      if (isLink) {
        prefix = path2.resolve(path2.dirname(prefix), await fs.readlink(prefix));
        continue;
      }
      const parent = path2.dirname(prefix);
      if (parent === prefix)
        return abs;
      tail.push(path2.basename(prefix));
      prefix = parent;
      continue;
    }
    return tail.length ? path2.join(real, ...tail.reverse()) : real;
  }
}
async function confineToRoot(root, p, opts) {
  const allowOutside = opts?.allowOutside ?? false;
  if (path2.isAbsolute(p)) {
    if (!allowOutside) {
      throw new ToolError(`absolute path ${JSON.stringify(p)} not permitted`);
    }
    return path2.resolve(p);
  }
  const realRoot = await realpathOrSelf(path2.resolve(root));
  const abs = path2.resolve(realRoot, p);
  if (allowOutside)
    return abs;
  const real = await canonicalize(abs);
  const rootSep = realRoot.endsWith(path2.sep) ? realRoot : realRoot + path2.sep;
  if (real !== realRoot && !real.startsWith(rootSep)) {
    throw new ToolError(`path ${JSON.stringify(p)} escapes workdir`);
  }
  return real;
}
async function atomicWriteFile(targetPath, content) {
  const dir = path2.dirname(targetPath);
  const tempPath = path2.join(dir, `.tmp-${process.pid}-${randomUUID8()}`);
  let handle;
  try {
    handle = await fs.open(tempPath, "wx", FILE_CREATE_MODE);
    await handle.writeFile(content, "utf-8");
    await handle.sync();
    await handle.close();
    handle = void 0;
    await fs.rename(tempPath, targetPath);
  } catch (err) {
    if (handle)
      await handle.close().catch(() => {
      });
    await fs.unlink(tempPath).catch(() => {
    });
    throw err;
  }
}
function fsErrorMessage(err, file) {
  const code = err?.code;
  switch (code) {
    case "ENOENT":
      return `${file}: no such file or directory`;
    case "EACCES":
    case "EPERM":
      return `${file}: permission denied`;
    case "ENOTDIR":
      return `${file}: not a directory`;
    case "EISDIR":
      return `${file}: is a directory`;
    case "ELOOP":
      return `${file}: too many levels of symbolic links`;
    case "ENAMETOOLONG":
      return `${file}: file name too long`;
    case "ENOSPC":
      return `${file}: no space left on device`;
    case "EMFILE":
    case "ENFILE":
      return `${file}: too many open files`;
    default:
      return `${file}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
var DIR_CREATE_MODE, FILE_CREATE_MODE;
var init_fs_util = __esm({
  "node_modules/@anthropic-ai/sdk/tools/agent-toolset/fs-util.mjs"() {
    init_ToolError();
    DIR_CREATE_MODE = 493;
    FILE_CREATE_MODE = 420;
  }
});

// node_modules/@anthropic-ai/sdk/tools/agent-toolset/skills.mjs
import * as fs2 from "node:fs/promises";
import * as fssync from "node:fs";
import * as path3 from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
async function setupSkills(ctx) {
  const { client, sessionId } = ctx;
  if (!client || !sessionId)
    return async () => {
    };
  const log = loggerFor(client);
  const session = await client.beta.sessions.retrieve(sessionId);
  const skillsRoot = path3.resolve(ctx.workdir, "skills");
  const created = [];
  for (const skill of session.agent.skills) {
    try {
      const versionId = await resolveSkillVersion(client, skill.skill_id, skill.version);
      const version = await client.beta.skills.versions.retrieve(versionId, { skill_id: skill.skill_id });
      let dirname5 = path3.basename(version.name.trim());
      if (dirname5 === "" || dirname5 === "." || dirname5 === "..")
        dirname5 = skill.skill_id;
      const dest = path3.resolve(skillsRoot, dirname5);
      if (dest !== skillsRoot && !dest.startsWith(skillsRoot + path3.sep)) {
        log.warn("skill name escapes the skills dir; skipping", {
          component: "agent-tool-context",
          name: version.name
        });
        continue;
      }
      const resp = await client.beta.skills.versions.download(versionId, { skill_id: skill.skill_id });
      await fs2.rm(dest, { recursive: true, force: true });
      await fs2.mkdir(dest, { recursive: true, mode: DIR_CREATE_MODE });
      created.push(dest);
      await extractSkillArchive(resp, dest);
      log.info("downloaded skill", {
        component: "agent-tool-context",
        skill_id: skill.skill_id,
        version: versionId,
        dest
      });
    } catch (e) {
      log.warn("failed to download skill", {
        component: "agent-tool-context",
        skill_id: skill.skill_id,
        error: String(e)
      });
    }
  }
  return async () => {
    for (const dest of created) {
      await fs2.rm(dest, { recursive: true, force: true }).catch((e) => {
        log.warn("failed to clean up skill", { component: "agent-tool-context", dest, error: String(e) });
      });
    }
  };
}
async function resolveSkillVersion(client, skillId, version) {
  if (/^\d+$/.test(version))
    return version;
  let newest;
  for await (const v of client.beta.skills.versions.list(skillId)) {
    if (/^\d+$/.test(v.version) && (newest === void 0 || BigInt(v.version) > BigInt(newest))) {
      newest = v.version;
    }
  }
  if (newest === void 0) {
    throw new AnthropicError(`skill ${JSON.stringify(skillId)} has no concrete version to resolve ${JSON.stringify(version)} against`);
  }
  return newest;
}
function assertSafeMemberNames(names) {
  for (const raw of names.split("\n")) {
    const entry = raw.trim();
    if (!entry)
      continue;
    if (path3.isAbsolute(entry) || entry.split(/[\\/]/).includes("..")) {
      throw new AnthropicError(`refusing to extract unsafe archive member: ${entry}`);
    }
  }
}
function assertNoSpecialMembers(verboseListing) {
  for (const line of verboseListing.split("\n")) {
    const type = line.trimStart()[0];
    if (type === "l" || type === "h" || type === "b" || type === "c" || type === "p" || type === "s") {
      throw new AnthropicError("refusing to extract archive with symlink/hardlink/device member");
    }
  }
}
async function runArchiveTool(cmd, args) {
  try {
    const { stdout } = await execFileAsync(cmd, args);
    return stdout;
  } catch (e) {
    if (e != null && typeof e === "object" && e.code === "ENOENT") {
      throw new AnthropicError(`skill extraction requires the \`${cmd}\` command, but it was not found on PATH`);
    }
    throw e;
  }
}
function archiveTopDir(listing) {
  let top;
  let nested = false;
  for (const raw of listing.split("\n")) {
    const parts = raw.trim().split("/").filter((p) => p !== "" && p !== ".");
    if (parts.length === 0)
      continue;
    const first = parts[0];
    if (top === void 0)
      top = first;
    else if (first !== top)
      return "";
    if (parts.length > 1)
      nested = true;
  }
  return top !== void 0 && nested ? top : "";
}
async function extractSkillArchive(resp, dest) {
  const tmp = path3.join(dest, `.skill-archive-${process.pid}-${Date.now()}`);
  if (!resp.body) {
    throw new AnthropicError("skill download response had no body");
  }
  await pipeline(Readable.fromWeb(resp.body), fssync.createWriteStream(tmp));
  const stage = path3.join(path3.dirname(dest), `.skill-stage-${process.pid}-${Date.now()}`);
  try {
    const head = await readHead(tmp, 4);
    const isZip = head.length >= 4 && head[0] === 80 && head[1] === 75 && head[2] === 3 && head[3] === 4;
    const archiveCmd = isZip ? "unzip" : "tar";
    const listing = await runArchiveTool(archiveCmd, isZip ? ["-Z1", tmp] : ["-tf", tmp]);
    assertSafeMemberNames(listing);
    assertNoSpecialMembers(await runArchiveTool(archiveCmd, isZip ? ["-Z", tmp] : ["-tvf", tmp]));
    const top = archiveTopDir(listing);
    await fs2.mkdir(stage, { recursive: true, mode: DIR_CREATE_MODE });
    await runArchiveTool(archiveCmd, isZip ? ["-oq", tmp, "-d", stage] : ["-xf", tmp, "-C", stage]);
    const srcRoot = top ? path3.join(stage, top) : stage;
    for (const entry of await fs2.readdir(srcRoot)) {
      await fs2.rename(path3.join(srcRoot, entry), path3.join(dest, entry));
    }
  } finally {
    await fs2.rm(tmp, { force: true });
    await fs2.rm(stage, { recursive: true, force: true });
  }
}
async function readHead(file, n) {
  const handle = await fs2.open(file, "r");
  try {
    const buf = Buffer.alloc(n);
    const { bytesRead } = await handle.read(buf, 0, n, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
var execFileAsync;
var init_skills = __esm({
  "node_modules/@anthropic-ai/sdk/tools/agent-toolset/skills.mjs"() {
    init_error();
    init_log();
    init_fs_util();
    execFileAsync = promisify(execFile);
  }
});

// node_modules/@anthropic-ai/sdk/tools/agent-toolset/node.mjs
var node_exports = {};
__export(node_exports, {
  BashSession: () => BashSession,
  betaAgentToolset20260401: () => betaAgentToolset20260401,
  betaBashTool: () => betaBashTool,
  betaEditTool: () => betaEditTool,
  betaGlobTool: () => betaGlobTool,
  betaGrepTool: () => betaGrepTool,
  betaReadTool: () => betaReadTool,
  betaWriteTool: () => betaWriteTool,
  extractSkillArchive: () => extractSkillArchive,
  resolvePath: () => resolvePath,
  resolveSkillVersion: () => resolveSkillVersion,
  setupSkills: () => setupSkills
});
import * as fs3 from "node:fs/promises";
import * as fssync2 from "node:fs";
import * as path4 from "node:path";
import * as cp from "node:child_process";
import * as crypto from "node:crypto";
import * as readline from "node:readline";
function resolveMaxBytes(configured) {
  return configured === void 0 ? DEFAULT_MAX_FILE_BYTES : configured;
}
function betaAgentToolset20260401(ctx) {
  return [
    betaBashTool(ctx),
    betaReadTool(ctx),
    betaWriteTool(ctx),
    betaEditTool(ctx),
    betaGlobTool(ctx),
    betaGrepTool(ctx)
  ];
}
function resolvePath(ctx, p) {
  return confineToRoot(ctx.workdir, p, { allowOutside: ctx.unrestrictedPaths ?? false });
}
function scrubbedShellEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("ANTHROPIC_"))
      continue;
    env[key] = value;
  }
  return env;
}
function betaBashTool(ctx) {
  let session;
  let tail = Promise.resolve();
  return betaTool({
    name: "bash",
    description: "Run a bash command in a persistent shell. State (cwd, env vars) persists across calls.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run" },
        restart: { type: "boolean", description: "Restart the persistent shell before running" },
        timeout_ms: { type: "integer", description: "Per-call timeout in milliseconds" }
      }
    },
    run: async ({ command, restart, timeout_ms }, context) => {
      const prev = tail;
      const gate = promiseWithResolvers();
      tail = gate.promise;
      try {
        await prev;
      } catch {
      }
      try {
        if (restart) {
          session?.close();
          session = void 0;
        }
        if (!command) {
          if (restart)
            return "bash session restarted";
          throw new ToolError("bash: command is required");
        }
        session ?? (session = new BashSession(ctx.workdir, ctx.env));
        try {
          const { output, exitCode } = await session.exec(command, {
            timeoutMs: timeout_ms ?? BASH_DEFAULT_TIMEOUT_MS,
            signal: context?.signal
          });
          if (exitCode !== 0)
            throw new ToolError(output || `exit ${exitCode}`);
          return output;
        } catch (e) {
          if (e instanceof ToolError)
            throw e;
          session.close();
          session = void 0;
          throw new ToolError(`bash: ${e instanceof Error ? e.message : String(e)}`);
        }
      } finally {
        gate.resolve();
      }
    },
    close: () => {
      session?.close();
      session = void 0;
    }
  });
}
function betaReadTool(ctx) {
  return betaTool({
    name: "read",
    description: "Read a UTF-8 text file relative to the workdir.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string" },
        view_range: {
          type: "array",
          items: { type: "integer" },
          description: "[start_line, end_line] 1-indexed inclusive"
        }
      },
      required: ["file_path"]
    },
    run: async ({ file_path, view_range }) => {
      if (!file_path)
        throw new ToolError("read: file_path is required");
      const abs = await resolvePath(ctx, file_path);
      let data;
      try {
        const st = await fs3.stat(abs);
        if (!st.isFile()) {
          throw new ToolError(`read: ${file_path} is not a regular file`);
        }
        const limit2 = resolveMaxBytes(ctx.maxFileBytes);
        if (limit2 !== null && st.size > limit2) {
          throw new ToolError(`read: ${file_path} is ${st.size} bytes, exceeds ${limit2}-byte limit. Use bash (head/tail/sed) to read a slice.`);
        }
        data = await fs3.readFile(abs, "utf8");
      } catch (e) {
        if (e instanceof ToolError)
          throw e;
        throw new ToolError(`read: ${fsErrorMessage(e, file_path)}`);
      }
      if (!view_range)
        return data;
      if (view_range.length !== 2)
        throw new ToolError("read: view_range must be [start_line, end_line]");
      const [startLine, endLine] = view_range;
      const lines = data.split("\n");
      const start = Math.max(0, startLine - 1);
      const end = endLine > 0 ? endLine : lines.length;
      return lines.slice(start, end).join("\n");
    }
  });
}
function betaWriteTool(ctx) {
  return betaTool({
    name: "write",
    description: "Write a UTF-8 text file relative to the workdir, creating parent directories as needed.",
    inputSchema: {
      type: "object",
      properties: { file_path: { type: "string" }, content: { type: "string" } },
      required: ["file_path", "content"]
    },
    run: async ({ file_path, content }) => {
      if (!file_path)
        throw new ToolError("write: file_path is required");
      const abs = await resolvePath(ctx, file_path);
      try {
        await fs3.mkdir(path4.dirname(abs), { recursive: true, mode: DIR_CREATE_MODE });
        await atomicWriteFile(abs, content ?? "");
      } catch (e) {
        throw new ToolError(`write: ${fsErrorMessage(e, file_path)}`);
      }
      return `wrote ${Buffer.byteLength(content ?? "")} bytes to ${file_path}`;
    }
  });
}
function betaEditTool(ctx) {
  return betaTool({
    name: "edit",
    description: "Replace old_string with new_string in a file. old_string must be unique unless replace_all.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string" },
        old_string: { type: "string" },
        new_string: { type: "string" },
        replace_all: { type: "boolean" }
      },
      required: ["file_path", "old_string", "new_string"]
    },
    run: async ({ file_path, old_string, new_string, replace_all }) => {
      if (!file_path)
        throw new ToolError("edit: file_path is required");
      if (!old_string)
        throw new ToolError("edit: old_string is required");
      const abs = await resolvePath(ctx, file_path);
      let data;
      try {
        const st = await fs3.stat(abs);
        if (!st.isFile()) {
          throw new ToolError(`edit: ${file_path} is not a regular file`);
        }
        const limit2 = resolveMaxBytes(ctx.maxFileBytes);
        if (limit2 !== null && st.size > limit2) {
          throw new ToolError(`edit: ${file_path} is ${st.size} bytes, exceeds ${limit2}-byte limit. Use bash (sed/awk) to edit a large file.`);
        }
        data = await fs3.readFile(abs, "utf8");
      } catch (e) {
        if (e instanceof ToolError)
          throw e;
        throw new ToolError(`edit: ${fsErrorMessage(e, file_path)}`);
      }
      const count = data.split(old_string).length - 1;
      if (count === 0)
        throw new ToolError(`edit: old_string not found in ${file_path}`);
      let updated;
      if (replace_all) {
        updated = data.split(old_string).join(new_string);
      } else {
        if (count > 1)
          throw new ToolError(`edit: old_string appears ${count} times in ${file_path} (must be unique)`);
        updated = data.replace(old_string, () => new_string);
      }
      try {
        await atomicWriteFile(abs, updated);
      } catch (e) {
        throw new ToolError(`edit: write: ${fsErrorMessage(e, file_path)}`);
      }
      return `edited ${file_path} (${replace_all ? count : 1} replacement(s))`;
    }
  });
}
function betaGlobTool(ctx) {
  return betaTool({
    name: "glob",
    description: "Match files under the workdir against a glob pattern. Results are mtime-sorted, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string" },
        path: { type: "string", description: "Directory to search in. Defaults to the workdir." }
      },
      required: ["pattern"]
    },
    run: async ({ pattern, path: searchPath }) => {
      if (!pattern)
        throw new ToolError("glob: pattern is required");
      let root = path4.resolve(ctx.workdir);
      let pat = pattern;
      if (path4.isAbsolute(pattern)) {
        if (!ctx.unrestrictedPaths)
          throw new ToolError("glob: absolute pattern not permitted");
        root = path4.parse(pattern).root;
        pat = path4.relative(root, pattern);
      } else if (searchPath) {
        root = await resolvePath(ctx, searchPath);
      }
      if (!ctx.unrestrictedPaths && pat.split(/[\\/]/).includes("..")) {
        throw new ToolError('glob: ".." is not permitted in the pattern');
      }
      const matches = [];
      try {
        for await (const entry of fsGlob(pat, {
          cwd: root,
          withFileTypes: true,
          exclude: (d) => d.name === ".git" || d.name === "node_modules"
        })) {
          if (!entry.isFile())
            continue;
          const full = path4.join(entry.parentPath, entry.name);
          if (!ctx.unrestrictedPaths && !isWithin(root, full))
            continue;
          let mtime = 0;
          try {
            mtime = (await fs3.stat(full)).mtimeMs;
          } catch {
          }
          matches.push({ path: full, mtime });
        }
      } catch (e) {
        throw new ToolError(`glob: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (matches.length === 0)
        return "no matches";
      matches.sort((a, b) => b.mtime - a.mtime);
      return matches.slice(0, GLOB_RESULT_LIMIT).map((m) => m.path).join("\n");
    }
  });
}
function betaGrepTool(ctx) {
  return betaTool({
    name: "grep",
    description: "Search file contents for a regex. Uses ripgrep if available, otherwise a built-in walker.",
    inputSchema: {
      type: "object",
      properties: { pattern: { type: "string" }, path: { type: "string" } },
      required: ["pattern"]
    },
    run: async ({ pattern, path: p }, context) => {
      if (!pattern)
        throw new ToolError("grep: pattern is required");
      let searchPath = path4.resolve(ctx.workdir);
      if (p)
        searchPath = await resolvePath(ctx, p);
      const rg = await findRg();
      return rg ? runRipgrep(rg, pattern, searchPath, context?.signal) : runWalkGrep(pattern, searchPath, context?.signal);
    }
  });
}
function runRipgrep(rg, pattern, searchPath, signal) {
  return new Promise((resolve4, reject) => {
    const proc = cp.spawn(rg, ["-n", "--no-heading", "-e", pattern, "--", searchPath], {
      ...signal ? { signal } : {}
    });
    let out = "";
    let errOut = "";
    let truncated = false;
    proc.stdout.on("data", (d) => {
      if (truncated)
        return;
      out += d;
      if (out.length > GREP_OUTPUT_LIMIT) {
        truncated = true;
        out = out.slice(0, GREP_OUTPUT_LIMIT);
        proc.kill("SIGKILL");
      }
    });
    proc.stderr.on("data", (d) => errOut += d);
    proc.on("close", (code) => {
      if (signal?.aborted)
        return reject(new ToolError("grep: aborted"));
      if (truncated)
        return resolve4(out + `
[output truncated at ${GREP_OUTPUT_LIMIT} bytes]`);
      if (code === 0)
        return resolve4(out);
      if (code === 1)
        return resolve4("no matches");
      reject(new ToolError(`grep: rg failed: ${errOut || `exit ${code}`}`));
    });
    proc.on("error", (e) => {
      if (signal?.aborted)
        return reject(new ToolError("grep: aborted"));
      reject(new ToolError(`grep: rg failed: ${e.message}`));
    });
  });
}
async function runWalkGrep(pattern, root, signal) {
  let re;
  try {
    re = new RegExp(pattern);
  } catch (e) {
    throw new ToolError(`grep: invalid regex: ${e instanceof Error ? e.message : String(e)}`);
  }
  const hits = [];
  let budget = GREP_OUTPUT_LIMIT;
  const push = (line) => {
    budget -= line.length + 1;
    if (budget < 0) {
      hits.push(`[output truncated at ${GREP_OUTPUT_LIMIT} bytes]`);
      return false;
    }
    hits.push(line);
    return true;
  };
  const stat2 = await fs3.stat(root).catch(() => null);
  if (stat2?.isFile()) {
    await grepFile(root, re, push);
  } else {
    await walk(root, "", (rel) => grepFile(path4.join(root, rel), re, push), signal);
  }
  if (signal?.aborted)
    throw new ToolError("grep: aborted");
  if (hits.length === 0)
    return "no matches";
  return hits.join("\n");
}
async function grepFile(file, re, push) {
  const stream = fssync2.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let i = 0;
  try {
    for await (const line of rl) {
      i++;
      if (line.length > GREP_MAX_LINE_LENGTH)
        continue;
      if (re.test(line) && !push(`${file}:${i}:${line}`))
        return false;
    }
  } catch {
  } finally {
    stream.destroy();
  }
  return true;
}
function isWithin(root, p) {
  const rel = path4.relative(root, p);
  return rel === "" || !rel.startsWith(".." + path4.sep) && rel !== ".." && !path4.isAbsolute(rel);
}
async function walk(root, rel, fn, signal) {
  let remaining = WALK_MAX_ENTRIES;
  async function inner(rel2, depth) {
    if (depth > WALK_MAX_DEPTH)
      return true;
    if (signal?.aborted)
      return false;
    let entries;
    try {
      entries = await fs3.readdir(path4.join(root, rel2), { withFileTypes: true });
    } catch {
      return true;
    }
    for (const e of entries) {
      if (e.name === ".git" || e.name === "node_modules")
        continue;
      if (remaining-- <= 0)
        return false;
      if (signal?.aborted)
        return false;
      const childRel = rel2 ? path4.join(rel2, e.name) : e.name;
      if (e.isDirectory()) {
        if (!await inner(childRel, depth + 1))
          return false;
      } else if (e.isFile()) {
        if (await fn(childRel) === false)
          return false;
      }
    }
    return true;
  }
  await inner(rel, 0);
}
async function findRg() {
  const dirs = (process.env["PATH"] ?? "").split(path4.delimiter);
  for (const d of dirs) {
    const candidate = path4.join(d, "rg");
    try {
      await fs3.access(candidate, fssync2.constants.X_OK);
      return candidate;
    } catch {
    }
  }
  return null;
}
var _BashSession_instances, _BashSession_proc, _BashSession_buf, _BashSession_truncated, _BashSession_closed, _BashSession_waiting, _BashSession_append, BASH_OUTPUT_LIMIT, BASH_DEFAULT_TIMEOUT_MS, DEFAULT_MAX_FILE_BYTES, GREP_OUTPUT_LIMIT, GREP_MAX_LINE_LENGTH, GLOB_RESULT_LIMIT, ANSI_RE, fsGlob, BashSession, WALK_MAX_DEPTH, WALK_MAX_ENTRIES;
var init_node = __esm({
  "node_modules/@anthropic-ai/sdk/tools/agent-toolset/node.mjs"() {
    init_tslib();
    init_error();
    init_ToolError();
    init_json_schema();
    init_promise();
    init_fs_util();
    init_skills();
    BASH_OUTPUT_LIMIT = 100 * 1024;
    BASH_DEFAULT_TIMEOUT_MS = 12e4;
    DEFAULT_MAX_FILE_BYTES = 256 * 1024;
    GREP_OUTPUT_LIMIT = 100 * 1024;
    GREP_MAX_LINE_LENGTH = 2e3;
    GLOB_RESULT_LIMIT = 200;
    ANSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
    fsGlob = fs3.glob;
    BashSession = class {
      constructor(dir, env = scrubbedShellEnv()) {
        _BashSession_instances.add(this);
        _BashSession_proc.set(this, void 0);
        _BashSession_buf.set(this, "");
        _BashSession_truncated.set(this, false);
        _BashSession_closed.set(this, false);
        _BashSession_waiting.set(this, null);
        __classPrivateFieldSet(this, _BashSession_proc, cp.spawn("/bin/bash", ["--noprofile", "--norc"], {
          cwd: dir,
          // `env` is the full base environment (the scrubbed process env by
          // default, or the verbatim replacement from `AgentToolContext.env`).
          // PS1/PS2/TERM are shell-control settings BashSession always applies so
          // the pipe-based sentinel exec parsing works — not part of the
          // user-facing environment.
          env: { ...env, PS1: "", PS2: "", TERM: "dumb" },
          stdio: ["pipe", "pipe", "pipe"],
          detached: true
        }), "f");
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdout.setEncoding("utf8");
        __classPrivateFieldGet(this, _BashSession_proc, "f").stderr.setEncoding("utf8");
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdout.on("data", (d) => __classPrivateFieldGet(this, _BashSession_instances, "m", _BashSession_append).call(this, d));
        __classPrivateFieldGet(this, _BashSession_proc, "f").stderr.on("data", (d) => __classPrivateFieldGet(this, _BashSession_instances, "m", _BashSession_append).call(this, d));
        __classPrivateFieldGet(this, _BashSession_proc, "f").once("close", () => {
          __classPrivateFieldSet(this, _BashSession_closed, true, "f");
          const w = __classPrivateFieldGet(this, _BashSession_waiting, "f");
          __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
          w?.resolve();
        });
      }
      /** Whether the underlying shell process has exited. */
      get closed() {
        return __classPrivateFieldGet(this, _BashSession_closed, "f");
      }
      async exec(command, opts = {}) {
        if (__classPrivateFieldGet(this, _BashSession_closed, "f")) {
          throw new AnthropicError("bash session terminated");
        }
        const timeoutMs = opts.timeoutMs ?? BASH_DEFAULT_TIMEOUT_MS;
        const signal = opts.signal;
        if (signal?.aborted) {
          throw new AnthropicError("bash command aborted");
        }
        __classPrivateFieldSet(this, _BashSession_buf, "", "f");
        __classPrivateFieldSet(this, _BashSession_truncated, false, "f");
        const sentinel2 = `__ANT_CMD_${crypto.randomUUID()}_DONE__`;
        const sentinelSplit = `${sentinel2.slice(0, 8)}''${sentinel2.slice(8)}`;
        const wrapped = `{ ${command}
} </dev/null 2>&1; printf '\\n${sentinelSplit}%d\\n' $?
`;
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdin.write(wrapped);
        if (__classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(sentinel2) < 0) {
          const { promise: sentinelSeen, resolve: resolve4 } = promiseWithResolvers();
          __classPrivateFieldSet(this, _BashSession_waiting, { sentinel: sentinel2, resolve: resolve4 }, "f");
          let timer;
          let onAbort;
          try {
            await Promise.race([
              sentinelSeen,
              new Promise((_, reject) => {
                timer = setTimeout(() => reject(new AnthropicError(`bash command timed out after ${timeoutMs}ms`)), timeoutMs);
              }),
              new Promise((_, reject) => {
                if (!signal)
                  return;
                onAbort = () => reject(new AnthropicError("bash command aborted"));
                signal.addEventListener("abort", onAbort, { once: true });
              })
            ]);
          } finally {
            if (timer)
              clearTimeout(timer);
            if (onAbort && signal)
              signal.removeEventListener("abort", onAbort);
            __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
          }
        }
        const idx = __classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(sentinel2);
        if (idx < 0) {
          throw new AnthropicError("bash session terminated");
        }
        const tail = __classPrivateFieldGet(this, _BashSession_buf, "f").slice(idx + sentinel2.length);
        const m = tail.match(/^(-?\d+)/);
        const exitCode = m ? parseInt(m[1], 10) : -1;
        let out = __classPrivateFieldGet(this, _BashSession_buf, "f").slice(0, idx).replace(ANSI_RE, "").replace(/\n+$/, "");
        if (__classPrivateFieldGet(this, _BashSession_truncated, "f")) {
          out = `[output truncated]
${out}`;
        }
        return { output: out, exitCode };
      }
      close() {
        if (__classPrivateFieldGet(this, _BashSession_closed, "f"))
          return;
        __classPrivateFieldSet(this, _BashSession_closed, true, "f");
        const w = __classPrivateFieldGet(this, _BashSession_waiting, "f");
        __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
        w?.resolve();
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdout.destroy();
        __classPrivateFieldGet(this, _BashSession_proc, "f").stderr.destroy();
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdin.destroy();
        try {
          process.kill(-__classPrivateFieldGet(this, _BashSession_proc, "f").pid, "SIGKILL");
        } catch {
          __classPrivateFieldGet(this, _BashSession_proc, "f").kill("SIGKILL");
        }
        __classPrivateFieldGet(this, _BashSession_proc, "f").unref();
      }
    };
    _BashSession_proc = /* @__PURE__ */ new WeakMap(), _BashSession_buf = /* @__PURE__ */ new WeakMap(), _BashSession_truncated = /* @__PURE__ */ new WeakMap(), _BashSession_closed = /* @__PURE__ */ new WeakMap(), _BashSession_waiting = /* @__PURE__ */ new WeakMap(), _BashSession_instances = /* @__PURE__ */ new WeakSet(), _BashSession_append = function _BashSession_append2(d) {
      __classPrivateFieldSet(this, _BashSession_buf, __classPrivateFieldGet(this, _BashSession_buf, "f") + d, "f");
      if (__classPrivateFieldGet(this, _BashSession_buf, "f").length > BASH_OUTPUT_LIMIT) {
        __classPrivateFieldSet(this, _BashSession_buf, __classPrivateFieldGet(this, _BashSession_buf, "f").slice(__classPrivateFieldGet(this, _BashSession_buf, "f").length - BASH_OUTPUT_LIMIT), "f");
        __classPrivateFieldSet(this, _BashSession_truncated, true, "f");
      }
      if (__classPrivateFieldGet(this, _BashSession_waiting, "f") && __classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(__classPrivateFieldGet(this, _BashSession_waiting, "f").sentinel) >= 0) {
        const w = __classPrivateFieldGet(this, _BashSession_waiting, "f");
        __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
        w.resolve();
      }
    };
    WALK_MAX_DEPTH = 40;
    WALK_MAX_ENTRIES = 5e4;
  }
});

// node_modules/@anthropic-ai/sdk/lib/environments/worker.mjs
async function forceStop(client, work, log, requestOptions) {
  try {
    await client.beta.environments.work.stop(
      work.id,
      { environment_id: work.environment_id, force: true },
      // Caller's headers pass through; the helper-tag header is on the scoped
      // sub-client's default_headers via copyClientForHelper, so no per-call
      // re-stamping needed.
      { ...requestOptions, headers: buildHeaders([requestOptions?.headers]) }
    );
  } catch (e) {
    if (!isStatus(e, 409)) {
      log.error("force-stop on exit failed", { work_id: work.id, error: String(e) });
    }
  }
}
async function heartbeatLoop(client, work, ctrl, logger, requestOptions) {
  let intervalMs = HEARTBEAT_DEFAULT_MS;
  let last = NO_HEARTBEAT_SENTINEL;
  const beat = async () => {
    try {
      const resp = await client.beta.environments.work.heartbeat(work.id, { environment_id: work.environment_id, expected_last_heartbeat: last }, { ...requestOptions, headers: buildHeaders([requestOptions?.headers]), signal: ctrl.signal });
      last = resp.last_heartbeat;
      if (resp.ttl_seconds > 0) {
        intervalMs = Math.max(1e3, Math.min(resp.ttl_seconds * 1e3 / 2, HEARTBEAT_DEFAULT_MS));
      }
      if (resp.state === "stopping" || resp.state === "stopped") {
        logger.info("heartbeat signals shutdown", { work_id: work.id, state: resp.state });
        ctrl.abort();
      }
      if (!resp.lease_extended) {
        logger.warn("lease not extended, shutting down", { work_id: work.id });
        ctrl.abort();
      }
    } catch (e) {
      ctrl.signal.throwIfAborted();
      if (isFatal4xx(e)) {
        logger.error("permanent heartbeat failure", { work_id: work.id, error: String(e) });
        ctrl.abort();
        throw e;
      }
      logger.warn("transient heartbeat failure", { work_id: work.id, error: String(e) });
    }
  };
  await beat();
  while (!ctrl.signal.aborted) {
    await sleep(intervalMs, ctrl.signal);
    ctrl.signal.throwIfAborted();
    await beat();
  }
}
var _EnvironmentWorker_instances, _EnvironmentWorker_signal, _EnvironmentWorker_handleItem, HEARTBEAT_DEFAULT_MS, NO_HEARTBEAT_SENTINEL, EnvironmentWorker;
var init_worker = __esm({
  "node_modules/@anthropic-ai/sdk/lib/environments/worker.mjs"() {
    init_tslib();
    init_error();
    init_log();
    init_env();
    init_sleep();
    init_backoff();
    init_abort();
    init_headers();
    init_SessionToolRunner();
    init_poller();
    init_helper_client();
    HEARTBEAT_DEFAULT_MS = 3e4;
    NO_HEARTBEAT_SENTINEL = "NO_HEARTBEAT";
    EnvironmentWorker = class {
      constructor(opts) {
        _EnvironmentWorker_instances.add(this);
        _EnvironmentWorker_signal.set(this, void 0);
        this.client = opts.client;
        this.environmentId = opts.environmentId;
        this.environmentKey = opts.environmentKey;
        this.tools = opts.tools;
        this.workdir = opts.workdir ?? process.cwd();
        this.unrestrictedPaths = opts.unrestrictedPaths;
        this.maxFileBytes = opts.maxFileBytes;
        this.maxIdleMs = opts.maxIdleMs;
        this.workerId = opts.workerId;
        this.requestOptions = opts.requestOptions;
        __classPrivateFieldSet(this, _EnvironmentWorker_signal, opts.signal, "f");
      }
      /**
       * Poll the environment and service each claimed session until the supplied
       * signal (or the one passed to the constructor) aborts. Throws if
       * `environmentId` / `environmentKey` were not provided to the constructor.
       */
      async run(signal) {
        const { environmentId, environmentKey } = this;
        if (environmentId === void 0 || environmentKey === void 0) {
          throw new AnthropicError("EnvironmentWorker.run: environmentId and environmentKey are required to poll for work");
        }
        const externalSignal = signal ?? __classPrivateFieldGet(this, _EnvironmentWorker_signal, "f");
        const poller = new WorkPoller({
          client: this.client,
          environmentId,
          environmentKey,
          ...this.workerId !== void 0 ? { workerId: this.workerId } : {},
          ...externalSignal ? { signal: externalSignal } : {},
          ...this.requestOptions !== void 0 ? { requestOptions: this.requestOptions } : {},
          // The per-item handler force-stops every work item on exit; let it be the
          // single owner of `work.stop` rather than double-posting from the poller.
          autoStop: false
        });
        for await (const work of poller) {
          await __classPrivateFieldGet(this, _EnvironmentWorker_instances, "m", _EnvironmentWorker_handleItem).call(this, work, environmentKey, poller.signal);
        }
      }
      /**
       * Service a single, already-claimed work item without the poll loop: build the
       * per-session {@link AgentToolContext} (workdir from this worker's options),
       * download the session agent's skills (`setupSkills`), run a
       * {@link SessionToolRunner} for the session while heartbeating the work-item
       * lease in parallel, and force-stop the work item on exit (whether the runner
       * finishes normally, throws, or the heartbeat loop signals shutdown).
       *
       * Use this when something else does the claiming — e.g. a `worker poll
       * --on-work` script that hands an already-claimed item to a fresh process. The
       * work id / environment id / session id each fall back to `ANTHROPIC_WORK_ID` /
       * `ANTHROPIC_ENVIRONMENT_ID` / `ANTHROPIC_SESSION_ID` (the env vars that
       * command sets) when not passed; the environment key resolves from this
       * option, then the worker's own `environmentKey`, then
       * `ANTHROPIC_ENVIRONMENT_KEY`. With no arguments inside that command it just
       * works. Throws a clear error naming the first of the four required values
       * still missing after resolution.
       */
      async handleItem(opts) {
        const workId = opts?.workId ?? readEnv("ANTHROPIC_WORK_ID");
        const environmentId = opts?.environmentId ?? readEnv("ANTHROPIC_ENVIRONMENT_ID");
        const sessionId = opts?.sessionId ?? readEnv("ANTHROPIC_SESSION_ID");
        const environmentKey = opts?.environmentKey ?? this.environmentKey ?? readEnv("ANTHROPIC_ENVIRONMENT_KEY");
        if (!workId) {
          throw new AnthropicError("handleItem: workId is required \u2014 pass it or set ANTHROPIC_WORK_ID");
        }
        if (!environmentId) {
          throw new AnthropicError("handleItem: environmentId is required \u2014 pass it or set ANTHROPIC_ENVIRONMENT_ID");
        }
        if (!sessionId) {
          throw new AnthropicError("handleItem: sessionId is required \u2014 pass it or set ANTHROPIC_SESSION_ID");
        }
        if (!environmentKey) {
          throw new AnthropicError("handleItem: environmentKey is required \u2014 pass it, construct the worker with it, or set ANTHROPIC_ENVIRONMENT_KEY");
        }
        const work = {
          id: workId,
          environment_id: environmentId,
          data: { type: "session", id: sessionId }
        };
        await __classPrivateFieldGet(this, _EnvironmentWorker_instances, "m", _EnvironmentWorker_handleItem).call(this, work, environmentKey, opts?.signal ?? __classPrivateFieldGet(this, _EnvironmentWorker_signal, "f"));
      }
    };
    _EnvironmentWorker_signal = /* @__PURE__ */ new WeakMap(), _EnvironmentWorker_instances = /* @__PURE__ */ new WeakSet(), _EnvironmentWorker_handleItem = /**
     * The per-item body shared by {@link EnvironmentWorker.run}'s poll loop and
     * {@link EnvironmentWorker.handleItem}: run a {@link SessionToolRunner} for the
     * work item's session while heartbeating its lease, force-stopping on exit.
     * Non-session work items are ignored.
     */
    async function _EnvironmentWorker_handleItem2(work, environmentKey, externalSignal) {
      const log = loggerFor(this.client);
      const sessionClient = copyClientForHelper(this.client, {
        authToken: environmentKey,
        helper: "environments-worker"
      });
      const sessionId = work.data.id;
      const ctx = {
        workdir: this.workdir,
        client: this.client,
        sessionId,
        ...this.unrestrictedPaths !== void 0 ? { unrestrictedPaths: this.unrestrictedPaths } : {},
        ...this.maxFileBytes !== void 0 ? { maxFileBytes: this.maxFileBytes } : {}
      };
      const agentToolset = await Promise.resolve().then(() => (init_node(), node_exports));
      let cleanupSkills = async () => {
      };
      try {
        cleanupSkills = await agentToolset.setupSkills(ctx);
      } catch (e) {
        log.warn("skill setup failed", { session_id: sessionId, work_id: work.id, error: String(e) });
      }
      const tools = typeof this.tools === "function" ? this.tools(ctx) : this.tools ?? agentToolset.betaAgentToolset20260401(ctx);
      const ctrl = new AbortController();
      const detachExternal = linkAbort(externalSignal, ctrl);
      const heartbeatPromise = heartbeatLoop(sessionClient, work, ctrl, log, this.requestOptions).catch((e) => {
        if (!ctrl.signal.aborted)
          log.error("heartbeat loop failed", { work_id: work.id, error: String(e) });
        ctrl.abort();
      });
      try {
        const runner = new SessionToolRunner(sessionId, {
          client: sessionClient,
          tools,
          ...this.maxIdleMs !== void 0 ? { maxIdleMs: this.maxIdleMs } : {},
          ...this.requestOptions !== void 0 ? { requestOptions: this.requestOptions } : {},
          signal: ctrl.signal
        });
        for await (const _ of runner) {
        }
      } finally {
        ctrl.abort();
        detachExternal();
        await heartbeatPromise;
        await cleanupSkills().catch((e) => {
          log.warn("skill cleanup failed", { session_id: sessionId, work_id: work.id, error: String(e) });
        });
        await forceStop(sessionClient, work, log, this.requestOptions);
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/environments/work.mjs
var Work;
var init_work = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/environments/work.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    init_poller();
    init_worker();
    init_poller();
    init_worker();
    Work = class extends APIResource {
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Retrieve detailed information about a specific work item.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.retrieve('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      retrieve(workID, params, options) {
        const { environment_id, betas } = params;
        return this._client.get(path`/v1/environments/${environment_id}/work/${workID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Update work item metadata with merge semantics.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.update('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *     metadata: { foo: 'string' },
       *   });
       * ```
       */
      update(workID, params, options) {
        const { environment_id, betas, ...body } = params;
        return this._client.post(path`/v1/environments/${environment_id}/work/${workID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * List work items in an environment.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaSelfHostedWork of client.beta.environments.work.list(
       *   'env_011CZkZ9X2dpNyB7HsEFoRfW',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(environmentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/environments/${environmentID}/work?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Acknowledge receipt of a work item, transitioning it from 'queued' to 'starting'
       * and removing it from the queue.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.ack('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      ack(workID, params, options) {
        const { environment_id, betas } = params;
        return this._client.post(path`/v1/environments/${environment_id}/work/${workID}/ack?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Record a heartbeat for a work item to maintain the lease.
       *
       * @example
       * ```ts
       * const betaSelfHostedWorkHeartbeatResponse =
       *   await client.beta.environments.work.heartbeat('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      heartbeat(workID, params, options) {
        const { environment_id, desired_ttl_seconds, expected_last_heartbeat, betas } = params;
        return this._client.post(path`/v1/environments/${environment_id}/work/${workID}/heartbeat?beta=true`, {
          query: { desired_ttl_seconds, expected_last_heartbeat },
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Long poll for work items in the queue.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.poll(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      poll(environmentID, params = {}, options) {
        const { betas, "Anthropic-Worker-ID": anthropicWorkerID, ...query } = params ?? {};
        return this._client.get(path`/v1/environments/${environmentID}/work/poll?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString(),
              ...anthropicWorkerID != null ? { "Anthropic-Worker-ID": anthropicWorkerID } : void 0
            },
            options?.headers
          ])
        });
      }
      /**
       * Get statistics about the work queue for an environment.
       *
       * @example
       * ```ts
       * const betaSelfHostedWorkQueueStats =
       *   await client.beta.environments.work.stats(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      stats(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/environments/${environmentID}/work/stats?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Stop a work item, initiating graceful or forced shutdown.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.stop('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      stop(workID, params, options) {
        const { environment_id, betas, ...body } = params;
        return this._client.post(path`/v1/environments/${environment_id}/work/${workID}/stop?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Continuously claim work from a self-hosted environment, ack each item,
       * and yield it. Posts `stop` automatically when the consumer's loop body
       * returns or when iteration ends.
       *
       * @example
       * ```ts
       * for await (const work of client.beta.environments.work.poller({
       *   environmentId,
       *   environmentKey,
       * })) {
       *   if (work.data.type !== 'session') continue;
       *   // ...service the work...
       * }
       * ```
       */
      poller(opts) {
        return new WorkPoller({ ...opts, client: this._client });
      }
      /**
       * The self-hosted environment runner: poll for work, and for each claimed
       * session set up the workdir, download the agent's skills, run the tools while
       * heartbeating the lease, and force-stop on exit.
       *
       * @example
       * ```ts
       * // Long-running daemon — poll, serve each session, loop:
       * await client.beta.environments.work
       *   .worker({ environmentId, environmentKey, workdir: '/workspace' })
       *   .run();
       *
       * // Or service one already-claimed work item (e.g. inside a sandbox spawned
       * // by `ant worker poll --on-work`) — handleItem() reads the ANTHROPIC_* env vars:
       * await client.beta.environments.work.worker({ workdir: '/workspace' }).handleItem();
       * ```
       */
      worker(opts) {
        return new EnvironmentWorker({ ...opts, client: this._client });
      }
    };
    Work.WorkPoller = WorkPoller;
    Work.EnvironmentWorker = EnvironmentWorker;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/environments/environments.mjs
var Environments;
var init_environments = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/environments/environments.mjs"() {
    init_resource();
    init_work();
    init_work();
    init_pagination();
    init_headers();
    init_path();
    Environments = class extends APIResource {
      constructor() {
        super(...arguments);
        this.work = new Work(this._client);
      }
      /**
       * Create a new environment with the specified configuration.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.create({
       *     name: 'python-data-analysis',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/environments?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Retrieve a specific environment by ID.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.retrieve(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      retrieve(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/environments/${environmentID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update an existing environment's configuration.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.update(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      update(environmentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/environments/${environmentID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List environments with pagination support.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaEnvironment of client.beta.environments.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/environments?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete an environment by ID. Returns a confirmation of the deletion.
       *
       * @example
       * ```ts
       * const betaEnvironmentDeleteResponse =
       *   await client.beta.environments.delete(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      delete(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path`/v1/environments/${environmentID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive an environment by ID. Archived environments cannot be used to create new
       * sessions.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.archive(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      archive(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/environments/${environmentID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Environments.Work = Work;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memories.mjs
var Memories;
var init_memories = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memories.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Memories = class extends APIResource {
      /**
       * Create a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemory =
       *   await client.beta.memoryStores.memories.create(
       *     'memory_store_id',
       *     { content: 'content', path: 'xx' },
       *   );
       * ```
       */
      create(memoryStoreID, params, options) {
        const { view, betas, ...body } = params;
        return this._client.post(path`/v1/memory_stores/${memoryStoreID}/memories?beta=true`, {
          query: { view },
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Retrieve a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemory =
       *   await client.beta.memoryStores.memories.retrieve(
       *     'memory_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      retrieve(memoryID, params, options) {
        const { memory_store_id, betas, ...query } = params;
        return this._client.get(path`/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemory =
       *   await client.beta.memoryStores.memories.update(
       *     'memory_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      update(memoryID, params, options) {
        const { memory_store_id, view, betas, ...body } = params;
        return this._client.post(path`/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
          query: { view },
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List memories
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsMemoryListItem of client.beta.memoryStores.memories.list(
       *   'memory_store_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(memoryStoreID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/memory_stores/${memoryStoreID}/memories?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedMemory =
       *   await client.beta.memoryStores.memories.delete(
       *     'memory_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      delete(memoryID, params, options) {
        const { memory_store_id, expected_content_sha256, betas } = params;
        return this._client.delete(path`/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
          query: { expected_content_sha256 },
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-versions.mjs
var MemoryVersions;
var init_memory_versions = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-versions.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    MemoryVersions = class extends APIResource {
      /**
       * Retrieve a memory version
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryVersion =
       *   await client.beta.memoryStores.memoryVersions.retrieve(
       *     'memory_version_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      retrieve(memoryVersionID, params, options) {
        const { memory_store_id, betas, ...query } = params;
        return this._client.get(path`/v1/memory_stores/${memory_store_id}/memory_versions/${memoryVersionID}?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List memory versions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsMemoryVersion of client.beta.memoryStores.memoryVersions.list(
       *   'memory_store_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(memoryStoreID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/memory_stores/${memoryStoreID}/memory_versions?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Redact a memory version
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryVersion =
       *   await client.beta.memoryStores.memoryVersions.redact(
       *     'memory_version_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      redact(memoryVersionID, params, options) {
        const { memory_store_id, betas } = params;
        return this._client.post(path`/v1/memory_stores/${memory_store_id}/memory_versions/${memoryVersionID}/redact?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-stores.mjs
var MemoryStores;
var init_memory_stores = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-stores.mjs"() {
    init_resource();
    init_memories();
    init_memories();
    init_memory_versions();
    init_memory_versions();
    init_pagination();
    init_headers();
    init_path();
    MemoryStores = class extends APIResource {
      constructor() {
        super(...arguments);
        this.memories = new Memories(this._client);
        this.memoryVersions = new MemoryVersions(this._client);
      }
      /**
       * Create a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.create({ name: 'x' });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/memory_stores?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Retrieve a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.retrieve(
       *     'memory_store_id',
       *   );
       * ```
       */
      retrieve(memoryStoreID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/memory_stores/${memoryStoreID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.update('memory_store_id');
       * ```
       */
      update(memoryStoreID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/memory_stores/${memoryStoreID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List memory stores
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsMemoryStore of client.beta.memoryStores.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/memory_stores?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedMemoryStore =
       *   await client.beta.memoryStores.delete('memory_store_id');
       * ```
       */
      delete(memoryStoreID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path`/v1/memory_stores/${memoryStoreID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.archive('memory_store_id');
       * ```
       */
      archive(memoryStoreID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/memory_stores/${memoryStoreID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    MemoryStores.Memories = Memories;
    MemoryStores.MemoryVersions = MemoryVersions;
  }
});

// node_modules/@anthropic-ai/sdk/error.mjs
var init_error2 = __esm({
  "node_modules/@anthropic-ai/sdk/error.mjs"() {
    init_error();
  }
});

// node_modules/@anthropic-ai/sdk/internal/decoders/jsonl.mjs
var JSONLDecoder;
var init_jsonl = __esm({
  "node_modules/@anthropic-ai/sdk/internal/decoders/jsonl.mjs"() {
    init_error();
    init_shims();
    init_line();
    JSONLDecoder = class _JSONLDecoder {
      constructor(iterator, controller) {
        this.iterator = iterator;
        this.controller = controller;
      }
      async *decoder() {
        const lineDecoder = new LineDecoder();
        for await (const chunk of this.iterator) {
          for (const line of lineDecoder.decode(chunk)) {
            yield JSON.parse(line);
          }
        }
        for (const line of lineDecoder.flush()) {
          yield JSON.parse(line);
        }
      }
      [Symbol.asyncIterator]() {
        return this.decoder();
      }
      static fromResponse(response, controller) {
        if (!response.body) {
          controller.abort();
          if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
            throw new AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
          }
          throw new AnthropicError(`Attempted to iterate over a response with no body`);
        }
        return new _JSONLDecoder(ReadableStreamToAsyncIterable(response.body), controller);
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/messages/batches.mjs
var Batches;
var init_batches = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/messages/batches.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_jsonl();
    init_error2();
    init_path();
    Batches = class extends APIResource {
      /**
       * Send a batch of Message creation requests.
       *
       * The Message Batches API can be used to process multiple Messages API requests at
       * once. Once a Message Batch is created, it begins processing immediately. Batches
       * can take up to 24 hours to complete.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.create({
       *     requests: [
       *       {
       *         custom_id: 'my-custom-id-1',
       *         params: {
       *           max_tokens: 1024,
       *           messages: [
       *             { content: 'Hello, world', role: 'user' },
       *           ],
       *           model: 'claude-opus-4-6',
       *         },
       *       },
       *     ],
       *   });
       * ```
       */
      create(params, options) {
        const { betas, user_profile_id, ...body } = params;
        return this._client.post("/v1/messages/batches?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString(),
              ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0
            },
            options?.headers
          ])
        });
      }
      /**
       * This endpoint is idempotent and can be used to poll for Message Batch
       * completion. To access the results of a Message Batch, make a request to the
       * `results_url` field in the response.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.retrieve(
       *     'message_batch_id',
       *   );
       * ```
       */
      retrieve(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/messages/batches/${messageBatchID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List all Message Batches within a Workspace. Most recently created batches are
       * returned first.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaMessageBatch of client.beta.messages.batches.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/messages/batches?beta=true", Page, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete a Message Batch.
       *
       * Message Batches can only be deleted once they've finished processing. If you'd
       * like to delete an in-progress batch, you must first cancel it.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaDeletedMessageBatch =
       *   await client.beta.messages.batches.delete(
       *     'message_batch_id',
       *   );
       * ```
       */
      delete(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path`/v1/messages/batches/${messageBatchID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Batches may be canceled any time before processing ends. Once cancellation is
       * initiated, the batch enters a `canceling` state, at which time the system may
       * complete any in-progress, non-interruptible requests before finalizing
       * cancellation.
       *
       * The number of canceled requests is specified in `request_counts`. To determine
       * which requests were canceled, check the individual results within the batch.
       * Note that cancellation may not result in any canceled requests if they were
       * non-interruptible.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.cancel(
       *     'message_batch_id',
       *   );
       * ```
       */
      cancel(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/messages/batches/${messageBatchID}/cancel?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Streams the results of a Message Batch as a `.jsonl` file.
       *
       * Each line in the file is a JSON object containing the result of a single request
       * in the Message Batch. Results are not guaranteed to be in the same order as
       * requests. Use the `custom_id` field to match results to requests.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatchIndividualResponse =
       *   await client.beta.messages.batches.results(
       *     'message_batch_id',
       *   );
       * ```
       */
      async results(messageBatchID, params = {}, options) {
        const batch = await this.retrieve(messageBatchID);
        if (!batch.results_url) {
          throw new AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
        }
        const { betas } = params ?? {};
        return this._client.get(batch.results_url, {
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString(),
              Accept: "application/binary"
            },
            options?.headers
          ]),
          stream: true,
          __binaryResponse: true
        })._thenUnwrap((_, props) => JSONLDecoder.fromResponse(props.response, props.controller));
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/constants.mjs
var MODEL_NONSTREAMING_TOKENS;
var init_constants = __esm({
  "node_modules/@anthropic-ai/sdk/internal/constants.mjs"() {
    MODEL_NONSTREAMING_TOKENS = {
      "claude-opus-4-20250514": 8192,
      "claude-opus-4-0": 8192,
      "claude-4-opus-20250514": 8192,
      "anthropic.claude-opus-4-20250514-v1:0": 8192,
      "claude-opus-4@20250514": 8192,
      "claude-opus-4-1-20250805": 8192,
      "anthropic.claude-opus-4-1-20250805-v1:0": 8192,
      "claude-opus-4-1@20250805": 8192
    };
  }
});

// node_modules/@anthropic-ai/sdk/lib/beta-parser.mjs
function getOutputFormat(params) {
  return params?.output_format ?? params?.output_config?.format;
}
function maybeParseBetaMessage(message, params, opts) {
  const outputFormat = getOutputFormat(params);
  if (!params || !("parse" in (outputFormat ?? {}))) {
    return {
      ...message,
      content: message.content.map((block) => {
        if (block.type === "text") {
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: null,
            enumerable: false
          });
          return Object.defineProperty(parsedBlock, "parsed", {
            get() {
              opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
              return null;
            },
            enumerable: false
          });
        }
        return block;
      }),
      parsed_output: null
    };
  }
  return parseBetaMessage(message, params, opts);
}
function parseBetaMessage(message, params, opts) {
  let firstParsedOutput = null;
  const content = message.content.map((block) => {
    if (block.type === "text") {
      const parsedOutput = parseBetaOutputFormat(params, block.text);
      if (firstParsedOutput === null) {
        firstParsedOutput = parsedOutput;
      }
      const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
        value: parsedOutput,
        enumerable: false
      });
      return Object.defineProperty(parsedBlock, "parsed", {
        get() {
          opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
          return parsedOutput;
        },
        enumerable: false
      });
    }
    return block;
  });
  return {
    ...message,
    content,
    parsed_output: firstParsedOutput
  };
}
function parseBetaOutputFormat(params, content) {
  const outputFormat = getOutputFormat(params);
  if (outputFormat?.type !== "json_schema") {
    return null;
  }
  try {
    if ("parse" in outputFormat) {
      return outputFormat.parse(content);
    }
    return JSON.parse(content);
  } catch (error) {
    throw new AnthropicError(`Failed to parse structured output: ${error}`);
  }
}
var init_beta_parser = __esm({
  "node_modules/@anthropic-ai/sdk/lib/beta-parser.mjs"() {
    init_error();
  }
});

// node_modules/@anthropic-ai/sdk/streaming.mjs
var init_streaming2 = __esm({
  "node_modules/@anthropic-ai/sdk/streaming.mjs"() {
    init_streaming();
  }
});

// node_modules/@anthropic-ai/sdk/_vendor/partial-json-parser/parser.mjs
var tokenize, strip, unstrip, generate, partialParse;
var init_parser = __esm({
  "node_modules/@anthropic-ai/sdk/_vendor/partial-json-parser/parser.mjs"() {
    tokenize = (input) => {
      let current = 0;
      let tokens = [];
      while (current < input.length) {
        let char = input[current];
        if (char === "\\") {
          current++;
          continue;
        }
        if (char === "{") {
          tokens.push({
            type: "brace",
            value: "{"
          });
          current++;
          continue;
        }
        if (char === "}") {
          tokens.push({
            type: "brace",
            value: "}"
          });
          current++;
          continue;
        }
        if (char === "[") {
          tokens.push({
            type: "paren",
            value: "["
          });
          current++;
          continue;
        }
        if (char === "]") {
          tokens.push({
            type: "paren",
            value: "]"
          });
          current++;
          continue;
        }
        if (char === ":") {
          tokens.push({
            type: "separator",
            value: ":"
          });
          current++;
          continue;
        }
        if (char === ",") {
          tokens.push({
            type: "delimiter",
            value: ","
          });
          current++;
          continue;
        }
        if (char === '"') {
          let value = "";
          let danglingQuote = false;
          char = input[++current];
          while (char !== '"') {
            if (current === input.length) {
              danglingQuote = true;
              break;
            }
            if (char === "\\") {
              current++;
              if (current === input.length) {
                danglingQuote = true;
                break;
              }
              value += char + input[current];
              char = input[++current];
            } else {
              value += char;
              char = input[++current];
            }
          }
          char = input[++current];
          if (!danglingQuote) {
            tokens.push({
              type: "string",
              value
            });
          }
          continue;
        }
        let WHITESPACE = /\s/;
        if (char && WHITESPACE.test(char)) {
          current++;
          continue;
        }
        let NUMBERS = /[0-9]/;
        if (char && NUMBERS.test(char) || char === "-" || char === ".") {
          let value = "";
          if (char === "-") {
            value += char;
            char = input[++current];
          }
          while (char && (NUMBERS.test(char) || char === "." || // exponent marker, e.g. `1e10` or `1.5E-9`
          char === "e" || char === "E" || // exponent sign, only valid immediately after the exponent marker
          (char === "-" || char === "+") && (value[value.length - 1] === "e" || value[value.length - 1] === "E"))) {
            value += char;
            char = input[++current];
          }
          tokens.push({
            type: "number",
            value
          });
          continue;
        }
        let LETTERS = /[a-z]/i;
        if (char && LETTERS.test(char)) {
          let value = "";
          while (char && LETTERS.test(char)) {
            if (current === input.length) {
              break;
            }
            value += char;
            char = input[++current];
          }
          if (value == "true" || value == "false" || value === "null") {
            tokens.push({
              type: "name",
              value
            });
          } else {
            current++;
            continue;
          }
          continue;
        }
        current++;
      }
      return tokens;
    };
    strip = (tokens) => {
      if (tokens.length === 0) {
        return tokens;
      }
      let lastToken = tokens[tokens.length - 1];
      switch (lastToken.type) {
        case "separator":
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
          break;
        case "number":
          let lastCharacterOfLastToken = lastToken.value[lastToken.value.length - 1];
          if (lastCharacterOfLastToken === "." || lastCharacterOfLastToken === "-" || lastCharacterOfLastToken === "+" || lastCharacterOfLastToken === "e" || lastCharacterOfLastToken === "E") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          }
        case "string":
          let tokenBeforeTheLastToken = tokens[tokens.length - 2];
          if (tokenBeforeTheLastToken?.type === "delimiter") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          } else if (tokenBeforeTheLastToken?.type === "brace" && tokenBeforeTheLastToken.value === "{") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          }
          break;
        case "delimiter":
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
          break;
      }
      return tokens;
    };
    unstrip = (tokens) => {
      let tail = [];
      tokens.map((token) => {
        if (token.type === "brace") {
          if (token.value === "{") {
            tail.push("}");
          } else {
            tail.splice(tail.lastIndexOf("}"), 1);
          }
        }
        if (token.type === "paren") {
          if (token.value === "[") {
            tail.push("]");
          } else {
            tail.splice(tail.lastIndexOf("]"), 1);
          }
        }
      });
      if (tail.length > 0) {
        tail.reverse().map((item) => {
          if (item === "}") {
            tokens.push({
              type: "brace",
              value: "}"
            });
          } else if (item === "]") {
            tokens.push({
              type: "paren",
              value: "]"
            });
          }
        });
      }
      return tokens;
    };
    generate = (tokens) => {
      let output = "";
      tokens.map((token) => {
        switch (token.type) {
          case "string":
            output += '"' + token.value + '"';
            break;
          default:
            output += token.value;
            break;
        }
      });
      return output;
    };
    partialParse = (input) => JSON.parse(generate(unstrip(strip(tokenize(input)))));
  }
});

// node_modules/@anthropic-ai/sdk/internal/message-stream-utils.mjs
function withLazyInput(prev, jsonBuf) {
  const next = {};
  for (const key of Object.keys(prev)) {
    if (key !== "input")
      next[key] = prev[key];
  }
  Object.defineProperty(next, JSON_BUF_PROPERTY, { value: jsonBuf, enumerable: false, writable: true });
  let input;
  let parsed = false;
  Object.defineProperty(next, "input", {
    enumerable: true,
    configurable: true,
    get() {
      if (!parsed) {
        input = jsonBuf ? partialParse(jsonBuf) : {};
        parsed = true;
      }
      return input;
    }
  });
  return next;
}
var JSON_BUF_PROPERTY;
var init_message_stream_utils = __esm({
  "node_modules/@anthropic-ai/sdk/internal/message-stream-utils.mjs"() {
    init_parser();
    JSON_BUF_PROPERTY = "__json_buf";
  }
});

// node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.mjs
function tracksToolInput(content) {
  return content.type === "tool_use" || content.type === "server_tool_use" || content.type === "mcp_tool_use";
}
function checkNever(x) {
}
var _BetaMessageStream_instances, _BetaMessageStream_currentMessageSnapshot, _BetaMessageStream_params, _BetaMessageStream_connectedPromise, _BetaMessageStream_resolveConnectedPromise, _BetaMessageStream_rejectConnectedPromise, _BetaMessageStream_endPromise, _BetaMessageStream_resolveEndPromise, _BetaMessageStream_rejectEndPromise, _BetaMessageStream_listeners, _BetaMessageStream_ended, _BetaMessageStream_errored, _BetaMessageStream_aborted, _BetaMessageStream_catchingPromiseCreated, _BetaMessageStream_response, _BetaMessageStream_request_id, _BetaMessageStream_logger, _BetaMessageStream_getFinalMessage, _BetaMessageStream_getFinalText, _BetaMessageStream_handleError, _BetaMessageStream_beginRequest, _BetaMessageStream_addStreamEvent, _BetaMessageStream_endRequest, _BetaMessageStream_accumulateMessage, _BetaMessageStream_toolInputParseError, BetaMessageStream;
var init_BetaMessageStream = __esm({
  "node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.mjs"() {
    init_tslib();
    init_stainless_helper_header();
    init_error2();
    init_errors();
    init_streaming2();
    init_beta_parser();
    init_message_stream_utils();
    BetaMessageStream = class _BetaMessageStream {
      constructor(params, opts) {
        _BetaMessageStream_instances.add(this);
        this.messages = [];
        this.receivedMessages = [];
        _BetaMessageStream_currentMessageSnapshot.set(this, void 0);
        _BetaMessageStream_params.set(this, null);
        this.controller = new AbortController();
        _BetaMessageStream_connectedPromise.set(this, void 0);
        _BetaMessageStream_resolveConnectedPromise.set(this, () => {
        });
        _BetaMessageStream_rejectConnectedPromise.set(this, () => {
        });
        _BetaMessageStream_endPromise.set(this, void 0);
        _BetaMessageStream_resolveEndPromise.set(this, () => {
        });
        _BetaMessageStream_rejectEndPromise.set(this, () => {
        });
        _BetaMessageStream_listeners.set(this, {});
        _BetaMessageStream_ended.set(this, false);
        _BetaMessageStream_errored.set(this, false);
        _BetaMessageStream_aborted.set(this, false);
        _BetaMessageStream_catchingPromiseCreated.set(this, false);
        _BetaMessageStream_response.set(this, void 0);
        _BetaMessageStream_request_id.set(this, void 0);
        _BetaMessageStream_logger.set(this, void 0);
        _BetaMessageStream_handleError.set(this, (error) => {
          __classPrivateFieldSet(this, _BetaMessageStream_errored, true, "f");
          if (isAbortError(error)) {
            error = new APIUserAbortError();
          }
          if (error instanceof APIUserAbortError) {
            __classPrivateFieldSet(this, _BetaMessageStream_aborted, true, "f");
            return this._emit("abort", error);
          }
          if (error instanceof AnthropicError) {
            return this._emit("error", error);
          }
          if (error instanceof Error) {
            const anthropicError = new AnthropicError(error.message);
            anthropicError.cause = error;
            return this._emit("error", anthropicError);
          }
          return this._emit("error", new AnthropicError(String(error)));
        });
        __classPrivateFieldSet(this, _BetaMessageStream_connectedPromise, new Promise((resolve4, reject) => {
          __classPrivateFieldSet(this, _BetaMessageStream_resolveConnectedPromise, resolve4, "f");
          __classPrivateFieldSet(this, _BetaMessageStream_rejectConnectedPromise, reject, "f");
        }), "f");
        __classPrivateFieldSet(this, _BetaMessageStream_endPromise, new Promise((resolve4, reject) => {
          __classPrivateFieldSet(this, _BetaMessageStream_resolveEndPromise, resolve4, "f");
          __classPrivateFieldSet(this, _BetaMessageStream_rejectEndPromise, reject, "f");
        }), "f");
        __classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f").catch(() => {
        });
        __classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f").catch(() => {
        });
        __classPrivateFieldSet(this, _BetaMessageStream_params, params, "f");
        __classPrivateFieldSet(this, _BetaMessageStream_logger, opts?.logger ?? console, "f");
      }
      get response() {
        return __classPrivateFieldGet(this, _BetaMessageStream_response, "f");
      }
      get request_id() {
        return __classPrivateFieldGet(this, _BetaMessageStream_request_id, "f");
      }
      /**
       * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
       * returned vie the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * This is the same as the `APIPromise.withResponse()` method.
       *
       * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
       * as no `Response` is available.
       */
      async withResponse() {
        __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
        const response = await __classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f");
        if (!response) {
          throw new Error("Could not resolve a `Response` object");
        }
        return {
          data: this,
          response,
          request_id: response.headers.get("request-id")
        };
      }
      /**
       * Intended for use on the frontend, consuming a stream produced with
       * `.toReadableStream()` on the backend.
       *
       * Note that messages sent to the model do not appear in `.on('message')`
       * in this context.
       */
      static fromReadableStream(stream) {
        const runner = new _BetaMessageStream(null);
        runner._run(() => runner._fromReadableStream(stream));
        return runner;
      }
      static createMessage(messages, params, options, { logger } = {}) {
        const runner = new _BetaMessageStream(params, { logger });
        for (const message of params.messages) {
          runner._addMessageParam(message);
        }
        __classPrivateFieldSet(runner, _BetaMessageStream_params, { ...params, stream: true }, "f");
        runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, [STAINLESS_HELPER_METHOD_HEADER]: "stream" } }));
        return runner;
      }
      _run(executor) {
        executor().then(() => {
          this._emitFinal();
          this._emit("end");
        }, __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f"));
      }
      _addMessageParam(message) {
        this.messages.push(message);
      }
      _addMessage(message, emit = true) {
        this.receivedMessages.push(message);
        if (emit) {
          this._emit("message", message);
        }
      }
      async _createMessage(messages, params, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
          const { response, data: stream } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
          this._connected(response);
          for await (const event of stream) {
            __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      _connected(response) {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _BetaMessageStream_response, response, "f");
        __classPrivateFieldSet(this, _BetaMessageStream_request_id, response?.headers.get("request-id"), "f");
        __classPrivateFieldGet(this, _BetaMessageStream_resolveConnectedPromise, "f").call(this, response);
        this._emit("connect");
      }
      get ended() {
        return __classPrivateFieldGet(this, _BetaMessageStream_ended, "f");
      }
      get errored() {
        return __classPrivateFieldGet(this, _BetaMessageStream_errored, "f");
      }
      get aborted() {
        return __classPrivateFieldGet(this, _BetaMessageStream_aborted, "f");
      }
      abort() {
        this.controller.abort();
      }
      /**
       * Adds the listener function to the end of the listeners array for the event.
       * No checks are made to see if the listener has already been added. Multiple calls passing
       * the same combination of event and listener will result in the listener being added, and
       * called, multiple times.
       * @returns this MessageStream, so that calls can be chained
       */
      on(event, listener) {
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
        listeners.push({ listener });
        return this;
      }
      /**
       * Removes the specified listener from the listener array for the event.
       * off() will remove, at most, one instance of a listener from the listener array. If any single
       * listener has been added multiple times to the listener array for the specified event, then
       * off() must be called multiple times to remove each instance.
       * @returns this MessageStream, so that calls can be chained
       */
      off(event, listener) {
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
        if (!listeners)
          return this;
        const index = listeners.findIndex((l) => l.listener === listener);
        if (index >= 0)
          listeners.splice(index, 1);
        return this;
      }
      /**
       * Adds a one-time listener function for the event. The next time the event is triggered,
       * this listener is removed and then invoked.
       * @returns this MessageStream, so that calls can be chained
       */
      once(event, listener) {
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
        listeners.push({ listener, once: true });
        return this;
      }
      /**
       * This is similar to `.once()`, but returns a Promise that resolves the next time
       * the event is triggered, instead of calling a listener callback.
       * @returns a Promise that resolves the next time given event is triggered,
       * or rejects if an error is emitted.  (If you request the 'error' event,
       * returns a promise that resolves with the error).
       *
       * Example:
       *
       *   const message = await stream.emitted('message') // rejects if the stream errors
       */
      emitted(event) {
        return new Promise((resolve4, reject) => {
          __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
          if (event !== "error")
            this.once("error", reject);
          this.once(event, resolve4);
        });
      }
      async done() {
        __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
        await __classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f");
      }
      get currentMessage() {
        return __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
      }
      /**
       * @returns a promise that resolves with the the final assistant Message response,
       * or rejects if an error occurred or the stream ended prematurely without producing a Message.
       * If structured outputs were used, this will be a ParsedMessage with a `parsed` field.
       */
      async finalMessage() {
        await this.done();
        return __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this);
      }
      /**
       * @returns a promise that resolves with the the final assistant Message's text response, concatenated
       * together if there are more than one text blocks.
       * Rejects if an error occurred or the stream ended prematurely without producing a Message.
       */
      async finalText() {
        await this.done();
        return __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalText).call(this);
      }
      _emit(event, ...args) {
        if (__classPrivateFieldGet(this, _BetaMessageStream_ended, "f"))
          return;
        if (event === "end") {
          __classPrivateFieldSet(this, _BetaMessageStream_ended, true, "f");
          __classPrivateFieldGet(this, _BetaMessageStream_resolveEndPromise, "f").call(this);
        }
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
        if (listeners) {
          __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
          listeners.forEach(({ listener }) => listener(...args));
        }
        if (event === "abort") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
          return;
        }
        if (event === "error") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
        }
      }
      _emitFinal() {
        const finalMessage = this.receivedMessages.at(-1);
        if (finalMessage) {
          this._emit("finalMessage", __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this));
        }
      }
      async _fromReadableStream(readableStream, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
          this._connected(null);
          const stream = Stream.fromReadableStream(readableStream, this.controller);
          for await (const event of stream) {
            __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      [(_BetaMessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_params = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_listeners = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_ended = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_errored = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_aborted = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_response = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_request_id = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_logger = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_handleError = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_instances = /* @__PURE__ */ new WeakSet(), _BetaMessageStream_getFinalMessage = function _BetaMessageStream_getFinalMessage2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        return this.receivedMessages.at(-1);
      }, _BetaMessageStream_getFinalText = function _BetaMessageStream_getFinalText2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
        if (textBlocks.length === 0) {
          throw new AnthropicError("stream ended without producing a content block with type=text");
        }
        return textBlocks.join(" ");
      }, _BetaMessageStream_beginRequest = function _BetaMessageStream_beginRequest2() {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
      }, _BetaMessageStream_addStreamEvent = function _BetaMessageStream_addStreamEvent2(event) {
        if (this.ended)
          return;
        const messageSnapshot = __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_accumulateMessage).call(this, event);
        this._emit("streamEvent", event, messageSnapshot);
        switch (event.type) {
          case "content_block_delta": {
            const content = messageSnapshot.content.at(-1);
            switch (event.delta.type) {
              case "text_delta": {
                if (content.type === "text") {
                  this._emit("text", event.delta.text, content.text || "");
                }
                break;
              }
              case "citations_delta": {
                if (content.type === "text") {
                  this._emit("citation", event.delta.citation, content.citations ?? []);
                }
                break;
              }
              case "input_json_delta": {
                if (tracksToolInput(content) && __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f").inputJson?.length) {
                  let jsonSnapshot;
                  try {
                    jsonSnapshot = content.input;
                  } catch (err) {
                    __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f").call(this, __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_toolInputParseError).call(this, content, err));
                    break;
                  }
                  this._emit("inputJson", event.delta.partial_json, jsonSnapshot);
                }
                break;
              }
              case "thinking_delta": {
                if (content.type === "thinking") {
                  this._emit("thinking", event.delta.thinking, content.thinking);
                }
                break;
              }
              case "signature_delta": {
                if (content.type === "thinking") {
                  this._emit("signature", content.signature);
                }
                break;
              }
              case "compaction_delta": {
                if (content.type === "compaction" && content.content) {
                  this._emit("compaction", content.content);
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            break;
          }
          case "message_stop": {
            this._addMessageParam(messageSnapshot);
            this._addMessage(maybeParseBetaMessage(messageSnapshot, __classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _BetaMessageStream_logger, "f") }), true);
            break;
          }
          case "content_block_stop": {
            this._emit("contentBlock", messageSnapshot.content.at(-1));
            break;
          }
          case "message_start": {
            __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, messageSnapshot, "f");
            break;
          }
          case "content_block_start":
          case "message_delta":
            break;
        }
      }, _BetaMessageStream_endRequest = function _BetaMessageStream_endRequest2() {
        if (this.ended) {
          throw new AnthropicError(`stream has ended, this shouldn't happen`);
        }
        const snapshot = __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
        if (!snapshot) {
          throw new AnthropicError(`request ended without sending any chunks`);
        }
        __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
        return maybeParseBetaMessage(snapshot, __classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _BetaMessageStream_logger, "f") });
      }, _BetaMessageStream_accumulateMessage = function _BetaMessageStream_accumulateMessage2(event) {
        let snapshot = __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
        if (event.type === "message_start") {
          if (snapshot) {
            throw new AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
          }
          return event.message;
        }
        if (!snapshot) {
          throw new AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
        }
        switch (event.type) {
          case "message_stop":
            return snapshot;
          case "message_delta":
            snapshot.container = event.delta.container;
            snapshot.stop_reason = event.delta.stop_reason;
            snapshot.stop_sequence = event.delta.stop_sequence;
            if (event.delta.stop_details != null) {
              snapshot.stop_details = event.delta.stop_details;
            }
            snapshot.usage.output_tokens = event.usage.output_tokens;
            snapshot.context_management = event.context_management;
            if (event.usage.input_tokens != null) {
              snapshot.usage.input_tokens = event.usage.input_tokens;
            }
            if (event.usage.cache_creation_input_tokens != null) {
              snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
            }
            if (event.usage.cache_read_input_tokens != null) {
              snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
            }
            if (event.usage.server_tool_use != null) {
              snapshot.usage.server_tool_use = event.usage.server_tool_use;
            }
            if (event.usage.iterations != null) {
              snapshot.usage.iterations = event.usage.iterations;
            }
            return snapshot;
          case "content_block_start":
            snapshot.content.push(event.content_block);
            if (event.content_block.type === "fallback") {
              snapshot.model = event.content_block.to.model;
            }
            return snapshot;
          case "content_block_delta": {
            const snapshotContent = snapshot.content.at(event.index);
            switch (event.delta.type) {
              case "text_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    text: (snapshotContent.text || "") + event.delta.text
                  };
                }
                break;
              }
              case "citations_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    citations: [...snapshotContent.citations ?? [], event.delta.citation]
                  };
                }
                break;
              }
              case "input_json_delta": {
                if (snapshotContent && tracksToolInput(snapshotContent)) {
                  const jsonBuf = (snapshotContent[JSON_BUF_PROPERTY] || "") + event.delta.partial_json;
                  snapshot.content[event.index] = withLazyInput(snapshotContent, jsonBuf);
                }
                break;
              }
              case "thinking_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    thinking: snapshotContent.thinking + event.delta.thinking
                  };
                }
                break;
              }
              case "signature_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    signature: event.delta.signature
                  };
                }
                break;
              }
              case "compaction_delta": {
                if (snapshotContent?.type === "compaction") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    content: (snapshotContent.content || "") + event.delta.content,
                    encrypted_content: event.delta.encrypted_content
                  };
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            return snapshot;
          }
          case "content_block_stop": {
            const snapshotContent = snapshot.content.at(event.index);
            if (snapshotContent && tracksToolInput(snapshotContent) && JSON_BUF_PROPERTY in snapshotContent) {
              let input;
              try {
                input = snapshotContent.input;
              } catch (err) {
                input = {};
                __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f").call(this, __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_toolInputParseError).call(this, snapshotContent, err));
              }
              Object.defineProperty(snapshotContent, "input", {
                value: input,
                enumerable: true,
                configurable: true,
                writable: true
              });
            }
            return snapshot;
          }
        }
      }, _BetaMessageStream_toolInputParseError = function _BetaMessageStream_toolInputParseError2(block, err) {
        const jsonBuf = block[JSON_BUF_PROPERTY];
        return new AnthropicError(`Unable to parse tool parameter JSON from model. Please retry your request or adjust your prompt. Error: ${err}. JSON: ${jsonBuf}`);
      }, Symbol.asyncIterator)]() {
        const pushQueue = [];
        const readQueue = [];
        let done = false;
        this.on("streamEvent", (event) => {
          const reader = readQueue.shift();
          if (reader) {
            reader.resolve(event);
          } else {
            pushQueue.push(event);
          }
        });
        this.on("end", () => {
          done = true;
          for (const reader of readQueue) {
            reader.resolve(void 0);
          }
          readQueue.length = 0;
        });
        this.on("abort", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        this.on("error", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        return {
          next: async () => {
            if (!pushQueue.length) {
              if (done) {
                return { value: void 0, done: true };
              }
              return new Promise((resolve4, reject) => readQueue.push({ resolve: resolve4, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
            }
            const chunk = pushQueue.shift();
            return { value: chunk, done: false };
          },
          return: async () => {
            this.abort();
            return { value: void 0, done: true };
          }
        };
      }
      toReadableStream() {
        const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
        return stream.toReadableStream();
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/CompactionControl.mjs
var DEFAULT_TOKEN_THRESHOLD, DEFAULT_SUMMARY_PROMPT;
var init_CompactionControl = __esm({
  "node_modules/@anthropic-ai/sdk/lib/tools/CompactionControl.mjs"() {
    DEFAULT_TOKEN_THRESHOLD = 1e5;
    DEFAULT_SUMMARY_PROMPT = `You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:
1. Task Overview
The user's core request and success criteria
Any clarifications or constraints they specified
2. Current State
What has been completed so far
Files created, modified, or analyzed (with paths if relevant)
Key outputs or artifacts produced
3. Important Discoveries
Technical constraints or requirements uncovered
Decisions made and their rationale
Errors encountered and how they were resolved
What approaches were tried that didn't work (and why)
4. Next Steps
Specific actions needed to complete the task
Any blockers or open questions to resolve
Priority order if multiple steps remain
5. Context to Preserve
User preferences or style requirements
Domain-specific details that aren't obvious
Any promises made to the user
Be concise but complete\u2014err on the side of including information that would prevent duplicate work or repeated mistakes. Write in a way that enables immediate resumption of the task.
Wrap your summary in <summary></summary> tags.`;
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/BetaToolRunner.mjs
async function generateToolResponse(params, lastMessage = params.messages.at(-1), requestOptions) {
  if (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content || typeof lastMessage.content === "string") {
    return null;
  }
  const toolUseBlocks = lastMessage.content.filter((content) => content.type === "tool_use");
  if (toolUseBlocks.length === 0) {
    return null;
  }
  const toolResults = await Promise.all(toolUseBlocks.map(async (toolUse) => {
    const tool = params.tools.find((t) => ("name" in t ? t.name : t.mcp_server_name) === toolUse.name);
    if (!tool || !("run" in tool)) {
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: `Error: Tool '${toolUse.name}' not found`,
        is_error: true
      };
    }
    try {
      let input = toolUse.input;
      if ("parse" in tool && tool.parse) {
        input = tool.parse(input);
      }
      const result = await tool.run(input, {
        toolUse,
        toolUseBlock: toolUse,
        signal: requestOptions?.signal
      });
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result
      };
    } catch (error) {
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: error instanceof ToolError ? error.content : `Error: ${error instanceof Error ? error.message : String(error)}`,
        is_error: true
      };
    }
  }));
  return {
    role: "user",
    content: toolResults
  };
}
var _BetaToolRunner_instances, _BetaToolRunner_consumed, _BetaToolRunner_mutated, _BetaToolRunner_state, _BetaToolRunner_options, _BetaToolRunner_message, _BetaToolRunner_toolResponse, _BetaToolRunner_completion, _BetaToolRunner_iterationCount, _BetaToolRunner_checkAndCompact, _BetaToolRunner_generateToolResponse, BetaToolRunner;
var init_BetaToolRunner = __esm({
  "node_modules/@anthropic-ai/sdk/lib/tools/BetaToolRunner.mjs"() {
    init_tslib();
    init_ToolError();
    init_error();
    init_headers();
    init_promise();
    init_CompactionControl();
    init_stainless_helper_header();
    BetaToolRunner = class {
      constructor(client, params, options) {
        _BetaToolRunner_instances.add(this);
        this.client = client;
        _BetaToolRunner_consumed.set(this, false);
        _BetaToolRunner_mutated.set(this, false);
        _BetaToolRunner_state.set(this, void 0);
        _BetaToolRunner_options.set(this, void 0);
        _BetaToolRunner_message.set(this, void 0);
        _BetaToolRunner_toolResponse.set(this, void 0);
        _BetaToolRunner_completion.set(this, void 0);
        _BetaToolRunner_iterationCount.set(this, 0);
        __classPrivateFieldSet(this, _BetaToolRunner_state, {
          params: {
            // You can't clone the entire params since there are functions as handlers.
            // You also don't really need to clone params.messages, but it probably will prevent a foot gun
            // somewhere.
            ...params,
            messages: structuredClone(params.messages)
          }
        }, "f");
        const collected = collectStainlessHelpers(params.tools, params.messages);
        __classPrivateFieldSet(this, _BetaToolRunner_options, {
          ...options,
          headers: buildHeaders([
            helperHeader("BetaToolRunner"),
            collected.length ? { [STAINLESS_HELPER_HEADER]: collected.join(", ") } : void 0,
            options?.headers
          ])
        }, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
        if (params.compactionControl?.enabled) {
          console.warn('Anthropic: The `compactionControl` parameter is deprecated and will be removed in a future version. Use server-side compaction instead by passing `edits: [{ type: "compact_20260112" }]` in the params passed to `toolRunner()`. See https://platform.claude.com/docs/en/build-with-claude/compaction');
        }
      }
      async *[(_BetaToolRunner_consumed = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_mutated = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_state = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_options = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_message = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_toolResponse = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_completion = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_iterationCount = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_instances = /* @__PURE__ */ new WeakSet(), _BetaToolRunner_checkAndCompact = async function _BetaToolRunner_checkAndCompact2() {
        const compactionControl = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.compactionControl;
        if (!compactionControl || !compactionControl.enabled) {
          return false;
        }
        let tokensUsed = 0;
        if (__classPrivateFieldGet(this, _BetaToolRunner_message, "f") !== void 0) {
          try {
            const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
            const totalInputTokens = message.usage.input_tokens + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0);
            tokensUsed = totalInputTokens + message.usage.output_tokens;
          } catch {
            return false;
          }
        }
        const threshold = compactionControl.contextTokenThreshold ?? DEFAULT_TOKEN_THRESHOLD;
        if (tokensUsed < threshold) {
          return false;
        }
        const model = compactionControl.model ?? __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.model;
        const summaryPrompt = compactionControl.summaryPrompt ?? DEFAULT_SUMMARY_PROMPT;
        const messages = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages;
        if (messages[messages.length - 1].role === "assistant") {
          const lastMessage = messages[messages.length - 1];
          if (Array.isArray(lastMessage.content)) {
            const nonToolBlocks = lastMessage.content.filter((block) => block.type !== "tool_use");
            if (nonToolBlocks.length === 0) {
              messages.pop();
            } else {
              lastMessage.content = nonToolBlocks;
            }
          }
        }
        const response = await this.client.beta.messages.create({
          model,
          messages: [
            ...messages,
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: summaryPrompt
                }
              ]
            }
          ],
          max_tokens: __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_tokens
        }, {
          signal: __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal,
          headers: buildHeaders([__classPrivateFieldGet(this, _BetaToolRunner_options, "f").headers, helperHeader("compaction")])
        });
        if (response.content[0]?.type !== "text") {
          throw new AnthropicError("Expected text response for compaction");
        }
        __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages = [
          {
            role: "user",
            content: response.content
          }
        ];
        return true;
      }, Symbol.asyncIterator)]() {
        var _a2;
        if (__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
          throw new AnthropicError("Cannot iterate over a consumed stream");
        }
        __classPrivateFieldSet(this, _BetaToolRunner_consumed, true, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
        try {
          while (true) {
            let stream;
            try {
              if (__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations && __classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f") >= __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations) {
                break;
              }
              __classPrivateFieldSet(this, _BetaToolRunner_mutated, false, "f");
              __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
              __classPrivateFieldSet(this, _BetaToolRunner_iterationCount, (_a2 = __classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f"), _a2++, _a2), "f");
              __classPrivateFieldSet(this, _BetaToolRunner_message, void 0, "f");
              const { max_iterations, compactionControl, ...params } = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
              if (params.stream) {
                stream = this.client.beta.messages.stream({ ...params }, __classPrivateFieldGet(this, _BetaToolRunner_options, "f"));
                __classPrivateFieldSet(this, _BetaToolRunner_message, stream.finalMessage(), "f");
                __classPrivateFieldGet(this, _BetaToolRunner_message, "f").catch(() => {
                });
                yield stream;
              } else {
                __classPrivateFieldSet(this, _BetaToolRunner_message, this.client.beta.messages.create({ ...params, stream: false }, __classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
                yield __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
              }
              const isCompacted = await __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_checkAndCompact).call(this);
              if (!isCompacted) {
                if (!__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                  const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
                  __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push({ role: message.role, content: message.content });
                  if (message.stop_reason === "refusal") {
                    break;
                  }
                }
                const toolMessage = await __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.at(-1));
                if (toolMessage) {
                  __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push(toolMessage);
                } else if (!__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                  break;
                }
              }
            } finally {
              if (stream) {
                stream.abort();
              }
            }
          }
          if (!__classPrivateFieldGet(this, _BetaToolRunner_message, "f")) {
            throw new AnthropicError("ToolRunner concluded without a message from the server");
          }
          __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").resolve(await __classPrivateFieldGet(this, _BetaToolRunner_message, "f"));
        } catch (error) {
          __classPrivateFieldSet(this, _BetaToolRunner_consumed, false, "f");
          __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise.catch(() => {
          });
          __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").reject(error);
          __classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
          throw error;
        }
      }
      setMessagesParams(paramsOrMutator) {
        if (typeof paramsOrMutator === "function") {
          __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator(__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params);
        } else {
          __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator;
        }
        __classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
      }
      setRequestOptions(optionsOrMutator) {
        if (typeof optionsOrMutator === "function") {
          __classPrivateFieldSet(this, _BetaToolRunner_options, optionsOrMutator(__classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
        } else {
          __classPrivateFieldSet(this, _BetaToolRunner_options, { ...__classPrivateFieldGet(this, _BetaToolRunner_options, "f"), ...optionsOrMutator }, "f");
        }
      }
      /**
       * Get the tool response for the last message from the assistant.
       * Avoids redundant tool executions by caching results.
       *
       * @returns A promise that resolves to a BetaMessageParam containing tool results, or null if no tools need to be executed
       *
       * @example
       * const toolResponse = await runner.generateToolResponse();
       * if (toolResponse) {
       *   console.log('Tool results:', toolResponse.content);
       * }
       */
      async generateToolResponse(signal = __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
        const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f") ?? this.params.messages.at(-1);
        if (!message) {
          return null;
        }
        return __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, message, signal);
      }
      /**
       * Wait for the async iterator to complete. This works even if the async iterator hasn't yet started, and
       * will wait for an instance to start and go to completion.
       *
       * @returns A promise that resolves to the final BetaMessage when the iterator completes
       *
       * @example
       * // Start consuming the iterator
       * for await (const message of runner) {
       *   console.log('Message:', message.content);
       * }
       *
       * // Meanwhile, wait for completion from another part of the code
       * const finalMessage = await runner.done();
       * console.log('Final response:', finalMessage.content);
       */
      done() {
        return __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise;
      }
      /**
       * Returns a promise indicating that the stream is done. Unlike .done(), this will eagerly read the stream:
       * * If the iterator has not been consumed, consume the entire iterator and return the final message from the
       * assistant.
       * * If the iterator has been consumed, waits for it to complete and returns the final message.
       *
       * @returns A promise that resolves to the final BetaMessage from the conversation
       * @throws {AnthropicError} If no messages were processed during the conversation
       *
       * @example
       * const finalMessage = await runner.runUntilDone();
       * console.log('Final response:', finalMessage.content);
       */
      async runUntilDone() {
        if (!__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
          for await (const _ of this) {
          }
        }
        return this.done();
      }
      /**
       * Get the current parameters being used by the ToolRunner.
       *
       * @returns A readonly view of the current ToolRunnerParams
       *
       * @example
       * const currentParams = runner.params;
       * console.log('Current model:', currentParams.model);
       * console.log('Message count:', currentParams.messages.length);
       */
      get params() {
        return __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
      }
      /**
       * Add one or more messages to the conversation history.
       *
       * @param messages - One or more BetaMessageParam objects to add to the conversation
       *
       * @example
       * runner.pushMessages(
       *   { role: 'user', content: 'Also, what about the weather in NYC?' }
       * );
       *
       * @example
       * // Adding multiple messages
       * runner.pushMessages(
       *   { role: 'user', content: 'What about NYC?' },
       *   { role: 'user', content: 'And Boston?' }
       * );
       */
      pushMessages(...messages) {
        this.setMessagesParams((params) => ({
          ...params,
          messages: [...params.messages, ...messages]
        }));
      }
      /**
       * Makes the ToolRunner directly awaitable, equivalent to calling .runUntilDone()
       * This allows using `await runner` instead of `await runner.runUntilDone()`
       */
      then(onfulfilled, onrejected) {
        return this.runUntilDone().then(onfulfilled, onrejected);
      }
    };
    _BetaToolRunner_generateToolResponse = async function _BetaToolRunner_generateToolResponse2(lastMessage, signal = __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
      if (__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f") !== void 0) {
        return __classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
      }
      __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, generateToolResponse(__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params, lastMessage, {
        ...__classPrivateFieldGet(this, _BetaToolRunner_options, "f"),
        signal
      }), "f");
      return __classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.mjs
function transformOutputFormat(params) {
  if (!params.output_format) {
    return params;
  }
  if (params.output_config?.format) {
    throw new AnthropicError("Both output_format and output_config.format were provided. Please use only output_config.format (output_format is deprecated).");
  }
  const { output_format, ...rest } = params;
  return {
    ...rest,
    output_config: {
      ...params.output_config,
      format: output_format
    }
  };
}
var DEPRECATED_MODELS, MODELS_TO_WARN_WITH_THINKING_ENABLED, Messages;
var init_messages = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.mjs"() {
    init_error2();
    init_batches();
    init_resource();
    init_constants();
    init_headers();
    init_stainless_helper_header();
    init_beta_parser();
    init_BetaMessageStream();
    init_BetaToolRunner();
    init_ToolError();
    init_batches();
    init_BetaToolRunner();
    init_ToolError();
    DEPRECATED_MODELS = {
      "claude-1.3": "November 6th, 2024",
      "claude-1.3-100k": "November 6th, 2024",
      "claude-instant-1.1": "November 6th, 2024",
      "claude-instant-1.1-100k": "November 6th, 2024",
      "claude-instant-1.2": "November 6th, 2024",
      "claude-3-sonnet-20240229": "July 21st, 2025",
      "claude-3-opus-20240229": "January 5th, 2026",
      "claude-2.1": "July 21st, 2025",
      "claude-2.0": "July 21st, 2025",
      "claude-3-7-sonnet-latest": "February 19th, 2026",
      "claude-3-7-sonnet-20250219": "February 19th, 2026",
      "claude-3-5-haiku-latest": "February 19th, 2026",
      "claude-3-5-haiku-20241022": "February 19th, 2026",
      "claude-opus-4-0": "June 15th, 2026",
      "claude-opus-4-20250514": "June 15th, 2026",
      "claude-sonnet-4-0": "June 15th, 2026",
      "claude-sonnet-4-20250514": "June 15th, 2026",
      "claude-opus-4-1": "August 5th, 2026",
      "claude-opus-4-1-20250805": "August 5th, 2026",
      "claude-mythos-preview": "June 30th, 2026"
    };
    MODELS_TO_WARN_WITH_THINKING_ENABLED = ["claude-mythos-preview", "claude-opus-4-6"];
    Messages = class extends APIResource {
      constructor() {
        super(...arguments);
        this.batches = new Batches(this._client);
      }
      create(params, options) {
        const modifiedParams = transformOutputFormat(params);
        const { betas, user_profile_id, ...body } = modifiedParams;
        if (body.model in DEPRECATED_MODELS) {
          console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
        }
        if (MODELS_TO_WARN_WITH_THINKING_ENABLED.includes(body.model) && body.thinking && body.thinking.type === "enabled") {
          console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
        }
        let timeout = this._client._options.timeout;
        if (!body.stream && timeout == null) {
          const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
          timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        const helperHeader2 = stainlessHelperHeader(body.tools, body.messages);
        return this._client.post("/v1/messages?beta=true", {
          body,
          timeout: timeout ?? 6e5,
          ...options,
          headers: buildHeaders([
            {
              ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0,
              ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0
            },
            helperHeader2,
            options?.headers
          ]),
          stream: modifiedParams.stream ?? false
        });
      }
      /**
       * Send a structured list of input messages with text and/or image content, along with an expected `output_format` and
       * the response will be automatically parsed and available in the `parsed_output` property of the message.
       *
       * @example
       * ```ts
       * const message = await client.beta.messages.parse({
       *   model: 'claude-3-5-sonnet-20241022',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_format: zodOutputFormat(z.object({ answer: z.number() }), 'math'),
       * });
       *
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      parse(params, options) {
        options = {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...params.betas ?? [], "structured-outputs-2025-12-15"].toString() },
            options?.headers
          ])
        };
        return this.create(params, options).then((message) => parseBetaMessage(message, params, { logger: this._client.logger ?? console }));
      }
      /**
       * Create a Message stream
       */
      stream(body, options) {
        return BetaMessageStream.createMessage(this, body, options);
      }
      /**
       * Count the number of tokens in a Message.
       *
       * The Token Count API can be used to count the number of tokens in a Message,
       * including tools, images, and documents, without creating it.
       *
       * Learn more about token counting in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)
       *
       * @example
       * ```ts
       * const betaMessageTokensCount =
       *   await client.beta.messages.countTokens({
       *     messages: [{ content: 'Hello, world', role: 'user' }],
       *     model: 'claude-opus-4-6',
       *   });
       * ```
       */
      countTokens(params, options) {
        const modifiedParams = transformOutputFormat(params);
        const { betas, ...body } = modifiedParams;
        return this._client.post("/v1/messages/count_tokens?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "token-counting-2024-11-01"].toString() },
            options?.headers
          ])
        });
      }
      toolRunner(body, options) {
        return new BetaToolRunner(this._client, body, options);
      }
    };
    Messages.Batches = Batches;
    Messages.BetaToolRunner = BetaToolRunner;
    Messages.ToolError = ToolError;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/sessions/events.mjs
var Events;
var init_events = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/sessions/events.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    init_SessionToolRunner();
    init_SessionToolRunner();
    Events = class extends APIResource {
      /**
       * List Events
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionEvent of client.beta.sessions.events.list(
       *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/sessions/${sessionID}/events?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Send Events
       *
       * @example
       * ```ts
       * const betaManagedAgentsSendSessionEvents =
       *   await client.beta.sessions.events.send(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *     {
       *       events: [
       *         {
       *           content: [
       *             {
       *               text: 'Where is my order #1234?',
       *               type: 'text',
       *             },
       *           ],
       *           type: 'user.message',
       *         },
       *       ],
       *     },
       *   );
       * ```
       */
      send(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/sessions/${sessionID}/events?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Stream Events
       *
       * @example
       * ```ts
       * const betaManagedAgentsStreamSessionEvents =
       *   await client.beta.sessions.events.stream(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      stream(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/sessions/${sessionID}/events/stream?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ]),
          stream: true
        });
      }
      /**
       * Attach to a session and dispatch every incoming `agent.tool_use` and
       * `agent.custom_tool_use` event to a local tool registry, sending the matching
       * result back (`user.tool_result` / `user.custom_tool_result`). The
       * sessions-side counterpart to `client.beta.messages.toolRunner`: yields one
       * entry per completed tool call so callers can observe each dispatch (and
       * `break` to abort cleanly).
       *
       * @example
       * ```ts
       * import { betaAgentToolset20260401 } from '@anthropic-ai/sdk/tools/agent-toolset/node';
       *
       * for await (const call of client.beta.sessions.events.toolRunner(work.data.id, {
       *   tools: [...betaAgentToolset20260401({ workdir }), myTool],
       * })) {
       *   console.log(`${call.name} -> ${call.isError ? 'error' : 'ok'}`);
       * }
       * ```
       */
      toolRunner(sessionID, opts) {
        return new SessionToolRunner(sessionID, { ...opts, client: this._client });
      }
    };
    Events.SessionToolRunner = SessionToolRunner;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/sessions/resources.mjs
var Resources;
var init_resources = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/sessions/resources.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Resources = class extends APIResource {
      /**
       * Get Session Resource
       *
       * @example
       * ```ts
       * const resource =
       *   await client.beta.sessions.resources.retrieve(
       *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      retrieve(resourceID, params, options) {
        const { session_id, betas } = params;
        return this._client.get(path`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Session Resource
       *
       * @example
       * ```ts
       * const resource =
       *   await client.beta.sessions.resources.update(
       *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
       *     {
       *       session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *       authorization_token: 'ghp_exampletoken',
       *     },
       *   );
       * ```
       */
      update(resourceID, params, options) {
        const { session_id, betas, ...body } = params;
        return this._client.post(path`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Session Resources
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionResource of client.beta.sessions.resources.list(
       *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/sessions/${sessionID}/resources?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Session Resource
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeleteSessionResource =
       *   await client.beta.sessions.resources.delete(
       *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      delete(resourceID, params, options) {
        const { session_id, betas } = params;
        return this._client.delete(path`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Add Session Resource
       *
       * @example
       * ```ts
       * const betaManagedAgentsFileResource =
       *   await client.beta.sessions.resources.add(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *     {
       *       file_id: 'file_011CNha8iCJcU1wXNR6q4V8w',
       *       type: 'file',
       *     },
       *   );
       * ```
       */
      add(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/sessions/${sessionID}/resources?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/events.mjs
var Events2;
var init_events2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/events.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Events2 = class extends APIResource {
      /**
       * List Session Thread Events
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionEvent of client.beta.sessions.threads.events.list(
       *   'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *   { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       * )) {
       *   // ...
       * }
       * ```
       */
      list(threadID, params, options) {
        const { session_id, betas, ...query } = params;
        return this._client.getAPIList(path`/v1/sessions/${session_id}/threads/${threadID}/events?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Stream Session Thread Events
       *
       * @example
       * ```ts
       * const betaManagedAgentsStreamSessionThreadEvents =
       *   await client.beta.sessions.threads.events.stream(
       *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      stream(threadID, params, options) {
        const { session_id, betas } = params;
        return this._client.get(path`/v1/sessions/${session_id}/threads/${threadID}/stream?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ]),
          stream: true
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/threads.mjs
var Threads;
var init_threads = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/threads.mjs"() {
    init_resource();
    init_events2();
    init_events2();
    init_pagination();
    init_headers();
    init_path();
    Threads = class extends APIResource {
      constructor() {
        super(...arguments);
        this.events = new Events2(this._client);
      }
      /**
       * Get Session Thread
       *
       * @example
       * ```ts
       * const betaManagedAgentsSessionThread =
       *   await client.beta.sessions.threads.retrieve(
       *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      retrieve(threadID, params, options) {
        const { session_id, betas } = params;
        return this._client.get(path`/v1/sessions/${session_id}/threads/${threadID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Session Threads
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionThread of client.beta.sessions.threads.list(
       *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/sessions/${sessionID}/threads?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Session Thread
       *
       * @example
       * ```ts
       * const betaManagedAgentsSessionThread =
       *   await client.beta.sessions.threads.archive(
       *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      archive(threadID, params, options) {
        const { session_id, betas } = params;
        return this._client.post(path`/v1/sessions/${session_id}/threads/${threadID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Threads.Events = Events2;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/sessions/sessions.mjs
var Sessions;
var init_sessions = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/sessions/sessions.mjs"() {
    init_resource();
    init_events();
    init_events();
    init_resources();
    init_resources();
    init_threads();
    init_threads();
    init_pagination();
    init_headers();
    init_path();
    Sessions = class extends APIResource {
      constructor() {
        super(...arguments);
        this.events = new Events(this._client);
        this.resources = new Resources(this._client);
        this.threads = new Threads(this._client);
      }
      /**
       * Create Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.create({
       *     agent: 'agent_011CZkYpogX7uDKUyvBTophP',
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/sessions?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.retrieve(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      retrieve(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/sessions/${sessionID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.update(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      update(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/sessions/${sessionID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Sessions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSession of client.beta.sessions.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/sessions?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedSession =
       *   await client.beta.sessions.delete(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      delete(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path`/v1/sessions/${sessionID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.archive(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      archive(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/sessions/${sessionID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Sessions.Events = Events;
    Sessions.Resources = Resources;
    Sessions.Threads = Threads;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/skills/versions.mjs
var Versions2;
var init_versions2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/skills/versions.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_uploads();
    init_path();
    Versions2 = class extends APIResource {
      /**
       * Create Skill Version
       *
       * @example
       * ```ts
       * const version = await client.beta.skills.versions.create(
       *   'skill_id',
       * );
       * ```
       */
      create(skillID, params = {}, options) {
        const { betas, ...body } = params ?? {};
        return this._client.post(path`/v1/skills/${skillID}/versions?beta=true`, multipartFormRequestOptions({
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        }, this._client, false));
      }
      /**
       * Get Skill Version
       *
       * @example
       * ```ts
       * const version = await client.beta.skills.versions.retrieve(
       *   'version',
       *   { skill_id: 'skill_id' },
       * );
       * ```
       */
      retrieve(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.get(path`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Skill Versions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const versionListResponse of client.beta.skills.versions.list(
       *   'skill_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(skillID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/skills/${skillID}/versions?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Skill Version
       *
       * @example
       * ```ts
       * const version = await client.beta.skills.versions.delete(
       *   'version',
       *   { skill_id: 'skill_id' },
       * );
       * ```
       */
      delete(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.delete(path`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Download a skill version's content as a zip archive.
       *
       * @example
       * ```ts
       * const response = await client.beta.skills.versions.download(
       *   'version',
       *   { skill_id: 'skill_id' },
       * );
       *
       * const content = await response.blob();
       * console.log(content);
       * ```
       */
      download(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.get(path`/v1/skills/${skill_id}/versions/${version}/content?beta=true`, {
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString(),
              Accept: "application/binary"
            },
            options?.headers
          ]),
          __binaryResponse: true
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/skills/skills.mjs
var Skills;
var init_skills2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/skills/skills.mjs"() {
    init_resource();
    init_versions2();
    init_versions2();
    init_pagination();
    init_headers();
    init_uploads();
    init_path();
    Skills = class extends APIResource {
      constructor() {
        super(...arguments);
        this.versions = new Versions2(this._client);
      }
      /**
       * Create Skill
       *
       * @example
       * ```ts
       * const skill = await client.beta.skills.create();
       * ```
       */
      create(params = {}, options) {
        const { betas, ...body } = params ?? {};
        return this._client.post("/v1/skills?beta=true", multipartFormRequestOptions({
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        }, this._client, false));
      }
      /**
       * Get Skill
       *
       * @example
       * ```ts
       * const skill = await client.beta.skills.retrieve('skill_id');
       * ```
       */
      retrieve(skillID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/skills/${skillID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Skills
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const skillListResponse of client.beta.skills.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/skills?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Skill
       *
       * @example
       * ```ts
       * const skill = await client.beta.skills.delete('skill_id');
       * ```
       */
      delete(skillID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path`/v1/skills/${skillID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
    };
    Skills.Versions = Versions2;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/vaults/credentials.mjs
var Credentials;
var init_credentials2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/vaults/credentials.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Credentials = class extends APIResource {
      /**
       * Create Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.create(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *     {
       *       auth: {
       *         token: 'bearer_exampletoken',
       *         mcp_server_url:
       *           'https://example-server.modelcontextprotocol.io/sse',
       *         type: 'static_bearer',
       *       },
       *     },
       *   );
       * ```
       */
      create(vaultID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/vaults/${vaultID}/credentials?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.retrieve(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      retrieve(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.get(path`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.update(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      update(credentialID, params, options) {
        const { vault_id, betas, ...body } = params;
        return this._client.post(path`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Credentials
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsCredential of client.beta.vaults.credentials.list(
       *   'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(vaultID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path`/v1/vaults/${vaultID}/credentials?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedCredential =
       *   await client.beta.vaults.credentials.delete(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      delete(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.delete(path`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.archive(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      archive(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.post(path`/v1/vaults/${vault_id}/credentials/${credentialID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Validate Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredentialValidation =
       *   await client.beta.vaults.credentials.mcpOAuthValidate(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      mcpOAuthValidate(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.post(path`/v1/vaults/${vault_id}/credentials/${credentialID}/mcp_oauth_validate?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/vaults/vaults.mjs
var Vaults;
var init_vaults = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/vaults/vaults.mjs"() {
    init_resource();
    init_credentials2();
    init_credentials2();
    init_pagination();
    init_headers();
    init_path();
    Vaults = class extends APIResource {
      constructor() {
        super(...arguments);
        this.credentials = new Credentials(this._client);
      }
      /**
       * Create Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.create({
       *     display_name: 'Example vault',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/vaults?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.retrieve(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      retrieve(vaultID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/vaults/${vaultID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.update(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      update(vaultID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path`/v1/vaults/${vaultID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Vaults
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsVault of client.beta.vaults.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/vaults?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedVault =
       *   await client.beta.vaults.delete(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      delete(vaultID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path`/v1/vaults/${vaultID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.archive(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      archive(vaultID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path`/v1/vaults/${vaultID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Vaults.Credentials = Credentials;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/beta.mjs
var Beta;
var init_beta = __esm({
  "node_modules/@anthropic-ai/sdk/resources/beta/beta.mjs"() {
    init_resource();
    init_deployment_runs();
    init_deployment_runs();
    init_deployments();
    init_deployments();
    init_files();
    init_files();
    init_models();
    init_models();
    init_user_profiles();
    init_user_profiles();
    init_webhooks();
    init_webhooks();
    init_agents();
    init_agents();
    init_environments();
    init_environments();
    init_memory_stores();
    init_memory_stores();
    init_messages();
    init_messages();
    init_sessions();
    init_sessions();
    init_skills2();
    init_skills2();
    init_vaults();
    init_vaults();
    Beta = class extends APIResource {
      constructor() {
        super(...arguments);
        this.models = new Models(this._client);
        this.messages = new Messages(this._client);
        this.agents = new Agents(this._client);
        this.environments = new Environments(this._client);
        this.sessions = new Sessions(this._client);
        this.deployments = new Deployments(this._client);
        this.deploymentRuns = new DeploymentRuns(this._client);
        this.vaults = new Vaults(this._client);
        this.memoryStores = new MemoryStores(this._client);
        this.files = new Files(this._client);
        this.skills = new Skills(this._client);
        this.webhooks = new Webhooks(this._client);
        this.userProfiles = new UserProfiles(this._client);
      }
    };
    Beta.Models = Models;
    Beta.Messages = Messages;
    Beta.Agents = Agents;
    Beta.Environments = Environments;
    Beta.Sessions = Sessions;
    Beta.Deployments = Deployments;
    Beta.DeploymentRuns = DeploymentRuns;
    Beta.Vaults = Vaults;
    Beta.MemoryStores = MemoryStores;
    Beta.Files = Files;
    Beta.Skills = Skills;
    Beta.Webhooks = Webhooks;
    Beta.UserProfiles = UserProfiles;
  }
});

// node_modules/@anthropic-ai/sdk/resources/completions.mjs
var Completions;
var init_completions = __esm({
  "node_modules/@anthropic-ai/sdk/resources/completions.mjs"() {
    init_resource();
    init_headers();
    Completions = class extends APIResource {
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/complete", {
          body,
          timeout: this._client._options.timeout ?? 6e5,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ]),
          stream: params.stream ?? false
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/lib/parser.mjs
function getOutputFormat2(params) {
  return params?.output_config?.format;
}
function maybeParseMessage(message, params, opts) {
  const outputFormat = getOutputFormat2(params);
  if (!params || !("parse" in (outputFormat ?? {}))) {
    return {
      ...message,
      content: message.content.map((block) => {
        if (block.type === "text") {
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: null,
            enumerable: false
          });
          return parsedBlock;
        }
        return block;
      }),
      parsed_output: null
    };
  }
  return parseMessage(message, params, opts);
}
function parseMessage(message, params, opts) {
  let firstParsedOutput = null;
  const content = message.content.map((block) => {
    if (block.type === "text") {
      const parsedOutput = parseOutputFormat(params, block.text);
      if (firstParsedOutput === null) {
        firstParsedOutput = parsedOutput;
      }
      const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
        value: parsedOutput,
        enumerable: false
      });
      return parsedBlock;
    }
    return block;
  });
  return {
    ...message,
    content,
    parsed_output: firstParsedOutput
  };
}
function parseOutputFormat(params, content) {
  const outputFormat = getOutputFormat2(params);
  if (outputFormat?.type !== "json_schema") {
    return null;
  }
  try {
    if ("parse" in outputFormat) {
      return outputFormat.parse(content);
    }
    return JSON.parse(content);
  } catch (error) {
    throw new AnthropicError(`Failed to parse structured output: ${error}`);
  }
}
var init_parser2 = __esm({
  "node_modules/@anthropic-ai/sdk/lib/parser.mjs"() {
    init_error();
  }
});

// node_modules/@anthropic-ai/sdk/lib/MessageStream.mjs
function tracksToolInput2(content) {
  return content.type === "tool_use" || content.type === "server_tool_use";
}
function checkNever2(x) {
}
var _MessageStream_instances, _MessageStream_currentMessageSnapshot, _MessageStream_params, _MessageStream_connectedPromise, _MessageStream_resolveConnectedPromise, _MessageStream_rejectConnectedPromise, _MessageStream_endPromise, _MessageStream_resolveEndPromise, _MessageStream_rejectEndPromise, _MessageStream_listeners, _MessageStream_ended, _MessageStream_errored, _MessageStream_aborted, _MessageStream_catchingPromiseCreated, _MessageStream_response, _MessageStream_request_id, _MessageStream_logger, _MessageStream_getFinalMessage, _MessageStream_getFinalText, _MessageStream_handleError, _MessageStream_beginRequest, _MessageStream_addStreamEvent, _MessageStream_endRequest, _MessageStream_accumulateMessage, MessageStream;
var init_MessageStream = __esm({
  "node_modules/@anthropic-ai/sdk/lib/MessageStream.mjs"() {
    init_tslib();
    init_stainless_helper_header();
    init_errors();
    init_error2();
    init_streaming2();
    init_parser2();
    init_message_stream_utils();
    MessageStream = class _MessageStream {
      constructor(params, opts) {
        _MessageStream_instances.add(this);
        this.messages = [];
        this.receivedMessages = [];
        _MessageStream_currentMessageSnapshot.set(this, void 0);
        _MessageStream_params.set(this, null);
        this.controller = new AbortController();
        _MessageStream_connectedPromise.set(this, void 0);
        _MessageStream_resolveConnectedPromise.set(this, () => {
        });
        _MessageStream_rejectConnectedPromise.set(this, () => {
        });
        _MessageStream_endPromise.set(this, void 0);
        _MessageStream_resolveEndPromise.set(this, () => {
        });
        _MessageStream_rejectEndPromise.set(this, () => {
        });
        _MessageStream_listeners.set(this, {});
        _MessageStream_ended.set(this, false);
        _MessageStream_errored.set(this, false);
        _MessageStream_aborted.set(this, false);
        _MessageStream_catchingPromiseCreated.set(this, false);
        _MessageStream_response.set(this, void 0);
        _MessageStream_request_id.set(this, void 0);
        _MessageStream_logger.set(this, void 0);
        _MessageStream_handleError.set(this, (error) => {
          __classPrivateFieldSet(this, _MessageStream_errored, true, "f");
          if (isAbortError(error)) {
            error = new APIUserAbortError();
          }
          if (error instanceof APIUserAbortError) {
            __classPrivateFieldSet(this, _MessageStream_aborted, true, "f");
            return this._emit("abort", error);
          }
          if (error instanceof AnthropicError) {
            return this._emit("error", error);
          }
          if (error instanceof Error) {
            const anthropicError = new AnthropicError(error.message);
            anthropicError.cause = error;
            return this._emit("error", anthropicError);
          }
          return this._emit("error", new AnthropicError(String(error)));
        });
        __classPrivateFieldSet(this, _MessageStream_connectedPromise, new Promise((resolve4, reject) => {
          __classPrivateFieldSet(this, _MessageStream_resolveConnectedPromise, resolve4, "f");
          __classPrivateFieldSet(this, _MessageStream_rejectConnectedPromise, reject, "f");
        }), "f");
        __classPrivateFieldSet(this, _MessageStream_endPromise, new Promise((resolve4, reject) => {
          __classPrivateFieldSet(this, _MessageStream_resolveEndPromise, resolve4, "f");
          __classPrivateFieldSet(this, _MessageStream_rejectEndPromise, reject, "f");
        }), "f");
        __classPrivateFieldGet(this, _MessageStream_connectedPromise, "f").catch(() => {
        });
        __classPrivateFieldGet(this, _MessageStream_endPromise, "f").catch(() => {
        });
        __classPrivateFieldSet(this, _MessageStream_params, params, "f");
        __classPrivateFieldSet(this, _MessageStream_logger, opts?.logger ?? console, "f");
      }
      get response() {
        return __classPrivateFieldGet(this, _MessageStream_response, "f");
      }
      get request_id() {
        return __classPrivateFieldGet(this, _MessageStream_request_id, "f");
      }
      /**
       * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
       * returned vie the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * This is the same as the `APIPromise.withResponse()` method.
       *
       * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
       * as no `Response` is available.
       */
      async withResponse() {
        __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
        const response = await __classPrivateFieldGet(this, _MessageStream_connectedPromise, "f");
        if (!response) {
          throw new Error("Could not resolve a `Response` object");
        }
        return {
          data: this,
          response,
          request_id: response.headers.get("request-id")
        };
      }
      /**
       * Intended for use on the frontend, consuming a stream produced with
       * `.toReadableStream()` on the backend.
       *
       * Note that messages sent to the model do not appear in `.on('message')`
       * in this context.
       */
      static fromReadableStream(stream) {
        const runner = new _MessageStream(null);
        runner._run(() => runner._fromReadableStream(stream));
        return runner;
      }
      static createMessage(messages, params, options, { logger } = {}) {
        const runner = new _MessageStream(params, { logger });
        for (const message of params.messages) {
          runner._addMessageParam(message);
        }
        __classPrivateFieldSet(runner, _MessageStream_params, { ...params, stream: true }, "f");
        runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, [STAINLESS_HELPER_METHOD_HEADER]: "stream" } }));
        return runner;
      }
      _run(executor) {
        executor().then(() => {
          this._emitFinal();
          this._emit("end");
        }, __classPrivateFieldGet(this, _MessageStream_handleError, "f"));
      }
      _addMessageParam(message) {
        this.messages.push(message);
      }
      _addMessage(message, emit = true) {
        this.receivedMessages.push(message);
        if (emit) {
          this._emit("message", message);
        }
      }
      async _createMessage(messages, params, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
          const { response, data: stream } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
          this._connected(response);
          for await (const event of stream) {
            __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      _connected(response) {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _MessageStream_response, response, "f");
        __classPrivateFieldSet(this, _MessageStream_request_id, response?.headers.get("request-id"), "f");
        __classPrivateFieldGet(this, _MessageStream_resolveConnectedPromise, "f").call(this, response);
        this._emit("connect");
      }
      get ended() {
        return __classPrivateFieldGet(this, _MessageStream_ended, "f");
      }
      get errored() {
        return __classPrivateFieldGet(this, _MessageStream_errored, "f");
      }
      get aborted() {
        return __classPrivateFieldGet(this, _MessageStream_aborted, "f");
      }
      abort() {
        this.controller.abort();
      }
      /**
       * Adds the listener function to the end of the listeners array for the event.
       * No checks are made to see if the listener has already been added. Multiple calls passing
       * the same combination of event and listener will result in the listener being added, and
       * called, multiple times.
       * @returns this MessageStream, so that calls can be chained
       */
      on(event, listener) {
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
        listeners.push({ listener });
        return this;
      }
      /**
       * Removes the specified listener from the listener array for the event.
       * off() will remove, at most, one instance of a listener from the listener array. If any single
       * listener has been added multiple times to the listener array for the specified event, then
       * off() must be called multiple times to remove each instance.
       * @returns this MessageStream, so that calls can be chained
       */
      off(event, listener) {
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
        if (!listeners)
          return this;
        const index = listeners.findIndex((l) => l.listener === listener);
        if (index >= 0)
          listeners.splice(index, 1);
        return this;
      }
      /**
       * Adds a one-time listener function for the event. The next time the event is triggered,
       * this listener is removed and then invoked.
       * @returns this MessageStream, so that calls can be chained
       */
      once(event, listener) {
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
        listeners.push({ listener, once: true });
        return this;
      }
      /**
       * This is similar to `.once()`, but returns a Promise that resolves the next time
       * the event is triggered, instead of calling a listener callback.
       * @returns a Promise that resolves the next time given event is triggered,
       * or rejects if an error is emitted.  (If you request the 'error' event,
       * returns a promise that resolves with the error).
       *
       * Example:
       *
       *   const message = await stream.emitted('message') // rejects if the stream errors
       */
      emitted(event) {
        return new Promise((resolve4, reject) => {
          __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
          if (event !== "error")
            this.once("error", reject);
          this.once(event, resolve4);
        });
      }
      async done() {
        __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
        await __classPrivateFieldGet(this, _MessageStream_endPromise, "f");
      }
      get currentMessage() {
        return __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
      }
      /**
       * @returns a promise that resolves with the the final assistant Message response,
       * or rejects if an error occurred or the stream ended prematurely without producing a Message.
       * If structured outputs were used, this will be a ParsedMessage with a `parsed_output` field.
       */
      async finalMessage() {
        await this.done();
        return __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this);
      }
      /**
       * @returns a promise that resolves with the the final assistant Message's text response, concatenated
       * together if there are more than one text blocks.
       * Rejects if an error occurred or the stream ended prematurely without producing a Message.
       */
      async finalText() {
        await this.done();
        return __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalText).call(this);
      }
      _emit(event, ...args) {
        if (__classPrivateFieldGet(this, _MessageStream_ended, "f"))
          return;
        if (event === "end") {
          __classPrivateFieldSet(this, _MessageStream_ended, true, "f");
          __classPrivateFieldGet(this, _MessageStream_resolveEndPromise, "f").call(this);
        }
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
        if (listeners) {
          __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
          listeners.forEach(({ listener }) => listener(...args));
        }
        if (event === "abort") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
          return;
        }
        if (event === "error") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
        }
      }
      _emitFinal() {
        const finalMessage = this.receivedMessages.at(-1);
        if (finalMessage) {
          this._emit("finalMessage", __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this));
        }
      }
      async _fromReadableStream(readableStream, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
          this._connected(null);
          const stream = Stream.fromReadableStream(readableStream, this.controller);
          for await (const event of stream) {
            __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      [(_MessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _MessageStream_params = /* @__PURE__ */ new WeakMap(), _MessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_listeners = /* @__PURE__ */ new WeakMap(), _MessageStream_ended = /* @__PURE__ */ new WeakMap(), _MessageStream_errored = /* @__PURE__ */ new WeakMap(), _MessageStream_aborted = /* @__PURE__ */ new WeakMap(), _MessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _MessageStream_response = /* @__PURE__ */ new WeakMap(), _MessageStream_request_id = /* @__PURE__ */ new WeakMap(), _MessageStream_logger = /* @__PURE__ */ new WeakMap(), _MessageStream_handleError = /* @__PURE__ */ new WeakMap(), _MessageStream_instances = /* @__PURE__ */ new WeakSet(), _MessageStream_getFinalMessage = function _MessageStream_getFinalMessage2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        return this.receivedMessages.at(-1);
      }, _MessageStream_getFinalText = function _MessageStream_getFinalText2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
        if (textBlocks.length === 0) {
          throw new AnthropicError("stream ended without producing a content block with type=text");
        }
        return textBlocks.join(" ");
      }, _MessageStream_beginRequest = function _MessageStream_beginRequest2() {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
      }, _MessageStream_addStreamEvent = function _MessageStream_addStreamEvent2(event) {
        if (this.ended)
          return;
        const messageSnapshot = __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_accumulateMessage).call(this, event);
        this._emit("streamEvent", event, messageSnapshot);
        switch (event.type) {
          case "content_block_delta": {
            const content = messageSnapshot.content.at(-1);
            switch (event.delta.type) {
              case "text_delta": {
                if (content.type === "text") {
                  this._emit("text", event.delta.text, content.text || "");
                }
                break;
              }
              case "citations_delta": {
                if (content.type === "text") {
                  this._emit("citation", event.delta.citation, content.citations ?? []);
                }
                break;
              }
              case "input_json_delta": {
                if (tracksToolInput2(content) && __classPrivateFieldGet(this, _MessageStream_listeners, "f").inputJson?.length) {
                  this._emit("inputJson", event.delta.partial_json, content.input);
                }
                break;
              }
              case "thinking_delta": {
                if (content.type === "thinking") {
                  this._emit("thinking", event.delta.thinking, content.thinking);
                }
                break;
              }
              case "signature_delta": {
                if (content.type === "thinking") {
                  this._emit("signature", content.signature);
                }
                break;
              }
              default:
                checkNever2(event.delta);
            }
            break;
          }
          case "message_stop": {
            this._addMessageParam(messageSnapshot);
            this._addMessage(maybeParseMessage(messageSnapshot, __classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _MessageStream_logger, "f") }), true);
            break;
          }
          case "content_block_stop": {
            this._emit("contentBlock", messageSnapshot.content.at(-1));
            break;
          }
          case "message_start": {
            __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, messageSnapshot, "f");
            break;
          }
          case "content_block_start":
          case "message_delta":
            break;
        }
      }, _MessageStream_endRequest = function _MessageStream_endRequest2() {
        if (this.ended) {
          throw new AnthropicError(`stream has ended, this shouldn't happen`);
        }
        const snapshot = __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
        if (!snapshot) {
          throw new AnthropicError(`request ended without sending any chunks`);
        }
        __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
        return maybeParseMessage(snapshot, __classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _MessageStream_logger, "f") });
      }, _MessageStream_accumulateMessage = function _MessageStream_accumulateMessage2(event) {
        let snapshot = __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
        if (event.type === "message_start") {
          if (snapshot) {
            throw new AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
          }
          return event.message;
        }
        if (!snapshot) {
          throw new AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
        }
        switch (event.type) {
          case "message_stop":
            return snapshot;
          case "message_delta":
            snapshot.stop_reason = event.delta.stop_reason;
            snapshot.stop_sequence = event.delta.stop_sequence;
            if (event.delta.stop_details != null) {
              snapshot.stop_details = event.delta.stop_details;
            }
            snapshot.usage.output_tokens = event.usage.output_tokens;
            if (event.usage.input_tokens != null) {
              snapshot.usage.input_tokens = event.usage.input_tokens;
            }
            if (event.usage.cache_creation_input_tokens != null) {
              snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
            }
            if (event.usage.cache_read_input_tokens != null) {
              snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
            }
            if (event.usage.server_tool_use != null) {
              snapshot.usage.server_tool_use = event.usage.server_tool_use;
            }
            return snapshot;
          case "content_block_start":
            snapshot.content.push({ ...event.content_block });
            return snapshot;
          case "content_block_delta": {
            const snapshotContent = snapshot.content.at(event.index);
            switch (event.delta.type) {
              case "text_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    text: (snapshotContent.text || "") + event.delta.text
                  };
                }
                break;
              }
              case "citations_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    citations: [...snapshotContent.citations ?? [], event.delta.citation]
                  };
                }
                break;
              }
              case "input_json_delta": {
                if (snapshotContent && tracksToolInput2(snapshotContent)) {
                  const jsonBuf = (snapshotContent[JSON_BUF_PROPERTY] || "") + event.delta.partial_json;
                  snapshot.content[event.index] = withLazyInput(snapshotContent, jsonBuf);
                }
                break;
              }
              case "thinking_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    thinking: snapshotContent.thinking + event.delta.thinking
                  };
                }
                break;
              }
              case "signature_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    signature: event.delta.signature
                  };
                }
                break;
              }
              default:
                checkNever2(event.delta);
            }
            return snapshot;
          }
          case "content_block_stop": {
            const snapshotContent = snapshot.content.at(event.index);
            if (snapshotContent && tracksToolInput2(snapshotContent) && JSON_BUF_PROPERTY in snapshotContent) {
              Object.defineProperty(snapshotContent, "input", {
                value: snapshotContent.input,
                enumerable: true,
                configurable: true,
                writable: true
              });
            }
            return snapshot;
          }
        }
      }, Symbol.asyncIterator)]() {
        const pushQueue = [];
        const readQueue = [];
        let done = false;
        this.on("streamEvent", (event) => {
          const reader = readQueue.shift();
          if (reader) {
            reader.resolve(event);
          } else {
            pushQueue.push(event);
          }
        });
        this.on("end", () => {
          done = true;
          for (const reader of readQueue) {
            reader.resolve(void 0);
          }
          readQueue.length = 0;
        });
        this.on("abort", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        this.on("error", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        return {
          next: async () => {
            if (!pushQueue.length) {
              if (done) {
                return { value: void 0, done: true };
              }
              return new Promise((resolve4, reject) => readQueue.push({ resolve: resolve4, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
            }
            const chunk = pushQueue.shift();
            return { value: chunk, done: false };
          },
          return: async () => {
            this.abort();
            return { value: void 0, done: true };
          }
        };
      }
      toReadableStream() {
        const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
        return stream.toReadableStream();
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/messages/batches.mjs
var Batches2;
var init_batches2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/messages/batches.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_jsonl();
    init_error2();
    init_path();
    Batches2 = class extends APIResource {
      /**
       * Send a batch of Message creation requests.
       *
       * The Message Batches API can be used to process multiple Messages API requests at
       * once. Once a Message Batch is created, it begins processing immediately. Batches
       * can take up to 24 hours to complete.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.create({
       *   requests: [
       *     {
       *       custom_id: 'my-custom-id-1',
       *       params: {
       *         max_tokens: 1024,
       *         messages: [
       *           { content: 'Hello, world', role: 'user' },
       *         ],
       *         model: 'claude-opus-4-6',
       *       },
       *     },
       *   ],
       * });
       * ```
       */
      create(params, options) {
        const { user_profile_id, ...body } = params;
        return this._client.post("/v1/messages/batches", {
          body,
          ...options,
          headers: buildHeaders([
            { ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * This endpoint is idempotent and can be used to poll for Message Batch
       * completion. To access the results of a Message Batch, make a request to the
       * `results_url` field in the response.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.retrieve(
       *   'message_batch_id',
       * );
       * ```
       */
      retrieve(messageBatchID, options) {
        return this._client.get(path`/v1/messages/batches/${messageBatchID}`, options);
      }
      /**
       * List all Message Batches within a Workspace. Most recently created batches are
       * returned first.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const messageBatch of client.messages.batches.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/messages/batches", Page, { query, ...options });
      }
      /**
       * Delete a Message Batch.
       *
       * Message Batches can only be deleted once they've finished processing. If you'd
       * like to delete an in-progress batch, you must first cancel it.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const deletedMessageBatch =
       *   await client.messages.batches.delete('message_batch_id');
       * ```
       */
      delete(messageBatchID, options) {
        return this._client.delete(path`/v1/messages/batches/${messageBatchID}`, options);
      }
      /**
       * Batches may be canceled any time before processing ends. Once cancellation is
       * initiated, the batch enters a `canceling` state, at which time the system may
       * complete any in-progress, non-interruptible requests before finalizing
       * cancellation.
       *
       * The number of canceled requests is specified in `request_counts`. To determine
       * which requests were canceled, check the individual results within the batch.
       * Note that cancellation may not result in any canceled requests if they were
       * non-interruptible.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.cancel(
       *   'message_batch_id',
       * );
       * ```
       */
      cancel(messageBatchID, options) {
        return this._client.post(path`/v1/messages/batches/${messageBatchID}/cancel`, options);
      }
      /**
       * Streams the results of a Message Batch as a `.jsonl` file.
       *
       * Each line in the file is a JSON object containing the result of a single request
       * in the Message Batch. Results are not guaranteed to be in the same order as
       * requests. Use the `custom_id` field to match results to requests.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatchIndividualResponse =
       *   await client.messages.batches.results('message_batch_id');
       * ```
       */
      async results(messageBatchID, options) {
        const batch = await this.retrieve(messageBatchID);
        if (!batch.results_url) {
          throw new AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
        }
        return this._client.get(batch.results_url, {
          ...options,
          headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
          stream: true,
          __binaryResponse: true
        })._thenUnwrap((_, props) => JSONLDecoder.fromResponse(props.response, props.controller));
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/messages/messages.mjs
var Messages2, DEPRECATED_MODELS2, MODELS_TO_WARN_WITH_THINKING_ENABLED2;
var init_messages2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/messages/messages.mjs"() {
    init_resource();
    init_headers();
    init_stainless_helper_header();
    init_MessageStream();
    init_parser2();
    init_batches2();
    init_batches2();
    init_constants();
    Messages2 = class extends APIResource {
      constructor() {
        super(...arguments);
        this.batches = new Batches2(this._client);
      }
      create(params, options) {
        const { user_profile_id, ...body } = params;
        if (body.model in DEPRECATED_MODELS2) {
          console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS2[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
        }
        if (MODELS_TO_WARN_WITH_THINKING_ENABLED2.includes(body.model) && body.thinking && body.thinking.type === "enabled") {
          console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
        }
        let timeout = this._client._options.timeout;
        if (!body.stream && timeout == null) {
          const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
          timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        const helperHeader2 = stainlessHelperHeader(body.tools, body.messages);
        return this._client.post("/v1/messages", {
          body,
          timeout: timeout ?? 6e5,
          ...options,
          headers: buildHeaders([
            { ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0 },
            helperHeader2,
            options?.headers
          ]),
          stream: params.stream ?? false
        });
      }
      /**
       * Send a structured list of input messages with text and/or image content, along with an expected `output_config.format` and
       * the response will be automatically parsed and available in the `parsed_output` property of the message.
       *
       * @example
       * ```ts
       * const message = await client.messages.parse({
       *   model: 'claude-sonnet-4-5-20250929',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_config: {
       *     format: zodOutputFormat(z.object({ answer: z.number() })),
       *   },
       * });
       *
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      parse(params, options) {
        return this.create(params, options).then((message) => parseMessage(message, params, { logger: this._client.logger ?? console }));
      }
      /**
       * Create a Message stream.
       *
       * If `output_config.format` is provided with a parseable format (like `zodOutputFormat()`),
       * the final message will include a `parsed_output` property with the parsed content.
       *
       * @example
       * ```ts
       * const stream = client.messages.stream({
       *   model: 'claude-sonnet-4-5-20250929',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_config: {
       *     format: zodOutputFormat(z.object({ answer: z.number() })),
       *   },
       * });
       *
       * const message = await stream.finalMessage();
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      stream(body, options) {
        return MessageStream.createMessage(this, body, options, { logger: this._client.logger ?? console });
      }
      /**
       * Count the number of tokens in a Message.
       *
       * The Token Count API can be used to count the number of tokens in a Message,
       * including tools, images, and documents, without creating it.
       *
       * Learn more about token counting in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)
       *
       * @example
       * ```ts
       * const messageTokensCount =
       *   await client.messages.countTokens({
       *     messages: [{ content: 'Hello, world', role: 'user' }],
       *     model: 'claude-opus-4-6',
       *   });
       * ```
       */
      countTokens(body, options) {
        return this._client.post("/v1/messages/count_tokens", { body, ...options });
      }
    };
    DEPRECATED_MODELS2 = {
      "claude-1.3": "November 6th, 2024",
      "claude-1.3-100k": "November 6th, 2024",
      "claude-instant-1.1": "November 6th, 2024",
      "claude-instant-1.1-100k": "November 6th, 2024",
      "claude-instant-1.2": "November 6th, 2024",
      "claude-3-sonnet-20240229": "July 21st, 2025",
      "claude-3-opus-20240229": "January 5th, 2026",
      "claude-2.1": "July 21st, 2025",
      "claude-2.0": "July 21st, 2025",
      "claude-3-7-sonnet-latest": "February 19th, 2026",
      "claude-3-7-sonnet-20250219": "February 19th, 2026",
      "claude-3-5-haiku-latest": "February 19th, 2026",
      "claude-3-5-haiku-20241022": "February 19th, 2026",
      "claude-opus-4-0": "June 15th, 2026",
      "claude-opus-4-20250514": "June 15th, 2026",
      "claude-sonnet-4-0": "June 15th, 2026",
      "claude-sonnet-4-20250514": "June 15th, 2026",
      "claude-opus-4-1": "August 5th, 2026",
      "claude-opus-4-1-20250805": "August 5th, 2026",
      "claude-mythos-preview": "June 30th, 2026"
    };
    MODELS_TO_WARN_WITH_THINKING_ENABLED2 = ["claude-mythos-preview", "claude-opus-4-6"];
    Messages2.Batches = Batches2;
  }
});

// node_modules/@anthropic-ai/sdk/resources/models.mjs
var Models2;
var init_models2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/models.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Models2 = class extends APIResource {
      /**
       * Get a specific model.
       *
       * The Models API response can be used to determine information about a specific
       * model or resolve a model alias to a model ID.
       */
      retrieve(modelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path`/v1/models/${modelID}`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List available models.
       *
       * The Models API response can be used to determine which models are available for
       * use in the API. More recently released models are listed first.
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/models", Page, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/resources/index.mjs
var init_resources2 = __esm({
  "node_modules/@anthropic-ai/sdk/resources/index.mjs"() {
    init_shared();
    init_beta();
    init_completions();
    init_messages2();
    init_models2();
  }
});

// node_modules/@anthropic-ai/sdk/client.mjs
var _BaseAnthropic_instances, _a, _BaseAnthropic_encoder, _BaseAnthropic_baseURLOverridden, HUMAN_PROMPT, AI_PROMPT, BaseAnthropic, Anthropic;
var init_client = __esm({
  "node_modules/@anthropic-ai/sdk/client.mjs"() {
    init_tslib();
    init_uuid();
    init_values();
    init_sleep();
    init_errors();
    init_detect_platform();
    init_shims();
    init_request_options();
    init_query();
    init_version();
    init_error();
    init_types();
    init_token_cache();
    init_credential_chain();
    init_middleware();
    init_pagination();
    init_uploads2();
    init_resources2();
    init_api_promise();
    init_completions();
    init_models2();
    init_beta();
    init_messages2();
    init_detect_platform();
    init_headers();
    init_env();
    init_log();
    init_values();
    HUMAN_PROMPT = "\\n\\nHuman:";
    AI_PROMPT = "\\n\\nAssistant:";
    BaseAnthropic = class {
      /**
       * The active credential provider. Default credential resolution runs once
       * at construction time. If it fails, the error is surfaced on every
       * request and the client must be reconstructed — there is no retry path.
       *
       * Clones returned by {@link withOptions} share the parent's auth state
       * (provider, token cache, pending resolution, and any resolution error)
       * unless the caller passes an explicit `apiKey`, `authToken`,
       * `credentials`, `config`, or `profile` override.
       */
      get credentials() {
        return this._authState.provider;
      }
      /**
       * API Client for interfacing with the Anthropic API.
       *
       * @param {string | null | undefined} [opts.apiKey=process.env['ANTHROPIC_API_KEY'] ?? null]
       * @param {string | null | undefined} [opts.authToken=process.env['ANTHROPIC_AUTH_TOKEN'] ?? null]
       * @param {string | null | undefined} [opts.webhookKey=process.env['ANTHROPIC_WEBHOOK_SIGNING_KEY'] ?? null]
       * @param {string} [opts.baseURL=process.env['ANTHROPIC_BASE_URL'] ?? https://api.anthropic.com] - Override the default base URL for the API.
       * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
       * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
       * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
       * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
       * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
       * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
       * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
       */
      constructor({ baseURL = readEnv("ANTHROPIC_BASE_URL"), apiKey, authToken, webhookKey = readEnv("ANTHROPIC_WEBHOOK_SIGNING_KEY") ?? null, ...opts } = {}) {
        _BaseAnthropic_instances.add(this);
        this._requestAuthFlags = /* @__PURE__ */ new WeakMap();
        _BaseAnthropic_encoder.set(this, void 0);
        if (apiKey === void 0) {
          apiKey = opts.profile != null ? null : readEnv("ANTHROPIC_API_KEY") ?? null;
        }
        if (authToken === void 0) {
          authToken = opts.profile != null ? null : readEnv("ANTHROPIC_AUTH_TOKEN") ?? null;
        }
        if (opts.profile != null && (opts.credentials != null || opts.config != null)) {
          throw new TypeError("Pass at most one of `profile`, `credentials`, or `config`.");
        }
        const options = {
          apiKey,
          authToken,
          webhookKey,
          ...opts,
          baseURL: baseURL || `https://api.anthropic.com`
        };
        if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
          throw new AnthropicError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew Anthropic({ apiKey, dangerouslyAllowBrowser: true });\n");
        }
        this.baseURL = options.baseURL;
        this._baseURLIsExplicit = opts.__baseURLIsExplicit ?? !!baseURL;
        this.timeout = options.timeout ?? _a.DEFAULT_TIMEOUT;
        this.logger = options.logger ?? console;
        this.logLevel = defaultLogLevel;
        this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", loggerFor(this)) ?? parseLogLevel(readEnv("ANTHROPIC_LOG"), "process.env['ANTHROPIC_LOG']", loggerFor(this)) ?? defaultLogLevel;
        this.fetchOptions = options.fetchOptions;
        this.maxRetries = options.maxRetries ?? 2;
        this.fetch = options.fetch ?? getDefaultFetch();
        __classPrivateFieldSet(this, _BaseAnthropic_encoder, FallbackEncoder, "f");
        this.middleware = [...options.middleware ?? []];
        const customHeadersEnv = readEnv("ANTHROPIC_CUSTOM_HEADERS");
        if (customHeadersEnv) {
          const parsed = {};
          for (const line of customHeadersEnv.split("\n")) {
            const colon = line.indexOf(":");
            if (colon >= 0) {
              parsed[line.substring(0, colon).trim()] = line.substring(colon + 1).trim();
            }
          }
          options.defaultHeaders = { ...parsed, ...options.defaultHeaders };
        }
        const inherited = opts.__auth;
        delete options.__auth;
        delete options.__baseURLIsExplicit;
        this._options = options;
        this.apiKey = typeof apiKey === "string" ? apiKey : null;
        this.authToken = authToken;
        this.webhookKey = webhookKey;
        if (inherited) {
          this._authState = inherited;
          if (!this._baseURLIsExplicit && inherited.baseURL) {
            this.baseURL = inherited.baseURL;
          }
        } else {
          this._authState = { provider: null, tokenCache: null, resolution: null, error: null, extraHeaders: {} };
          if (this.apiKey == null && this.authToken == null) {
            const credentials = options.credentials ?? null;
            if (credentials) {
              this._authState.provider = credentials;
              this._authState.tokenCache = this._makeTokenCache(credentials);
            } else if (options.config != null) {
              const result = resolveCredentialsFromConfig(options.config, this._credentialResolverOptions());
              this._authState.provider = result.provider;
              this._authState.tokenCache = this._makeTokenCache(result.provider);
              this._authState.extraHeaders = result.extraHeaders;
              this._applyCredentialBaseURL(result.baseURL);
            } else if (options.profile != null) {
              this._authState.resolution = this._resolveDefaultCredentials(options.profile);
            } else {
              this._authState.resolution = this._resolveDefaultCredentials();
            }
          }
        }
      }
      /**
       * Stores a profile/config-supplied base URL on the shared auth state and, if
       * the caller did not pin `baseURL` via constructor option or env, adopts it
       * as this client's outbound API host. Precedence: ctor opt > env > profile >
       * hardcoded default.
       */
      _applyCredentialBaseURL(baseURL) {
        if (!baseURL)
          return;
        const normalized = baseURL.replace(/\/+$/, "");
        this._authState.baseURL = normalized;
        if (!this._baseURLIsExplicit) {
          this.baseURL = normalized;
        }
      }
      /**
       * Options bag passed into the credential chain. `baseURL` here is only the
       * fallback host for the token-exchange POST when the config itself omits
       * `base_url`; the chain returns the config's own `base_url` (if any) on
       * {@link CredentialResult.baseURL}, which {@link _applyCredentialBaseURL}
       * then adopts for outbound API requests. The two are deliberately decoupled
       * so this fallback never round-trips into precedence.
       */
      _credentialResolverOptions() {
        return {
          baseURL: this.baseURL,
          fetch: this._credentialsFetch(),
          userAgent: this.getUserAgent(),
          onCacheWriteError: (err) => {
            loggerFor(this).debug("credential cache write failed (best-effort)", err);
          },
          onSafetyWarning: (msg) => {
            loggerFor(this).warn(msg);
          }
        };
      }
      /**
       * A `Fetch` for first-party credential token-exchange requests (OIDC
       * federation jwt-bearer grants, user-OAuth refresh grants) that routes
       * through this client's middleware chain, so middleware observes token
       * traffic like any other request. Only client-level middleware applies:
       * a minted token is shared across requests, so attributing the exchange
       * to any one request's per-request middleware would be arbitrary. For the
       * same reason, `ctx.options` is undefined for these requests.
       */
      _credentialsFetch() {
        return wrapFetchWithMiddleware(this.fetch, this.middleware, void 0, this);
      }
      _makeTokenCache(provider) {
        return new TokenCache(provider, (err) => {
          loggerFor(this).debug("advisory token refresh failed; serving cached token", err);
        });
      }
      /**
       * Create a new client instance re-using the same options given to the current client with optional overriding.
       */
      withOptions(options) {
        const overridesStructuredAuth = "credentials" in options || "config" in options || "profile" in options;
        const overridesAuth = "apiKey" in options || "authToken" in options || overridesStructuredAuth;
        const internal = {
          ...this._options,
          // Only forward baseURL when the caller (or env) explicitly chose it.
          // For a non-explicit parent, this.baseURL may have been mutated to the
          // profile-resolved host; pinning that as the clone's options.baseURL
          // would make _options on the clone misreport caller intent and would
          // leave the clone stuck on the parent's host across an auth override.
          // The clone instead receives the construction-time value via
          // ...this._options above and re-adopts the profile host through the
          // shared _authState.baseURL + __baseURLIsExplicit=false path.
          ...this._baseURLIsExplicit ? { baseURL: this.baseURL } : {},
          maxRetries: this.maxRetries,
          timeout: this.timeout,
          logger: this.logger,
          logLevel: this.logLevel,
          fetch: this.fetch,
          fetchOptions: this.fetchOptions,
          middleware: this.middleware,
          apiKey: this.apiKey,
          authToken: this.authToken,
          webhookKey: this.webhookKey,
          // credentials: this.credentials is a no-op when __auth is shared (the
          // ctor takes the inherited path and ignores options.credentials); when
          // overridesAuth is true via apiKey/authToken only, it lets the clone
          // build a fresh TokenCache around the parent's provider.
          credentials: this.credentials,
          // When the caller passes a structured-credential override, drop inherited
          // structured-credential options so only `...options` supplies them —
          // otherwise an inherited `credentials`/`config`/`profile` would trip the
          // mutual-exclusion check or precedence over the override.
          ...overridesStructuredAuth ? { credentials: void 0, config: void 0, profile: void 0 } : {},
          ...options,
          // Always set __auth so any stale value from ...this._options is
          // overwritten. undefined means "build fresh auth from these options".
          __auth: overridesAuth ? void 0 : this._authState,
          __baseURLIsExplicit: "baseURL" in options ? true : this._baseURLIsExplicit
        };
        return new this.constructor(internal);
      }
      /**
       * Lazily resolves credentials from config files or environment variables.
       * Called once from the constructor when no explicit auth is provided, or
       * when an explicit `profile` was passed (in which case a missing/unresolved
       * profile is surfaced as an error instead of falling through to "no auth").
       * The returned promise is stored and awaited on the first request.
       */
      async _resolveDefaultCredentials(profile) {
        try {
          const result = await defaultCredentials(this._credentialResolverOptions(), profile);
          if (result) {
            this._authState.provider = result.provider;
            this._authState.tokenCache = this._makeTokenCache(result.provider);
            this._authState.extraHeaders = result.extraHeaders;
            this._applyCredentialBaseURL(result.baseURL);
          } else if (profile != null) {
            throw new AnthropicError(`Profile "${profile}" could not be resolved (no <config_dir>/configs/${profile}.json found).`);
          }
        } catch (err) {
          this._authState.error = err;
        } finally {
          this._authState.resolution = null;
        }
      }
      defaultQuery() {
        return this._options.defaultQuery;
      }
      validateHeaders({ values, nulls }) {
        if (values.get("x-api-key") || values.get("authorization")) {
          return;
        }
        if (this._authState.error) {
          throw this._authState.error;
        }
        if (this._authState.tokenCache || this._authState.resolution) {
          return;
        }
        if (this.apiKey && values.get("x-api-key")) {
          return;
        }
        if (nulls.has("x-api-key")) {
          return;
        }
        if (this.authToken && values.get("authorization")) {
          return;
        }
        if (nulls.has("authorization")) {
          return;
        }
        throw new Error('Could not resolve authentication method. Expected one of apiKey, authToken, credentials, config, or profile to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted');
      }
      _authFlags(opts) {
        let flags = this._requestAuthFlags.get(opts);
        if (!flags) {
          flags = { usedTokenCache: false, didRefreshFor401: false };
          this._requestAuthFlags.set(opts, flags);
        }
        return flags;
      }
      async authHeaders(opts) {
        if (this._authState.resolution) {
          await this._authState.resolution;
        }
        if (this._authState.error) {
          return void 0;
        }
        if (this._authState.tokenCache && this.apiKey == null) {
          const token = await this._authState.tokenCache.getToken();
          this._authFlags(opts).usedTokenCache = true;
          return buildHeaders([{ Authorization: `Bearer ${token}` }]);
        }
        return buildHeaders([await this.apiKeyAuth(opts), await this.bearerAuth(opts)]);
      }
      async apiKeyAuth(opts) {
        if (this.apiKey == null) {
          return void 0;
        }
        return buildHeaders([{ "X-Api-Key": this.apiKey }]);
      }
      async bearerAuth(opts) {
        if (this.authToken == null) {
          return void 0;
        }
        return buildHeaders([{ Authorization: `Bearer ${this.authToken}` }]);
      }
      stringifyQuery(query) {
        return stringifyQuery(query);
      }
      getUserAgent() {
        return `${this.constructor.name}/JS ${VERSION}`;
      }
      defaultIdempotencyKey() {
        return `stainless-node-retry-${uuid4()}`;
      }
      makeStatusError(status, error, message, headers) {
        return APIError.generate(status, error, message, headers);
      }
      buildURL(path5, query, defaultBaseURL) {
        const baseURL = !__classPrivateFieldGet(this, _BaseAnthropic_instances, "m", _BaseAnthropic_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
        const url = isAbsoluteURL(path5) ? new URL(path5) : new URL(baseURL + (baseURL.endsWith("/") && path5.startsWith("/") ? path5.slice(1) : path5));
        const defaultQuery = this.defaultQuery();
        const pathQuery = Object.fromEntries(url.searchParams);
        if (!isEmptyObj(defaultQuery) || !isEmptyObj(pathQuery)) {
          query = { ...pathQuery, ...defaultQuery, ...query };
        }
        if (typeof query === "object" && query && !Array.isArray(query)) {
          url.search = this.stringifyQuery(query);
        }
        return url.toString();
      }
      _calculateNonstreamingTimeout(maxTokens) {
        const defaultTimeout = 10 * 60;
        const expectedTimeout = 60 * 60 * maxTokens / 128e3;
        if (expectedTimeout > defaultTimeout) {
          throw new AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#streaming-responses for more details");
        }
        return defaultTimeout * 1e3;
      }
      /**
       * Used as a callback for mutating the given `FinalRequestOptions` object.
       */
      async prepareOptions(options) {
      }
      /**
       * Used as a callback for mutating the given `RequestInit` object.
       *
       * This is useful for cases where you want to add certain headers based off of
       * the request properties, e.g. `method` or `url`.
       *
       * Runs after all middleware (including {@link backendMiddleware}),
       * immediately before each underlying fetch call, so it sees exactly what
       * goes over the wire. Middleware may replay a request by calling `next()`
       * more than once, so this hook can run multiple times per attempt:
       * overrides must be idempotent and overwrite headers from a previous
       * invocation rather than append to them.
       */
      async prepareRequest(request, { url, options }) {
        if (this._authState.tokenCache && this.apiKey == null) {
          const headers = request.headers instanceof Headers ? request.headers : new Headers(request.headers);
          for (const [k, v] of Object.entries(this._authState.extraHeaders)) {
            if (!headers.has(k))
              headers.set(k, v);
          }
          const existing = headers.get("anthropic-beta")?.split(",").map((s) => s.trim());
          if (!existing?.includes(OAUTH_API_BETA_HEADER)) {
            headers.append("anthropic-beta", OAUTH_API_BETA_HEADER);
          }
          request.headers = headers;
        }
      }
      /**
       * Internal {@link Middleware} composed innermost in the chain — inside both
       * client-level and per-request middleware, immediately around the underlying
       * `fetch`. Subclasses for third-party backends override this to adapt the
       * canonical Anthropic-shaped request to the backend's wire shape (URL/body
       * rewriting, request signing) and to normalize the wire response back to the
       * canonical shape (e.g. AWS EventStream to SSE).
       *
       * Running inside the user's middleware means user middleware always observes
       * canonical Anthropic-shaped traffic, and the adaptation re-runs (e.g.
       * re-signs) on every `next()` invocation, covering whatever the middleware
       * mutated.
       *
       * Errors thrown here follow the middleware error policy: they propagate to
       * the caller as-is — no retries, no `APIConnectionError` wrapping — unless
       * retryable (see {@link Middleware}); throw a `RetryableError` to opt into
       * the retry path.
       */
      backendMiddleware() {
        return [];
      }
      get(path5, opts) {
        return this.methodRequest("get", path5, opts);
      }
      post(path5, opts) {
        return this.methodRequest("post", path5, opts);
      }
      patch(path5, opts) {
        return this.methodRequest("patch", path5, opts);
      }
      put(path5, opts) {
        return this.methodRequest("put", path5, opts);
      }
      delete(path5, opts) {
        return this.methodRequest("delete", path5, opts);
      }
      methodRequest(method, path5, opts) {
        return this.request(Promise.resolve(opts).then((opts2) => {
          return { method, path: path5, ...opts2 };
        }));
      }
      request(options, remainingRetries = null) {
        return new APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
      }
      async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
        const options = await optionsInput;
        const maxRetries = options.maxRetries ?? this.maxRetries;
        if (retriesRemaining == null) {
          retriesRemaining = maxRetries;
          this._requestAuthFlags.delete(options);
        }
        await this.prepareOptions(options);
        const { req, url, timeout } = await this.buildRequest(options, {
          retryCount: maxRetries - retriesRemaining
        });
        const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
        const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
        const startTime = Date.now();
        if (options.signal?.aborted) {
          throw new APIUserAbortError();
        }
        const controller = new AbortController();
        const response = await this.fetchWithTimeout(url, req, timeout, controller, options, {
          requestLogID,
          retryOfRequestLogID
        }).catch(castToError);
        const headersTime = Date.now();
        if (response instanceof globalThis.Error) {
          const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
          if (options.signal?.aborted) {
            throw new APIUserAbortError();
          }
          const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
          const hasMiddleware = this.middleware.length > 0 || !!options.middleware?.length || this.backendMiddleware().length > 0;
          if (hasMiddleware && !isTimeout && !isRetryableError(response)) {
            loggerFor(this).info(`[${requestLogID}] middleware error (not retryable)`);
            loggerFor(this).debug(`[${requestLogID}] middleware error (not retryable)`, formatRequestDetails({
              retryOfRequestLogID,
              url,
              durationMs: headersTime - startTime,
              message: response.message
            }));
            throw response;
          }
          if (retriesRemaining) {
            loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
            loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
              retryOfRequestLogID,
              url,
              durationMs: headersTime - startTime,
              message: response.message
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
          }
          loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
          loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
            retryOfRequestLogID,
            url,
            durationMs: headersTime - startTime,
            message: response.message
          }));
          if (isTimeout) {
            throw new APIConnectionTimeoutError();
          }
          if (hasMiddleware && !isFetchOriginError(response)) {
            throw response;
          }
          throw new APIConnectionError({ cause: response });
        }
        const specialHeaders = [...response.headers.entries()].filter(([name]) => name === "request-id").map(([name, value]) => ", " + name + ": " + JSON.stringify(value)).join("");
        const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
        if (!response.ok) {
          const shouldRetry = await this.shouldRetry(response, options);
          if (retriesRemaining && shouldRetry) {
            const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
            await CancelReadableStream(response.body);
            loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
            loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
              retryOfRequestLogID,
              url: response.url,
              status: response.status,
              headers: response.headers,
              durationMs: headersTime - startTime
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
          }
          const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
          loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
          const errText = await response.text().catch((err2) => castToError(err2).message);
          const errJSON = safeJSON(errText);
          const errMessage = errJSON ? void 0 : errText;
          loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
            retryOfRequestLogID,
            url: response.url,
            status: response.status,
            headers: response.headers,
            message: errMessage,
            durationMs: Date.now() - startTime
          }));
          const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
          throw err;
        }
        loggerFor(this).info(responseInfo);
        loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
      }
      getAPIList(path5, Page2, opts) {
        return this.requestAPIList(Page2, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path: path5, ...opts2 })) : { method: "get", path: path5, ...opts });
      }
      requestAPIList(Page2, options) {
        const request = this.makeRequest(options, null, void 0);
        return new PagePromise(this, request, Page2);
      }
      async fetchWithTimeout(url, init, ms, controller, requestOptions, logCtx) {
        const { signal, method, ...options } = init || {};
        const abort = this._makeAbort(controller);
        if (signal)
          signal.addEventListener("abort", abort, { once: true });
        const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
        const fetchOptions = {
          signal: controller.signal,
          ...isReadableBody ? { duplex: "half" } : {},
          method: "GET",
          ...options
        };
        if (method) {
          fetchOptions.method = method.toUpperCase();
        }
        const baseFetch = this.fetch;
        const timedFetch = async (innerUrl, innerInit) => {
          const timeout = setTimeout(abort, ms);
          try {
            return await baseFetch.call(void 0, innerUrl, innerInit);
          } finally {
            clearTimeout(timeout);
          }
        };
        const innerFetch = requestOptions === void 0 ? timedFetch : (async (innerUrl, innerInit = {}) => {
          const innerUrlStr = typeof innerUrl === "string" ? innerUrl : innerUrl instanceof URL ? innerUrl.href : innerUrl.url;
          innerInit.headers = innerInit.headers instanceof Headers ? innerInit.headers : new Headers(innerInit.headers);
          await this.prepareRequest(innerInit, { url: innerUrlStr, options: requestOptions });
          if (logCtx) {
            loggerFor(this).debug(`[${logCtx.requestLogID}] sending request`, formatRequestDetails({
              retryOfRequestLogID: logCtx.retryOfRequestLogID,
              method: innerInit.method,
              url: innerUrlStr,
              options: requestOptions,
              headers: innerInit.headers
            }));
          }
          return timedFetch(innerUrl, innerInit);
        });
        const requestMiddleware = requestOptions?.middleware;
        const backendMiddleware = this.backendMiddleware();
        const allMiddleware = requestMiddleware?.length || backendMiddleware.length ? [...this.middleware, ...requestMiddleware ?? [], ...backendMiddleware] : this.middleware;
        return await wrapFetchWithMiddleware(innerFetch, allMiddleware, requestOptions, this)(url, fetchOptions);
      }
      async shouldRetry(response, options) {
        const flags = this._authFlags(options);
        if (response.status === 401 && this._authState.tokenCache && flags.usedTokenCache && !flags.didRefreshFor401) {
          flags.didRefreshFor401 = true;
          this._authState.tokenCache.invalidate();
          return true;
        }
        const shouldRetryHeader = response.headers.get("x-should-retry");
        if (shouldRetryHeader === "true")
          return true;
        if (shouldRetryHeader === "false")
          return false;
        if (response.status === 408)
          return true;
        if (response.status === 409)
          return true;
        if (response.status === 429)
          return true;
        if (response.status >= 500)
          return true;
        return false;
      }
      async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
        let timeoutMillis;
        const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
        if (retryAfterMillisHeader) {
          const timeoutMs = parseFloat(retryAfterMillisHeader);
          if (!Number.isNaN(timeoutMs)) {
            timeoutMillis = timeoutMs;
          }
        }
        const retryAfterHeader = responseHeaders?.get("retry-after");
        if (retryAfterHeader && !timeoutMillis) {
          const timeoutSeconds = parseFloat(retryAfterHeader);
          if (!Number.isNaN(timeoutSeconds)) {
            timeoutMillis = timeoutSeconds * 1e3;
          } else {
            timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
          }
        }
        if (timeoutMillis === void 0) {
          const maxRetries = options.maxRetries ?? this.maxRetries;
          timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
        }
        await sleep(timeoutMillis);
        return this.makeRequest(options, retriesRemaining - 1, requestLogID);
      }
      calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
        const initialRetryDelay = 0.5;
        const maxRetryDelay = 8;
        const numRetries = maxRetries - retriesRemaining;
        const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
        const jitter2 = 1 - Math.random() * 0.25;
        return sleepSeconds * jitter2 * 1e3;
      }
      calculateNonstreamingTimeout(maxTokens, maxNonstreamingTokens) {
        const maxTime = 60 * 60 * 1e3;
        const defaultTime = 60 * 10 * 1e3;
        const expectedTime = maxTime * maxTokens / 128e3;
        if (expectedTime > defaultTime || maxNonstreamingTokens != null && maxTokens > maxNonstreamingTokens) {
          throw new AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#long-requests for more details");
        }
        return defaultTime;
      }
      async buildRequest(inputOptions, { retryCount = 0 } = {}) {
        const options = { ...inputOptions };
        const { method, path: path5, query, defaultBaseURL } = options;
        if (this._authState.resolution) {
          await this._authState.resolution;
        }
        if (!this._baseURLIsExplicit && this._authState.baseURL && this.baseURL !== this._authState.baseURL) {
          this.baseURL = this._authState.baseURL;
        }
        const url = this.buildURL(path5, query, defaultBaseURL);
        if ("timeout" in options)
          validatePositiveInteger("timeout", options.timeout);
        options.timeout = options.timeout ?? this.timeout;
        const { bodyHeaders, body } = this.buildBody({ options });
        const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
        const req = {
          method,
          headers: reqHeaders,
          ...options.signal && { signal: options.signal },
          ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
          ...body && { body },
          ...this.fetchOptions ?? {},
          ...options.fetchOptions ?? {}
        };
        return { req, url, timeout: options.timeout };
      }
      async buildHeaders({ options, method, bodyHeaders, retryCount }) {
        let idempotencyHeaders = {};
        if (this.idempotencyHeader && method !== "get") {
          if (!options.idempotencyKey)
            options.idempotencyKey = this.defaultIdempotencyKey();
          idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
        }
        const headers = buildHeaders([
          idempotencyHeaders,
          {
            Accept: "application/json",
            "User-Agent": this.getUserAgent(),
            "X-Stainless-Retry-Count": String(retryCount),
            ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
            ...getPlatformHeaders(),
            ...this._options.dangerouslyAllowBrowser ? { "anthropic-dangerous-direct-browser-access": "true" } : void 0,
            "anthropic-version": "2023-06-01"
          },
          await this.authHeaders(options),
          this._options.defaultHeaders,
          bodyHeaders,
          options.headers
        ]);
        this.validateHeaders(headers);
        return headers.values;
      }
      _makeAbort(controller) {
        return () => controller.abort();
      }
      buildBody({ options: { body, headers: rawHeaders } }) {
        if (!body) {
          return { bodyHeaders: void 0, body: void 0 };
        }
        const headers = buildHeaders([rawHeaders]);
        if (
          // Pass raw type verbatim
          ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && // Preserve legacy string encoding behavior for now
          headers.values.has("content-type") || // `Blob` is superset of `File`
          globalThis.Blob && body instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
          body instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
          body instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
          globalThis.ReadableStream && body instanceof globalThis.ReadableStream
        ) {
          return { bodyHeaders: void 0, body };
        } else if (typeof body === "object" && (Symbol.asyncIterator in body || Symbol.iterator in body && "next" in body && typeof body.next === "function")) {
          return { bodyHeaders: void 0, body: ReadableStreamFrom(body) };
        } else if (typeof body === "object" && headers.values.get("content-type") === "application/x-www-form-urlencoded") {
          return {
            bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
            body: this.stringifyQuery(body)
          };
        } else {
          return __classPrivateFieldGet(this, _BaseAnthropic_encoder, "f").call(this, { body, headers });
        }
      }
    };
    _a = BaseAnthropic, _BaseAnthropic_encoder = /* @__PURE__ */ new WeakMap(), _BaseAnthropic_instances = /* @__PURE__ */ new WeakSet(), _BaseAnthropic_baseURLOverridden = function _BaseAnthropic_baseURLOverridden2() {
      return this.baseURL !== "https://api.anthropic.com";
    };
    BaseAnthropic.Anthropic = _a;
    BaseAnthropic.HUMAN_PROMPT = HUMAN_PROMPT;
    BaseAnthropic.AI_PROMPT = AI_PROMPT;
    BaseAnthropic.DEFAULT_TIMEOUT = 6e5;
    BaseAnthropic.AnthropicError = AnthropicError;
    BaseAnthropic.APIError = APIError;
    BaseAnthropic.APIConnectionError = APIConnectionError;
    BaseAnthropic.APIConnectionTimeoutError = APIConnectionTimeoutError;
    BaseAnthropic.APIUserAbortError = APIUserAbortError;
    BaseAnthropic.NotFoundError = NotFoundError;
    BaseAnthropic.ConflictError = ConflictError;
    BaseAnthropic.RateLimitError = RateLimitError;
    BaseAnthropic.BadRequestError = BadRequestError;
    BaseAnthropic.AuthenticationError = AuthenticationError;
    BaseAnthropic.InternalServerError = InternalServerError;
    BaseAnthropic.PermissionDeniedError = PermissionDeniedError;
    BaseAnthropic.UnprocessableEntityError = UnprocessableEntityError;
    BaseAnthropic.toFile = toFile;
    Anthropic = class extends BaseAnthropic {
      constructor() {
        super(...arguments);
        this.completions = new Completions(this);
        this.messages = new Messages2(this);
        this.models = new Models2(this);
        this.beta = new Beta(this);
      }
    };
    Anthropic.Completions = Completions;
    Anthropic.Messages = Messages2;
    Anthropic.Models = Models2;
    Anthropic.Beta = Beta;
  }
});

// node_modules/@anthropic-ai/sdk/lib/middleware.mjs
var encoder;
var init_middleware2 = __esm({
  "node_modules/@anthropic-ai/sdk/lib/middleware.mjs"() {
    init_error();
    init_streaming();
    init_errors();
    init_headers();
    init_stainless_helper_header();
    init_values();
    init_request_options();
    encoder = new TextEncoder();
  }
});

// node_modules/@anthropic-ai/sdk/index.mjs
var init_sdk = __esm({
  "node_modules/@anthropic-ai/sdk/index.mjs"() {
    init_client();
    init_uploads2();
    init_api_promise();
    init_middleware2();
    init_client();
    init_pagination();
    init_error();
  }
});

// tests/factory-serve.ts
import { createServer } from "node:http";
import { join as join5 } from "node:path";
import { mkdirSync as mkdirSync2, existsSync as existsSync2 } from "node:fs";

// packages/factory-core/src/store.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
var JsonStore = class {
  #path;
  #data;
  constructor(path5, initial) {
    this.#path = path5;
    const dir = dirname(path5);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (existsSync(path5)) {
      this.#data = JSON.parse(readFileSync(path5, "utf-8"));
    } else {
      this.#data = initial;
      this.#write();
    }
  }
  read() {
    return this.#data;
  }
  update(fn) {
    this.#data = fn(this.#data);
    this.#write();
  }
  #write() {
    const tmp = this.#path + ".tmp";
    writeFileSync(tmp, JSON.stringify(this.#data, null, 2), "utf-8");
    renameSync(tmp, this.#path);
  }
};
var FactoryStore = class {
  #signals;
  #leads;
  #approval;
  #warehouse;
  #trash;
  #events;
  #dailyDigitals;
  #dailyMissions;
  #feedbackEvents;
  #orders;
  #settings;
  #workRuns;
  #deliveryPacks;
  #caseRecords;
  #integrity;
  #leadThreads;
  constructor(dataDir) {
    const p = (name) => join(dataDir, `${name}.json`);
    this.#signals = new JsonStore(p("signals"), []);
    this.#leads = new JsonStore(p("leads"), []);
    this.#approval = new JsonStore(p("approval"), []);
    this.#warehouse = new JsonStore(p("warehouse"), []);
    this.#trash = new JsonStore(p("trash"), []);
    this.#events = new JsonStore(p("events"), []);
    this.#dailyDigitals = new JsonStore(p("daily-digitals"), []);
    this.#dailyMissions = new JsonStore(p("daily-missions"), []);
    this.#feedbackEvents = new JsonStore(p("feedback-events"), []);
    this.#orders = new JsonStore(p("orders"), []);
    this.#settings = new JsonStore(p("settings"), { autopilotEnabled: true });
    this.#workRuns = new JsonStore(p("work-runs"), []);
    this.#deliveryPacks = new JsonStore(p("delivery-packs"), []);
    this.#caseRecords = new JsonStore(p("case-records"), []);
    this.#integrity = new JsonStore(p("integrity"), []);
    this.#leadThreads = new JsonStore(p("lead-threads"), []);
  }
  snapshot() {
    return {
      signals: this.#signals.read(),
      leads: this.#leads.read(),
      approvalQueue: this.#approval.read(),
      warehouse: this.#warehouse.read(),
      trash: this.#trash.read(),
      events: this.#events.read(),
      dailyDigitals: this.#dailyDigitals.read(),
      dailyMissions: this.#dailyMissions.read(),
      feedbackEvents: this.#feedbackEvents.read(),
      orders: this.#orders.read(),
      workRuns: this.#workRuns.read(),
      deliveryPacks: this.#deliveryPacks.read(),
      caseRecords: this.#caseRecords.read(),
      integrity: this.#integrity.read(),
      leadThreads: this.#leadThreads.read()
    };
  }
  // --- Pipeline ---
  addSignal(s) {
    this.#signals.update((arr) => [...arr, s]);
  }
  updateSignal(id, patch) {
    this.#signals.update((arr) => arr.map((s) => s.id === id ? { ...s, ...patch } : s));
  }
  addLead(l) {
    this.#leads.update((arr) => [...arr, l]);
  }
  addApprovalItem(item) {
    this.#approval.update((arr) => [...arr, item]);
  }
  updateApprovalItem(id, patch) {
    this.#approval.update((arr) => arr.map((a) => a.id === id ? { ...a, ...patch } : a));
  }
  addWarehouseItem(item) {
    this.#warehouse.update((arr) => [...arr, item]);
  }
  addTrashItem(item) {
    this.#trash.update((arr) => [...arr, item]);
  }
  addEvent(e) {
    this.#events.update((arr) => [...arr, e]);
  }
  getApprovalItem(id) {
    return this.#approval.read().find((a) => a.id === id);
  }
  // --- Daily Missions ---
  addDailyDigital(d) {
    this.#dailyDigitals.update((arr) => [...arr, d]);
  }
  updateDailyDigital(id, patch) {
    this.#dailyDigitals.update((arr) => arr.map((d) => d.id === id ? { ...d, ...patch } : d));
  }
  getDailyDigital(id) {
    return this.#dailyDigitals.read().find((d) => d.id === id);
  }
  getDailyDigitalsForDate(date) {
    return this.#dailyDigitals.read().filter((d) => d.date === date);
  }
  addDailyMission(m) {
    this.#dailyMissions.update((arr) => [...arr, m]);
  }
  addFeedbackEvent(e) {
    this.#feedbackEvents.update((arr) => [...arr, e]);
  }
  /** Digitals flagged needs_rework — the autopilot regenerates these. */
  getDigitalsNeedingRework() {
    return this.#dailyDigitals.read().filter((d) => d.status === "needs_rework");
  }
  // --- Client orders ---
  addOrder(o) {
    this.#orders.update((arr) => [...arr, o]);
  }
  updateOrder(id, patch) {
    this.#orders.update((arr) => arr.map((o) => o.id === id ? { ...o, ...patch } : o));
  }
  getOrder(id) {
    return this.#orders.read().find((o) => o.id === id);
  }
  /** Orders the factory still has to produce for (client work in progress). */
  getOpenOrders() {
    return this.#orders.read().filter((o) => o.status === "new" || o.status === "in_production");
  }
  // --- Delivery packs + case records ---
  addDeliveryPack(p) {
    this.#deliveryPacks.update((arr) => [...arr, p]);
  }
  updateDeliveryPack(id, patch) {
    this.#deliveryPacks.update((arr) => arr.map((p) => p.id === id ? { ...p, ...patch } : p));
  }
  getDeliveryPack(id) {
    return this.#deliveryPacks.read().find((p) => p.id === id);
  }
  addCaseRecord(c) {
    this.#caseRecords.update((arr) => [...arr, c]);
  }
  // --- Agent integrity (Pinocchio monitor) ---
  getIntegrityRecord(agentId) {
    return this.#integrity.read().find((r) => r.agentId === agentId);
  }
  upsertIntegrityRecord(rec) {
    this.#integrity.update((arr) => {
      const idx = arr.findIndex((r) => r.agentId === rec.agentId);
      if (idx === -1) return [...arr, rec];
      return arr.map((r, i) => i === idx ? rec : r);
    });
  }
  // --- Lead Engine (LEA) ---
  getLeadThread(id) {
    return this.#leadThreads.read().find((t) => t.id === id);
  }
  addLeadThread(t) {
    this.#leadThreads.update((arr) => [...arr, t]);
  }
  updateLeadThread(id, patch) {
    this.#leadThreads.update((arr) => arr.map((t) => t.id === id ? { ...t, ...patch } : t));
  }
  // --- Settings (survive restarts) ---
  getAutopilotEnabled() {
    return this.#settings.read().autopilotEnabled;
  }
  setAutopilotEnabled(value) {
    this.#settings.update((s) => ({ ...s, autopilotEnabled: value }));
  }
  // --- Work run ledger ---
  addWorkRun(run) {
    this.#workRuns.update((arr) => [...arr, run]);
  }
  getRecentWorkRuns(limit2 = 10) {
    return [...this.#workRuns.read()].reverse().slice(0, limit2);
  }
  getLastWorkRun() {
    const runs = this.#workRuns.read();
    return runs[runs.length - 1];
  }
  /** Returns recent operator feedback text grouped by department, from needs_rework and rejected items. */
  getRecentFeedbackConstraints(days) {
    const cutoff = new Date(Date.now() - days * 864e5).toISOString();
    const result = {
      marketing: [],
      sales: [],
      delivery: [],
      research: [],
      qa: []
    };
    const events = this.#feedbackEvents.read().filter(
      (e) => e.timestamp >= cutoff && e.feedback && (e.action === "needs_rework" || e.action === "rejected")
    );
    for (const ev of events) {
      if (ev.feedback) result[ev.department].push(ev.feedback);
    }
    return result;
  }
};

// packages/factory-core/src/registry.ts
var AGENT_REGISTRY = [
  {
    id: "A",
    name: "Signal Intake Officer",
    role: "intake",
    watch: "JobQueue \u2014 incoming operator signals",
    trigger: "signal.status === 'queued'",
    nextAction: "Categorise signal, extract ICP signals \u2192 produce IntakeBrief"
  },
  {
    id: "B",
    name: "ICP Qualifier",
    role: "qualification",
    watch: "IntakeBriefs \u2014 output of Agent A",
    trigger: "new IntakeBrief available",
    nextAction: "Score brief vs ICP dimensions \u2192 QualifiedLead or TrashItem"
  },
  {
    id: "C",
    name: "Lead Enricher",
    role: "enrichment",
    watch: "QualifiedLeads where qualified === true",
    trigger: "new qualified lead",
    nextAction: "Add context, buyer persona, pain sharpening \u2192 EnrichedLead"
  },
  {
    id: "D",
    name: "Offer Strategist",
    role: "strategy",
    watch: "EnrichedLeads \u2014 output of Agent C",
    trigger: "new EnrichedLead available",
    nextAction: "Define ICP statement, positioning, KPIs, constraints \u2192 OfferStrategy"
  },
  {
    id: "E",
    name: "Offer Builder",
    role: "offer-builder",
    watch: "OfferStrategies \u2014 output of Agent D",
    trigger: "new OfferStrategy available",
    nextAction: "Draft offer text aligned to strategy \u2192 DraftOffer"
  },
  {
    id: "F",
    name: "Offer Evaluator",
    role: "evaluation",
    watch: "DraftOffers \u2014 output of Agent E or G",
    trigger: "new DraftOffer available",
    nextAction: "Score against KPIs \u2192 ScoredOffer (passed or failed)"
  },
  {
    id: "G",
    name: "Offer Editor",
    role: "editing",
    watch: "ScoredOffers where passed === false",
    trigger: "score below threshold (max 1 revision cycle)",
    nextAction: "Strengthen weak KPI dimensions \u2192 revised DraftOffer back to Agent F"
  },
  {
    id: "H",
    name: "Approval Gatekeeper",
    role: "approval-gate",
    watch: "ScoredOffers where passed === true",
    trigger: "offer passes evaluation",
    nextAction: "Create ApprovalItem (sent: false), log approval.required \u2192 operator decides"
  },
  {
    id: "I",
    name: "Approval Monitor",
    role: "routing",
    watch: "ApprovalQueue \u2014 items approved by operator",
    trigger: "item.status === 'approved'",
    nextAction: "Move approved item to Warehouse, log warehouse.received"
  },
  {
    id: "J",
    name: "Succession Watcher",
    role: "succession",
    watch: "All pipeline agents",
    trigger: "agent failure or repeated low scores detected",
    nextAction: "Flag agent for succession, log agent.drift_detected"
  },
  {
    id: "K",
    name: "Lineage Tracker",
    role: "lineage",
    watch: "SuccessionFlags \u2014 output of Agent J",
    trigger: "succession flag logged",
    nextAction: "Create succession brief with failure summary and repeatedWeaknesses"
  },
  {
    id: "L",
    name: "Quality Auditor",
    role: "quality",
    watch: "WarehouseItems \u2014 approved offers",
    trigger: "new item arrives in Warehouse",
    nextAction: "Score quality, log quality.metric, update scorecard"
  },
  {
    id: "M",
    name: "Performance Reporter",
    role: "reporting",
    watch: "Quality metrics \u2014 output of Agent L",
    trigger: "quality.metric logged",
    nextAction: "Aggregate metrics, update performance scorecards, log report.generated"
  },
  {
    id: "N",
    name: "Factory Director",
    role: "direction",
    watch: "All pipeline stages and event log",
    trigger: "drift in any stage or pipeline stall detected",
    nextAction: "Issue correction brief, reset stalled stage, log factory.correction_issued"
  },
  {
    id: "MA",
    name: "Marketing Producer",
    role: "production-marketing",
    watch: "Client orders routed to marketing + daily marketing mission slot",
    trigger: "open order (dept=marketing) or missing marketing training asset for today",
    nextAction: "Generate marketing_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "SA",
    name: "Sales Producer",
    role: "production-sales",
    watch: "Client orders routed to sales + daily sales mission slot",
    trigger: "open order (dept=sales) or missing sales training asset for today",
    nextAction: "Generate sales_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "DA",
    name: "Delivery Producer",
    role: "production-delivery",
    watch: "Client orders routed to delivery + daily delivery mission slot",
    trigger: "open order (dept=delivery) or missing delivery training asset for today",
    nextAction: "Generate delivery_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "RA",
    name: "Research Producer",
    role: "production-research",
    watch: "Client orders routed to research + daily research mission slot",
    trigger: "open order (dept=research) or missing research training asset for today",
    nextAction: "Generate research_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "QAA",
    name: "QA Producer",
    role: "production-qa",
    watch: "Client orders routed to qa + daily qa mission slot + needs_rework flags",
    trigger: "open order (dept=qa), missing qa training asset for today, or revision job pending",
    nextAction: "Generate qa_asset / regenerate flagged assets with feedback \u2192 daily_review"
  },
  {
    id: "LEA",
    name: "Dyrektor Wzrostu (Lead Engine)",
    role: "lead-engine",
    watch: "Lead threads: incoming lead messages + qualification gaps (problem/bud\u017Cet/decydent)",
    trigger: "new lead message recorded, operator redraft request, or proposal request",
    nextAction: "Draft persona-styled reply/proposal \u2192 operator reviews, edits, and sends manually"
  }
];
function getAgent(id) {
  const agent = AGENT_REGISTRY.find((a) => a.id === id);
  if (!agent) throw new Error(`Agent ${id} not in registry`);
  return agent;
}
function validateRegistry() {
  const errors = [];
  for (const agent of AGENT_REGISTRY) {
    if (!agent.watch.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing watch`);
    if (!agent.trigger.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing trigger`);
    if (!agent.nextAction.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing nextAction`);
  }
  return { ok: errors.length === 0, errors };
}

// packages/factory-core/src/agents.ts
import { randomUUID } from "node:crypto";
var CATEGORY_KEYWORDS = {
  "outbound-offer": ["offer", "pitch", "outreach", "prospect", "lead", "client", "sales", "revenue", "deal"],
  "product-strategy": ["strategy", "roadmap", "vision", "direction", "positioning", "market"],
  "operations": ["process", "ops", "workflow", "efficiency", "automation", "system"],
  "hiring": ["hire", "recruit", "team", "headcount", "talent", "engineer"]
};
function categorise(raw) {
  const lower = raw.toLowerCase();
  let best = "general";
  let bestCount = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = kws.filter((k) => lower.includes(k)).length;
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }
  return best;
}
var ICP_SIGNALS = ["b2b", "saas", "founder", "seed", "series a", "revenue", "mrr", "arr", "churn", "pipeline", "sales"];
function agentA(signal) {
  const raw = signal.raw;
  const lower = raw.toLowerCase();
  const icpSignals = ICP_SIGNALS.filter((s) => lower.includes(s));
  return {
    signalId: signal.id,
    category: categorise(raw),
    icpSignals,
    enrichedContext: `Signal received: "${raw.slice(0, 200)}". Category: ${categorise(raw)}. ICP signals found: ${icpSignals.length > 0 ? icpSignals.join(", ") : "none"}.`,
    agentId: "A"
  };
}
var ICP_SCORE_WEIGHTS = [
  { keywords: ["founder", "ceo", "cto", "co-founder"], weight: 0.3 },
  { keywords: ["saas", "b2b", "software"], weight: 0.25 },
  { keywords: ["seed", "series a", "early stage", "startup"], weight: 0.25 },
  { keywords: ["revenue", "mrr", "arr", "sales", "pipeline", "churn"], weight: 0.2 }
];
function agentB(brief) {
  const text = (brief.enrichedContext + " " + brief.icpSignals.join(" ")).toLowerCase();
  let score = 0;
  const reasons = [];
  for (const { keywords, weight } of ICP_SCORE_WEIGHTS) {
    const hit = keywords.find((k) => text.includes(k));
    if (hit) {
      score += weight;
      reasons.push(`+${weight.toFixed(2)}: matched "${hit}"`);
    }
  }
  const qualified = score >= 0.5;
  if (!qualified) reasons.push("Below 0.5 fit threshold \u2014 does not match Seed-stage B2B SaaS ICP");
  return {
    signalId: brief.signalId,
    brief,
    fitScore: Math.round(score * 100) / 100,
    qualified,
    qualificationReasons: reasons,
    agentId: "B"
  };
}
function agentC(lead) {
  const signals = lead.brief.icpSignals;
  const targetBuyer = signals.includes("founder") || signals.includes("ceo") ? "Founder / CEO" : signals.includes("cto") ? "CTO / Head of Product" : "Senior Decision-Maker";
  const painContext = signals.includes("churn") ? "High churn signal \u2014 likely experiencing retention problems." : signals.includes("pipeline") || signals.includes("sales") ? "Weak or uncertain pipeline \u2014 likely needs outbound leverage." : "General growth pressure at early stage.";
  return {
    signalId: lead.signalId,
    lead,
    enrichedNotes: `${painContext} Fit score: ${lead.fitScore}. ICP signals: ${signals.join(", ") || "general"}.`,
    targetBuyer,
    agentId: "C"
  };
}
function agentD(enriched) {
  const kpis = ["offer clarity", "price justification", "margin sustainability", "call to action"];
  const constraints = ["2-week delivery", "fixed scope", "no auto-send"];
  const positioning = enriched.lead.brief.category === "outbound-offer" ? "Direct outbound: short sprint, clear ROI, one-page offer" : "Consultative: problem-first framing, proof-of-concept offer";
  return {
    signalId: enriched.signalId,
    enrichedLead: enriched,
    icp: `Seed-stage B2B SaaS \u2014 buyer: ${enriched.targetBuyer}`,
    positioning,
    kpis,
    constraints,
    agentId: "D"
  };
}
var STUB_OFFER_TEMPLATE = (strategy, iteration) => {
  const edit = iteration > 1 ? " [Revised]" : "";
  return `Subject: 2-Week RevOps Sprint \u2014 Immediate Pipeline Impact${edit}

Hi [Name],

You're building in a space where pipeline velocity is everything. We've helped ${strategy.icp.split("\u2014")[0].trim()} founders add $50K\u2013$200K in pipeline within 14 days \u2014 without headcount.

Here's the sprint:${strategy.constraints.map((c) => `
\u2022 ${c}`).join("")}

Positioning: ${strategy.positioning}

The offer:
\u2022 Fixed-scope, 2-week engagement
\u2022 Pricing: \u20AC2,500\u2013\u20AC4,500 depending on scope
\u2022 Deliverables: One high-converting outbound sequence + offer teardown
\u2022 Guarantee: If we don't identify at least 3 qualified ICP contacts, you pay nothing for Week 2

${strategy.kpis.map((k) => `\u2713 ${k.charAt(0).toUpperCase() + k.slice(1)}`).join("\n")}

One question: Is your current offer landing with your ICP, or are you hearing "interesting but not now"?

[Operator to personalise before sending \u2014 auto-send is disabled]`;
};
function agentE(strategy, iteration = 1) {
  return {
    signalId: strategy.signalId,
    strategy,
    offerText: STUB_OFFER_TEMPLATE(strategy, iteration),
    iteration,
    agentId: "E"
  };
}
var EVAL_KPI_CHECKS = [
  { kpi: "offer clarity", check: (t) => t.includes("sprint") || t.includes("deliverable") || t.includes("scope") },
  { kpi: "price justification", check: (t) => /€[\d,]+|price|pricing|\$[\d,]+/.test(t) },
  { kpi: "margin sustainability", check: (t) => t.includes("fixed") || t.includes("scope") },
  { kpi: "call to action", check: (t) => t.includes("question") || t.includes("book") || t.includes("schedule") || t.includes("reply") || t.includes("landing") }
];
function agentF(draft) {
  const text = draft.offerText.toLowerCase();
  const failed = [];
  let passed = 0;
  for (const { kpi, check } of EVAL_KPI_CHECKS) {
    if (check(text)) {
      passed++;
    } else {
      failed.push(kpi);
    }
  }
  const score = Math.round(passed / EVAL_KPI_CHECKS.length * 100) / 100;
  return {
    signalId: draft.signalId,
    draft,
    score,
    passed: score >= 0.75,
    failureReasons: failed,
    agentId: "F"
  };
}
function agentG(scored) {
  const missing = scored.failureReasons;
  let revised = scored.draft.offerText;
  if (missing.includes("call to action")) {
    revised += "\n\nP.S. Reply with one word \u2014 'interested' \u2014 and I'll send the full sprint brief within 24h.";
  }
  if (missing.includes("price justification")) {
    revised = revised.replace(
      "The offer:",
      "The offer (investment justified by pipeline return \u2014 see ROI model below):"
    );
  }
  return {
    signalId: scored.signalId,
    strategy: scored.draft.strategy,
    offerText: revised,
    iteration: scored.draft.iteration + 1,
    agentId: "E"
  };
}
function agentH(scored, signalId) {
  const final = {
    signalId,
    offerText: scored.draft.offerText,
    score: scored.score,
    iterations: scored.draft.iteration,
    agentId: scored.draft.iteration > 1 ? "G" : "E"
  };
  const item = {
    // Random id, not a module counter — a counter resets on restart and
    // collides with approval items already persisted in the store.
    id: `ai-${randomUUID().slice(0, 8)}`,
    signalId,
    finalOffer: final,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    agentId: "H",
    sent: false
  };
  return { final, item };
}
function agentI(item) {
  return {
    id: `wi-${item.id}`,
    signalId: item.signalId,
    finalOffer: item.finalOffer,
    approvedAt: (/* @__PURE__ */ new Date()).toISOString(),
    qualityScore: item.finalOffer.score,
    agentId: "I",
    sent: false
  };
}

// packages/factory-core/src/pipeline.ts
import { randomUUID as randomUUID2 } from "node:crypto";
function evt(agentId, eventType, signalId, detail) {
  return {
    id: randomUUID2(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    agentId,
    eventType,
    signalId,
    detail
  };
}
async function runFactoryOnce(rawSignal, store2) {
  const validation = validateRegistry();
  if (!validation.ok) throw new Error(`Registry invalid: ${validation.errors.join("; ")}`);
  const signal = {
    id: `sig-${randomUUID2().slice(0, 8)}`,
    raw: rawSignal,
    submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "queued"
  };
  store2.addSignal(signal);
  const events = [];
  const log = (e) => {
    events.push(e);
    store2.addEvent(e);
  };
  store2.updateSignal(signal.id, { status: "processing" });
  const brief = agentA(signal);
  log(evt("A", "signal.intake_complete", signal.id, `category=${brief.category} icpSignals=${brief.icpSignals.length}`));
  const lead = agentB(brief);
  log(evt("B", lead.qualified ? "lead.qualified" : "lead.disqualified", signal.id, `fitScore=${lead.fitScore}`));
  if (!lead.qualified) {
    store2.addTrashItem({
      id: `trash-${randomUUID2().slice(0, 8)}`,
      signalId: signal.id,
      reason: `Disqualified by Agent B: ${lead.qualificationReasons.slice(-1)[0] ?? "below threshold"}`,
      trashedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    store2.updateSignal(signal.id, { status: "disqualified" });
    return { signal, brief, lead, status: "disqualified", events };
  }
  store2.addLead(lead);
  const enriched = agentC(lead);
  log(evt("C", "lead.enriched", signal.id, `buyer=${enriched.targetBuyer}`));
  const strategy = agentD(enriched);
  log(evt("D", "offer.strategy_set", signal.id, `positioning=${strategy.positioning.slice(0, 50)}`));
  const draft = agentE(strategy, 1);
  log(evt("E", "offer.drafted", signal.id, `iteration=1 length=${draft.offerText.length}`));
  let scored = agentF(draft);
  log(evt("F", scored.passed ? "offer.passed" : "offer.failed_eval", signal.id, `score=${scored.score}`));
  if (!scored.passed) {
    const revised = agentG(scored);
    log(evt("G", "offer.revised", signal.id, `iteration=${revised.iteration} failedKPIs=${scored.failureReasons.join(",")}`));
    const rescored = agentF(revised);
    log(evt("F", rescored.passed ? "offer.passed" : "offer.failed_after_edit", signal.id, `score=${rescored.score}`));
    if (!rescored.passed) {
      store2.addTrashItem({
        id: `trash-${randomUUID2().slice(0, 8)}`,
        signalId: signal.id,
        reason: `Offer failed evaluation after edit: ${rescored.failureReasons.join(", ")}`,
        trashedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      store2.updateSignal(signal.id, { status: "failed" });
      return { signal, brief, lead, enriched, strategy, draft, scored: rescored, status: "failed", events };
    }
    scored = rescored;
  }
  const { final, item } = agentH(scored, signal.id);
  store2.addApprovalItem(item);
  store2.updateSignal(signal.id, { status: "processed" });
  log(evt("H", "approval.required", signal.id, `approvalId=${item.id} score=${final.score}`));
  return { signal, brief, lead, enriched, strategy, draft, scored, final, approval: item, status: "awaiting_approval", events };
}
async function runOfferAcquisitionForSignal(rawSignal, store2) {
  return runFactoryOnce(rawSignal, store2);
}

// packages/factory-core/src/missions.ts
import { randomUUID as randomUUID4 } from "node:crypto";

// packages/factory-core/src/services.ts
var SERVICE_CATALOG = [
  {
    id: "svc-ai-workflow-audit",
    name: "AI Workflow Audit + Mini Demo",
    targetCustomer: "Small service businesses (5-50 people) drowning in manual lead/quote/follow-up work",
    promise: "In days, not months: a diagnosis of your messiest workflow plus a concrete mini demo of the AI-assisted version.",
    inputsRequired: ["Business description", "The workflow that hurts most", "Current tools (if any)", "Volume estimate (leads/quotes per week)"],
    expectedDeliverables: ["Problem summary", "Workflow diagnosis", "3 improvement opportunities", "Proposed mini demo", "Implementation plan", "Risks & safety notes"],
    defaultDepartment: "delivery",
    defaultTaskType: "workflow-audit",
    reviewSteps: ["Check diagnosis matches the client brief", "Verify the mini demo scope is deliverable", "Personalise the next client question"],
    safetyNotes: "Audit only \u2014 no system access, no data migration, no automation is switched on without a separate agreement."
  },
  {
    id: "svc-landing-audit",
    name: "Website / Landing Page Audit",
    targetCustomer: "Owners whose site gets traffic but not enquiries",
    promise: "A blunt, prioritised teardown of why visitors leave \u2014 and the quick wins that stop it.",
    inputsRequired: ["Site URL or page description", "Who the page should convert", "Primary conversion goal"],
    expectedDeliverables: ["First impression", "UX/friction issues", "Conversion issues", "AI opportunities", "Suggested sections", "Quick wins"],
    defaultDepartment: "marketing",
    defaultTaskType: "landing-audit",
    reviewSteps: ["Verify findings against the actual page", "Rank quick wins by effort/impact", "Remove any speculative claims"],
    safetyNotes: "Audit is based on operator-provided material only. No scraping, no logged-in access, no live edits."
  },
  {
    id: "svc-recruitment-ops-audit",
    name: "Recruitment / Agency Ops Workflow Audit",
    targetCustomer: "Recruitment and staffing agencies with candidate/client pipelines held together by spreadsheets",
    promise: "Map the candidate-to-placement pipeline, find the three biggest leaks, and propose the fix order.",
    inputsRequired: ["Agency size and niche", "Current pipeline stages", "Where placements are lost", "Tools in use"],
    expectedDeliverables: ["Pipeline map", "Leak diagnosis", "3 fixes ranked by impact", "Automation candidates", "Implementation plan", "Risks"],
    defaultDepartment: "research",
    defaultTaskType: "ops-audit",
    reviewSteps: ["Confirm pipeline stages with the client", "Sanity-check leak estimates", "Flag anything requiring candidate-data caution"],
    safetyNotes: "No candidate personal data enters the factory. Work is process-level only."
  },
  {
    id: "svc-client-dashboard",
    name: "Client Dashboard Concept",
    targetCustomer: "Service businesses that want one screen showing their pipeline, jobs, or client status",
    promise: "A concrete dashboard concept \u2014 components, data sources, and build order \u2014 ready for a build decision.",
    inputsRequired: ["What the owner needs to see daily", "Where the data lives today", "Who will use it"],
    expectedDeliverables: ["Dashboard goal", "Component plan", "Data source map", "Build order", "Effort estimate bands", "Risks"],
    defaultDepartment: "delivery",
    defaultTaskType: "dashboard-component-plan",
    reviewSteps: ["Check components map to stated daily questions", "Verify data sources exist", "Set expectation: concept, not build"],
    safetyNotes: "Concept only \u2014 no system integration and no data access in this service."
  },
  {
    id: "svc-social-pack",
    name: "Social Content / Carousel Pack",
    targetCustomer: "Founders who should be posting but never have material ready",
    promise: "A ready-to-personalise carousel pack: angle, slide-by-slide copy, caption, and hashtags.",
    inputsRequired: ["Topic or offer to promote", "Audience", "Tone (expert / friendly / provocative)"],
    expectedDeliverables: ["Post angle", "Carousel outline", "Slide-by-slide copy", "Caption", "Hashtags"],
    defaultDepartment: "marketing",
    defaultTaskType: "carousel-outline",
    reviewSteps: ["Personalise examples and numbers", "Check tone matches the client", "Operator publishes manually \u2014 never the factory"],
    safetyNotes: "The factory never publishes. The pack is copy for the operator/client to post themselves."
  },
  {
    id: "svc-automation-blueprint",
    name: "Process Automation Blueprint",
    targetCustomer: "Businesses with one repetitive process eating hours every week",
    promise: "A step-by-step blueprint for automating one named process, with tool choices and a safe rollout order.",
    inputsRequired: ["The process, step by step, as done today", "Weekly hours it consumes", "Tools already paid for"],
    expectedDeliverables: ["Process map", "Automation candidates", "Tool recommendation", "Rollout plan", "Human-in-the-loop points", "Risks"],
    defaultDepartment: "delivery",
    defaultTaskType: "automation-blueprint",
    reviewSteps: ["Verify every automated step keeps a human checkpoint where money or clients are touched", "Check tool costs are current"],
    safetyNotes: "Blueprint only. Nothing is connected or executed. Human approval points are mandatory in the design."
  }
];
function getServiceDefinition(id) {
  return SERVICE_CATALOG.find((s) => s.id === id);
}
function isValidServiceId(id) {
  return SERVICE_CATALOG.some((s) => s.id === id);
}
function extractFocus(text) {
  const m = text.toLowerCase().match(/(?:we|i)\s+(?:install|maintain|run|sell|build|provide|offer)\s+([^.,;]{3,60})/);
  return m?.[1]?.trim() ?? "your core service";
}
var langNote = (o) => o.language === "PL" ? "\n\n[Operator note: client language is PL \u2014 translate before delivery.]" : "";
var SECTIONS_BY_SERVICE = {
  "svc-ai-workflow-audit": [
    ["Problem Summary", (o) => `${o.clientName} \u2014 ${extractFocus(o.description)}. Stated pain: "${o.description.slice(0, 220)}". The core problem class: manual coordination work (leads, quotes, follow-ups) that scales with headcount instead of tooling.`],
    ["Workflow Diagnosis", (o) => `Current flow (reconstructed from brief \u2014 operator: confirm on the call):
1. Inbound lead arrives (phone/email/form) \u2192 captured manually or not at all
2. Quote prepared ad hoc \u2192 no standard template, no follow-up trigger
3. Follow-up depends on someone remembering \u2192 leads decay silently
4. Recurring work (${extractFocus(o.description)}) has no renewal/objection playbook
Bottleneck: steps 2\u20133. Every lost follow-up is a silent revenue leak.`],
    ["3 Improvement Opportunities", () => `1. Lead intake normalisation \u2014 one form/inbox route, auto-logged, nothing lost (effort: LOW, impact: HIGH)
2. Quote follow-up sequence \u2014 3-touch template triggered by "quote sent" (effort: LOW, impact: HIGH)
3. Objection playbook for renewals/maintenance plans \u2014 standard answers for the top 5 objections (effort: MEDIUM, impact: MEDIUM)`],
    ["Proposed Mini Demo", (o) => `A 1-screen demo for ${o.clientName}: paste an inbound enquiry \u2192 the assistant drafts (a) a qualification reply, (b) a quote checklist, (c) the day-3 follow-up. All drafts land in a review box \u2014 a human sends them. Nothing is sent automatically.`],
    ["Implementation Plan", () => `Week 1: intake route + quote template + follow-up sequence drafts
Week 2: objection playbook + mini demo walkthrough + handoff
Operator checkpoints: end of each week. No system goes live without sign-off.`],
    ["Risks & Safety Notes", () => `- No client data leaves the client's systems during the audit
- All AI drafts are review-gated; a human sends every message
- If current volume is under ~10 leads/week, automation ROI is marginal \u2014 say so honestly`],
    ["Next Client Question", (o) => `"Walk me through the last quote you lost \u2014 where exactly did the follow-up stop?"${langNote(o)}`]
  ],
  "svc-landing-audit": [
    ["First Impression", (o) => `Based on the brief for ${o.clientName}: "${o.description.slice(0, 180)}". First-5-seconds test: can a visitor tell WHO this is for, WHAT they get, and WHY trust it? Operator: verify against the live page before delivery.`],
    ["UX / Friction Issues", () => `Checklist applied:
- Above-the-fold headline: outcome-led or feature-led?
- Primary CTA visible without scrolling?
- Mobile: tap targets, load weight, form length
- Navigation: does it leak visitors away from the conversion path?`],
    ["Conversion Issues", () => `- One page, one goal: count the competing CTAs
- Proof: real testimonials/numbers vs decorative logos
- Risk reversal: guarantee, free step, or nothing?
- Form friction: every extra field costs conversions`],
    ["AI Opportunities", () => `- Instant-answer widget for the top 5 pre-sale questions (review-gated content)
- Personalised headline variants per traffic source
- Enquiry summarisation so the owner answers in one minute`],
    ["Suggested Sections", () => `1. Outcome headline + subline
2. Pain mirror (3 bullets in the visitor's words)
3. Offer with concrete scope
4. Proof
5. Simple 3-step "how it works"
6. Risk reversal + single CTA`],
    ["Quick Wins", (o) => `Ranked by effort/impact for ${o.clientName}:
1. Rewrite headline to outcome (1h)
2. Cut form to 3 fields (1h)
3. Move one real proof element above the fold (2h)${langNote(o)}`]
  ],
  "svc-recruitment-ops-audit": [
    ["Pipeline Map", (o) => `Reconstructed for ${o.clientName} from brief: sourcing \u2192 screening \u2192 client submission \u2192 interview loop \u2192 offer \u2192 placement \u2192 aftercare. Brief: "${o.description.slice(0, 180)}". Operator: confirm stage names with the client.`],
    ["Leak Diagnosis", () => `Typical leak points to verify:
1. Screening\u2192submission lag (candidates go cold in 48h)
2. No structured client feedback loop after submission
3. Aftercare ignored \u2192 refunds/replacements eat margin`],
    ["3 Fixes Ranked by Impact", () => `1. 24h submission SLA with a daily "aging candidates" list (HIGH)
2. Feedback template sent with every submission (MEDIUM)
3. Day-7/30/80 aftercare check-ins, templated (MEDIUM)`],
    ["Automation Candidates", () => `- Aging-pipeline digest (internal report, no external send)
- Interview scheduling links
- Aftercare reminder drafts \u2014 human sends every one`],
    ["Implementation Plan", () => `Week 1: pipeline stages + SLA report. Week 2: templates + reminders. Candidate personal data stays in the agency's ATS \u2014 the factory works at process level only.`],
    ["Risks", (o) => `- GDPR: no candidate data enters this system
- SLA pressure can hurt quality \u2014 pair with a screening checklist${langNote(o)}`]
  ],
  "svc-client-dashboard": [
    ["Dashboard Goal", (o) => `${o.clientName} needs one screen answering the owner's daily questions. Brief: "${o.description.slice(0, 180)}".`],
    ["Component Plan", () => `1. Pipeline funnel (counts + conversion per stage)
2. This-week jobs/deadlines list
3. Money row: quoted / won / invoiced / overdue
4. Alerts: items stuck > N days
5. Activity log (latest 20 events)`],
    ["Data Source Map", () => `Per component: where the data lives today (spreadsheet / inbox / tool), who updates it, and the single source of truth chosen for v1. Operator fills specifics after the discovery call.`],
    ["Build Order", () => `v1: pipeline funnel + stuck alerts (highest decision value)
v2: money row
v3: activity log + weekly digest`],
    ["Effort Estimate Bands", () => `v1: days, not weeks, if data source is one spreadsheet. Integration with a real CRM moves it to weeks. Bands, not promises \u2014 refine after discovery.`],
    ["Risks", (o) => `- Garbage-in: dashboard is only as honest as the source data
- Concept only: nothing is connected in this service${langNote(o)}`]
  ],
  "svc-social-pack": [
    ["Post Angle", (o) => `For ${o.clientName}: "${o.description.slice(0, 160)}". Angle: the specific, unglamorous mistake the audience makes daily \u2014 named plainly, then fixed.`],
    ["Carousel Outline", () => `S1 Hook (the mistake, in the audience's words)
S2 Why it keeps happening
S3-5 The fix in 3 concrete steps
S6 Proof or example
S7 CTA: one small action today`],
    ["Slide-by-Slide Copy", (o) => `S1: "You're losing ${extractFocus(o.description)} money in a place you never look."
S2: "Not because you're lazy \u2014 because nobody owns the follow-up."
S3: "Step 1: write down where the last 5 deals died."
S4: "Step 2: one template for the day-3 follow-up."
S5: "Step 3: one owner, one daily 10-minute review."
S6: "[Operator: insert client's real number/example here]"
S7: "Do step 1 today. It takes 15 minutes."`],
    ["Caption", () => `Most businesses don't have a leads problem \u2014 they have a follow-up problem. 3 steps that cost nothing, in the carousel. Which step is missing in your business?`],
    ["Hashtags", (o) => `#smallbusiness #workflow #followup #sales [operator: add 3 niche tags]${langNote(o)}

[SAFETY: the factory never posts. This pack is copy for manual publishing.]`]
  ],
  "svc-automation-blueprint": [
    ["Process Map", (o) => `Process as described by ${o.clientName}: "${o.description.slice(0, 220)}". Operator: number the steps with the client and mark who touches each one.`],
    ["Automation Candidates", () => `For each step: AUTOMATE (mechanical, no judgment) / ASSIST (AI drafts, human decides) / KEEP HUMAN (money, clients, exceptions). Default to ASSIST wherever a client can see the output.`],
    ["Tool Recommendation", () => `Prefer tools already paid for. Otherwise: one workflow tool + one AI-drafting step + one review inbox. Name concrete tools only after confirming current stack \u2014 no hidden subscriptions.`],
    ["Rollout Plan", () => `Phase 1: shadow mode \u2014 automation drafts, human does the work as before, compare
Phase 2: assist mode \u2014 human approves each output
Phase 3: automate only the steps that survived 2 weeks of review with zero corrections`],
    ["Human-in-the-Loop Points", () => `Mandatory checkpoints: anything sent to a client, anything touching money, anything irreversible. These are design constraints, not suggestions.`],
    ["Risks", (o) => `- Automating a broken process makes it break faster \u2014 fix the process first
- Key-person risk: document the workflow so it survives staff changes${langNote(o)}`]
  ]
};
function buildServiceContent(service, order, constraints = []) {
  const sections = SECTIONS_BY_SERVICE[service.id];
  if (!sections) throw new Error(`No content builder for service ${service.id}`);
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const header = constraints.length > 0 ? `PRODUCTION CONSTRAINTS (operator/client input):
${constraints.map((c) => `\u2022 ${c}`).join("\n")}

` : "";
  const body = header + sections.map(([h, fn]) => `\u2501\u2501 ${h} \u2501\u2501

${fn(order)}`).join("\n\n");
  const packDraft = `\u2501\u2501 Delivery Pack Draft \u2501\u2501

Client: ${order.clientName}
Service: ${service.name}
Date: ${date}
Promise: ${service.promise}
Deliverables covered: ${service.expectedDeliverables.join("; ")}
Review before delivery: ${service.reviewSteps.join(" \u2192 ")}
Safety: ${service.safetyNotes}`;
  return {
    title: `${service.name} \u2014 ${order.clientName} \u2014 ${date}`,
    content: `SERVICE: ${service.name}
CLIENT: ${order.clientName}
URGENCY: ${order.urgency ?? "normal"} \xB7 LANGUAGE: ${order.language ?? "EN"}

${body}

${packDraft}`
  };
}

// packages/factory-core/src/integrity.ts
import { randomUUID as randomUUID3 } from "node:crypto";

// packages/integrity-guard/src/drift-sensor.ts
function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
function stdDev(values) {
  const m = mean(values);
  return Math.sqrt(values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length);
}
var DriftSensor = class {
  baselineMean;
  baselineStd;
  constructor(baselineData) {
    if (baselineData.length === 0) {
      throw new Error("DriftSensor requires a non-empty baseline");
    }
    this.baselineMean = mean(baselineData);
    const std = stdDev(baselineData);
    this.baselineStd = std === 0 ? 1 : std;
  }
  /** Z-score of the current window against the baseline. 0 for an empty window. */
  calculateDrift(currentData) {
    if (currentData.length === 0) return 0;
    return Math.abs(mean(currentData) - this.baselineMean) / this.baselineStd;
  }
};

// packages/integrity-guard/src/pinocchio-nose.ts
var clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
var PinocchioNose = class {
  #noseLength;
  criticalLimit;
  constructor(opts = {}) {
    this.criticalLimit = Math.max(1, Math.min(100, opts.criticalLimit ?? 80));
    this.#noseLength = clamp(opts.initialLength ?? 0);
  }
  get noseLength() {
    return this.#noseLength;
  }
  /** Spec mode: nose = min(100, round(drift × 20)). Returns true when breached. */
  setFromDrift(driftScore) {
    this.#noseLength = clamp(driftScore * 20);
    return this.isBreached();
  }
  /** Cumulative mode: add centimeters. Returns true when breached. */
  grow(cm) {
    this.#noseLength = clamp(this.#noseLength + Math.abs(cm));
    return this.isBreached();
  }
  /** Truth heals: shrink the nose (never below 0). */
  shrink(cm) {
    this.#noseLength = clamp(this.#noseLength - Math.abs(cm));
  }
  isBreached() {
    return this.#noseLength >= this.criticalLimit;
  }
};

// packages/integrity-guard/src/hrar-protocol.ts
var HRARProtocol = class {
  #cleanup;
  #exitProcess;
  constructor(opts = {}) {
    if (opts.cleanup) this.#cleanup = opts.cleanup;
    this.#exitProcess = opts.exitProcess ?? false;
  }
  async execute(finalNoseLength) {
    const report = {
      executedAt: (/* @__PURE__ */ new Date()).toISOString(),
      finalNoseLength,
      cleanupRan: false,
      processExitRequested: this.#exitProcess
    };
    if (this.#cleanup) {
      try {
        await this.#cleanup();
        report.cleanupRan = true;
      } catch (err) {
        report.cleanupError = err instanceof Error ? err.message : String(err);
      }
    }
    if (this.#exitProcess) {
      process.exit(1);
    }
    return report;
  }
};

// packages/factory-core/src/integrity.ts
var INTEGRITY_LIMITS = {
  critical: 80,
  // nose ≥ 80 → HRAR (quarantine)
  watch: 40,
  // nose ≥ 40 → watch status
  growRejected: 25,
  growRework: 12,
  growQualityCap: 15,
  shrinkAccepted: 10
};
var QUALITY_BASELINE = [0.8, 0.85, 0.9, 0.85, 0.8];
var qualitySensor = new DriftSensor(QUALITY_BASELINE);
var PRODUCER_AGENTS = ["MA", "SA", "DA", "RA", "QAA"];
var INTEGRITY_RESET_REASONS = [
  "false_positive",
  "retrained",
  "accepted_risk",
  "operator_override",
  "other"
];
function isValidResetReason(value) {
  return INTEGRITY_RESET_REASONS.includes(value);
}
function freshRecord(agentId) {
  return { agentId, noseLength: 0, status: "healthy", breaches: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
function getIntegrityRecords(store2) {
  return PRODUCER_AGENTS.map((id) => store2.getIntegrityRecord(id) ?? freshRecord(id));
}
function isAgentQuarantined(store2, agentId) {
  return store2.getIntegrityRecord(agentId)?.status === "quarantined";
}
function statusFor(nose, wasQuarantined) {
  if (wasQuarantined) return "quarantined";
  if (nose.isBreached()) return "quarantined";
  if (nose.noseLength >= INTEGRITY_LIMITS.watch) return "watch";
  return "healthy";
}
async function applyDelta(store2, agentId, deltaCm, signal) {
  const prev = store2.getIntegrityRecord(agentId) ?? freshRecord(agentId);
  const nose = new PinocchioNose({
    criticalLimit: INTEGRITY_LIMITS.critical,
    initialLength: prev.noseLength
  });
  if (deltaCm >= 0) nose.grow(deltaCm);
  else nose.shrink(-deltaCm);
  const wasQuarantined = prev.status === "quarantined";
  const breachedNow = !wasQuarantined && nose.isBreached();
  const next = {
    agentId,
    noseLength: nose.noseLength,
    status: statusFor(nose, wasQuarantined),
    breaches: prev.breaches + (breachedNow ? 1 : 0),
    lastSignal: signal,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  store2.upsertIntegrityRecord(next);
  if (breachedNow) {
    const protocol = new HRARProtocol({
      cleanup: () => {
        store2.addEvent({
          id: randomUUID3(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          agentId,
          eventType: "integrity.quarantine",
          detail: `HRAR: nose ${nose.noseLength}cm \u2265 ${INTEGRITY_LIMITS.critical} \u2014 ${agentId} quarantined from client production (training still allowed). Cause: ${signal}. Operator reset (with reason) required.`
        });
      },
      exitProcess: false
    });
    await protocol.execute(nose.noseLength);
  }
  return next;
}
async function recordOperatorIntegritySignal(store2, agentId, action, itemId) {
  const delta = action === "rejected" ? INTEGRITY_LIMITS.growRejected : action === "needs_rework" ? INTEGRITY_LIMITS.growRework : -INTEGRITY_LIMITS.shrinkAccepted;
  return applyDelta(store2, agentId, delta, `operator ${action} on ${itemId}`);
}
async function recordQualityIntegritySignal(store2, agentId, qualityScore, itemId) {
  if (qualityScore >= qualitySensor.baselineMean) return void 0;
  const drift = qualitySensor.calculateDrift([qualityScore]);
  const grow = Math.min(INTEGRITY_LIMITS.growQualityCap, Math.round(drift * 2));
  if (grow <= 0) return void 0;
  return applyDelta(store2, agentId, grow, `quality ${qualityScore} below baseline on ${itemId} (drift ${drift.toFixed(1)})`);
}
function resetAgentIntegrity(store2, agentId, reason, note) {
  const prev = store2.getIntegrityRecord(agentId);
  if (!prev || prev.noseLength === 0 && prev.status === "healthy") return void 0;
  const previousNose = prev.noseLength;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const next = {
    agentId,
    noseLength: 0,
    status: "healthy",
    breaches: prev.breaches,
    // breach history is never erased by a reset
    lastSignal: `operator reset (${reason})`,
    updatedAt: now
  };
  store2.upsertIntegrityRecord(next);
  store2.addEvent({
    id: randomUUID3(),
    timestamp: now,
    agentId,
    eventType: "integrity.reset",
    detail: `Operator reset ${agentId} integrity (was ${prev.status}, nose ${previousNose}cm \u2192 0cm). Reason: ${reason}.${note ? ` Note: ${note}.` : ""} Breach history preserved (${prev.breaches} total). Client production re-enabled. Reset by: operator (God Layer).`
  });
  return next;
}

// packages/factory-core/src/missions.ts
var ICP = "Seed-stage B2B SaaS founders (10\u201350 employees)";
var PRODUCT = "Fractional RevOps sprint \u2014 2 weeks, fixed scope, \u20AC2,500\u2013\u20AC4,500";
var TASK_TYPES = {
  marketing: ["ad-pack", "hook-set", "carousel-outline", "landing-section", "campaign-angle"],
  sales: ["pitch-pack", "objection-map", "follow-up-script", "qualification-questions", "offer-draft-template"],
  delivery: ["demo-block", "onboarding-checklist", "landing-template", "dashboard-component-plan", "repo-task-draft"],
  research: ["lead-source-list", "niche-research", "keyword-set", "opportunity-map", "audience-list"],
  qa: ["qa-report", "cleanup-report", "agent-improvement-report", "weak-asset-review", "next-day-plan"]
};
var DEPT_AGENT = {
  marketing: "MA",
  sales: "SA",
  delivery: "DA",
  research: "RA",
  qa: "QAA"
};
var SAAS_NICHES = [
  "HR tech for small teams",
  "Vertical SaaS for professional services",
  "Sales automation for B2B SMBs",
  "Analytics for e-commerce founders",
  "Project management for agencies",
  "Billing and subscription management",
  "Compliance tech for regulated industries",
  "Customer success platforms",
  "Pricing and packaging optimisation",
  "Revenue intelligence and forecasting"
];
function dayOfYear(date) {
  const d = new Date(date);
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5);
}
function selectTaskType(dept) {
  const list = TASK_TYPES[dept];
  return list[Math.floor(Math.random() * list.length)];
}
function constraintHeader(constraints) {
  if (constraints.length === 0) return "";
  return `PRODUCTION CONSTRAINTS (operator/client input):
${constraints.map((c) => `\u2022 ${c}`).join("\n")}

`;
}
function extractNicheFocus(constraints) {
  const text = constraints.join(" ").toLowerCase();
  const m = text.match(/for\s+([a-z][a-z\s]+?)(?:\s+companies|\s+firms|\s+businesses|\s+founders|[.,]|$)/);
  return m?.[1]?.trim() ?? "";
}
function scoreContent(content, constraints) {
  let s = 0;
  if (content.length > 800) s += 0.3;
  else if (content.length > 400) s += 0.2;
  else if (content.length > 150) s += 0.1;
  if (content.includes("\n\n")) s += 0.1;
  if (/[0-9]/.test(content)) s += 0.1;
  if (content.split("\n").some((l) => /^[-•*]/.test(l.trim()))) s += 0.1;
  if (/€[\d,]+|\$[\d,]+/.test(content)) s += 0.1;
  if (/\d+%|\d+[\s-](day|week|hour|minute)/.test(content)) s += 0.1;
  if (constraints.length === 0) {
    s += 0.2;
  } else {
    const lower = content.toLowerCase();
    const hit = constraints.filter((c) => c.split(/\s+/).some((w) => w.length > 4 && lower.includes(w.toLowerCase())));
    s += hit.length / constraints.length * 0.2;
  }
  return Math.min(Math.round(s * 100) / 100, 1);
}
function marketing(taskType, date, constraints) {
  const niche = extractNicheFocus(constraints) || "seed-stage SaaS";
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "hook-set":
      return {
        title: `Hook Set \u2014 ${date} \u2014 Outbound + LinkedIn`,
        content: ch + `HOOK SET \u2014 10 Angles for ${ICP}
Product: ${PRODUCT}

A/B Test Group 1 \u2014 Pain-first:
\u2022 "Your pipeline is a leaky bucket. Here's the 2-week fix."
\u2022 "At $30K MRR, your pipeline isn't failing. Your offer is."
\u2022 "Most ${niche} founders have the same problem: weak pipeline, wrong offer."

A/B Test Group 2 \u2014 Specificity:
\u2022 "How we added $50K pipeline for a founder just like you \u2014 in 14 days."
\u2022 "3 qualified calls in 2 weeks. No SDR. No ad spend. Fixed scope."
\u2022 "\u20AC2,500 sprint \u2192 3\u20135 intro meetings. Here's the breakdown."

A/B Test Group 3 \u2014 Curiosity:
\u2022 "One question that diagnoses your whole outbound problem."
\u2022 "Skip the SDR hire. This sprint does the same job for 1/10th the cost."
\u2022 "Your ICP reads your offer in 4 seconds. What do they feel?"
\u2022 "We had a founder triple her booked calls in 14 days. She changed one thing."

Usage notes:
- Test 1 hook per channel per week
- LinkedIn: use Group 2 (specificity wins in feed)
- Cold email subject: Group 3 (curiosity drives opens)
- Never use all 3 groups at once \u2014 isolate variables
- Operator: replace [placeholder numbers] with real case data when available`
      };
    case "carousel-outline":
      return {
        title: `LinkedIn Carousel \u2014 ${date} \u2014 Pipeline Sprint`,
        content: ch + `LINKEDIN CAROUSEL \u2014 6 Frames
Topic: "Why Your Pipeline Stalls at $30K MRR (and One Sprint That Fixes It)"
Target: ${ICP}

Frame 1 \u2014 Hook (must stop the scroll):
Headline: "Your pipeline didn't die. Your offer did."
Visual: Bold text, dark background. No stock photos.
CTA: "Swipe to see the exact problem \u2192"

Frame 2 \u2014 Problem (be specific):
Headline: "At seed stage, founders make 3 outbound mistakes:"
Body:
\u2022 Generic ICP: "B2B companies with 10\u2013100 employees" (too wide)
\u2022 Weak offer: features, not outcomes
\u2022 Wrong channel: LinkedIn DMs without warm intent
Visual: 3-item list, numbered

Frame 3 \u2014 Agitation (make it real):
Headline: "Result: you're getting replies but no meetings."
Body: "Or worse \u2014 silence. Your product is working. Your offer isn't landing."
Visual: Silence emoji / unread DM mockup concept

Frame 4 \u2014 Solution (concrete, not fluffy):
Headline: "A 2-week RevOps sprint rebuilds the offer and the outreach."
Body:
\u2022 Week 1: ICP audit + one high-converting offer
\u2022 Week 2: Test with real prospects + book 3\u20135 calls
\u2022 Fixed scope. Fixed price. One decision.

Frame 5 \u2014 Proof placeholder:
Headline: "[Operator: insert one founder result here]"
Body: "'We booked X calls in Y days.' \u2014 Name, Company"
Note: Leave blank until real case study is ready. Do not fabricate.

Frame 6 \u2014 CTA:
Headline: "One question: Is your current offer landing?"
Body: "DM me the word 'offer' and I'll tell you exactly what's wrong \u2014 in 24h."
Visual: Clean, single CTA button concept`
      };
    case "landing-section":
      return {
        title: `Landing Section \u2014 ${date} \u2014 Hero + Benefits`,
        content: ch + `LANDING PAGE \u2014 Above the Fold + Benefit Section
Product: ${PRODUCT}
ICP: ${ICP}

\u2501\u2501 HERO SECTION \u2501\u2501

H1: "Turn Your Pipeline From Leaky to Loaded \u2014 in 14 Days"
Subhead: "A fixed-scope RevOps sprint that builds one high-converting offer, tests it with your exact ICP, and books 3\u20135 qualified intro meetings. \u20AC2,500\u2013\u20AC4,500. No retainer."

Primary CTA: "Book Your Pipeline Audit (Free, 20 min)"
Secondary CTA: "See how it works \u2192"

Trust element: "Used by ${niche} founders at seed and pre-Series A"

\u2501\u2501 BENEFIT SECTION \u2501\u2501

What you get in 14 days:

1. ICP Audit
   Before we write a single word, we diagnose why your current outreach isn't landing.
   You get a written teardown with 3 concrete fixes.

2. One High-Converting Offer
   Not a deck. Not a brochure. One sharp, outcome-led offer your ICP actually reads.
   Built around their language, their pain, their buying trigger.

3. 3\u20135 Qualified Intro Meetings
   We test the offer with real prospects in your ICP. You get meetings booked.
   If we don't hit 3, Week 2 is free.

\u2501\u2501 PRICING BLOCK \u2501\u2501

Fixed Sprint: \u20AC2,500\u2013\u20AC4,500
- Week 1: Audit + offer build (\u20AC1,500\u2013\u20AC2,000)
- Week 2: Test + booking (\u20AC1,000\u2013\u20AC2,500)
- Add-on: Full outbound sequence (+\u20AC750)
- Add-on: LinkedIn content pack (+\u20AC500)

Guarantee: 3 qualified meetings or Week 2 free.

Note: Operator must approve all copy before publishing. Do not publish without review.`
      };
    case "campaign-angle":
      return {
        title: `Campaign Angle \u2014 ${date} \u2014 Q3 Positioning`,
        content: ch + `CAMPAIGN ANGLE \u2014 Strategic Concept
Quarter: Q3 / Audience: ${niche}
Product: ${PRODUCT}

ANGLE: "The Founder's Tipping Point"

Insight: Seed-stage founders hit a critical moment at $20K\u2013$40K MRR. They've proven the product works, but they can't scale pipeline without changing how they sell. This is the tipping point \u2014 and the window for a sprint offer.

Narrative arc:
1. Recognition: "You're not stuck. You're at the tipping point."
2. Tension: "At this stage, the old playbook (founder selling everything manually) stops scaling."
3. Solution: "One sprint resets your outbound. You don't need more volume. You need a better offer."
4. Proof: [operator inserts real case study]
5. Action: Book a 20-min audit

Channel plan:
\u2022 LinkedIn organic: 3 posts/week, founder-voice, story-driven
\u2022 Cold email: 30\u201350 new contacts/week, offer-led subject lines
\u2022 Retargeting: 30-day cookie, short copy, \u20AC15/day budget
\u2022 Referral: ask 3 existing clients for one intro

KPIs to track:
- Hook engagement rate (target > 3% on LinkedIn)
- Email open rate (target > 35%)
- Audit booking rate from landing page (target > 4%)
- Cost per booked call (target < \u20AC200)

Review this angle in 30 days. Adjust based on which channel converts.`
      };
    default:
      return {
        title: `Ad Pack \u2014 ${date} \u2014 Multi-Channel`,
        content: ch + `AD PACK \u2014 Multi-Channel
Target: ${ICP} / Niche focus: ${niche}
Product: ${PRODUCT}

\u2501\u2501 LINKEDIN SPONSORED \u2501\u2501

Headline: "14-Day Pipeline Sprint \u2014 Fixed Scope, Guaranteed Audit"
Body (150 chars): "SaaS founders: stop guessing why outreach fails. We audit your ICP + build one high-converting offer in 14 days. \u20AC2,500\u2013\u20AC4,500. 3 meetings or Week 2 is free."
CTA button: "Book Audit"
Targeting: Job title = Founder/CEO/Co-founder | Company size: 10\u201350 | Industry: Software/SaaS

\u2501\u2501 COLD EMAIL SUBJECT LINES (A/B) \u2501\u2501

A: "Your pipeline (quick question)"
B: "14 days to 3 qualified calls \u2014 founders only"
C: "Why your outreach isn't landing [and what fixes it]"

\u2501\u2501 RETARGETING SHORT COPY \u2501\u2501

"Still thinking about the pipeline sprint? Scope is limited to 3 founders per month. One spot left for ${new Date(date).toLocaleString("en", { month: "long" })}."

\u2501\u2501 FACEBOOK/INSTAGRAM (if tested) \u2501\u2501

Headline: "SaaS founder? Your offer might be the problem."
Body: "We've helped founders at $20K\u2013$50K MRR book 3\u20135 qualified calls in 14 days \u2014 without hiring an SDR. Fixed-scope sprint. Fixed price."
CTA: Learn More \u2192 [landing page]

\u2501\u2501 BUDGET GUIDANCE \u2501\u2501

LinkedIn: \u20AC20\u2013\u20AC40/day | CPL target: < \u20AC150
Retargeting: \u20AC15/day | CPL target: < \u20AC80
Cold email: No direct cost \u2014 tool cost only
Total monthly: \u20AC1,050\u2013\u20AC1,650 + operator time

Operator: All copy must be personalised before publishing. Budgets are estimates only.`
      };
  }
}
function sales(taskType, date, constraints) {
  const niche = extractNicheFocus(constraints) || "SaaS";
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "objection-map":
      return {
        title: `Objection Map \u2014 ${date} \u2014 RevOps Sprint`,
        content: ch + `OBJECTION MAP \u2014 8 Common Objections + Responses
Product: ${PRODUCT}

1. "Too expensive for where we are."
   Root cause: Price/value mismatch or wrong ICP
   Response: "What's one booked call worth to your business right now? If it's > \u20AC500, the math works. And we have a Week-2-free guarantee if we don't hit 3 calls."
   Escalation: Offer a paid 90-min ICP audit (\u20AC350) as a low-risk entry.

2. "We already have an SDR."
   Root cause: Perceived overlap
   Response: "Great. Is your SDR hitting quota consistently? This sprint isn't headcount \u2014 it's the offer your SDR sends. We make their work convert, not replace them."

3. "I need to think about it."
   Root cause: No urgency / no clarity
   Response: "Totally fair. What's the one thing you'd need to see to make this a yes?"
   Then: close on a specific next step, not just "follow up."

4. "We don't have the bandwidth right now."
   Root cause: Perceived complexity
   Response: "The sprint requires 2 hours of your time in Week 1 for the ICP interview. After that, we handle everything. Your job is to approve or reject what we produce."

5. "We'll do this ourselves."
   Root cause: Trust gap or cost sensitivity
   Response: "Absolutely. Most founders do \u2014 and it takes 3\u20134 months. If you want to move faster, this sprint compresses that into 14 days."

6. "Can you do it for less?"
   Root cause: Budget constraint or anchoring
   Response: "The fixed price reflects a fixed scope. If you reduce the scope, we reduce the price. What would you cut: the offer build or the testing week?"

7. "I don't have a list / contacts to test with."
   Root cause: Prospect doesn't understand the service
   Response: "That's exactly what we solve. We build the ICP list as part of Week 1. You don't need contacts before we start."

8. "How do I know this will work for ${niche}?"
   Root cause: Niche specificity concern
   Response: "The offer framework works across B2B verticals. We tailor the language to your ICP in Week 1. [Operator: add niche-specific case study here when available.]"`
      };
    case "follow-up-script":
      return {
        title: `Follow-Up Script \u2014 ${date} \u2014 3-Touch Sequence`,
        content: ch + `FOLLOW-UP SEQUENCE \u2014 3 Touches After First Contact
Context: Prospect expressed interest but hasn't booked / hasn't replied

\u2501\u2501 TOUCH 1 \u2014 Day 1\u20132 After First Contact \u2501\u2501

Subject: "Quick follow-up \u2014 pipeline sprint"
Body:
"Hi [Name],

Following up on my note about the RevOps sprint for ${niche} founders.

One question: is your current outreach producing qualified meetings, or are you getting polite replies that don't convert?

If it's the latter \u2014 that's fixable in 14 days. Happy to walk you through how.

[CTA: 10-min call this week?]"

\u2501\u2501 TOUCH 2 \u2014 Day 3\u20134 \u2501\u2501

Subject: "[Resource] Why offers fail at seed stage"
Body:
"Hi [Name],

Sharing something that's come up a lot with ${niche} founders I work with:

The offer isn't the problem. The framing is.

[Brief insight \u2014 2 sentences max. Make it specific to their situation if possible.]

Still happy to do the 20-min pipeline audit \u2014 no commitment. Want to grab 15 min this week?"

\u2501\u2501 TOUCH 3 \u2014 Day 7 (Breakup) \u2501\u2501

Subject: "Closing the loop"
Body:
"Hi [Name],

I don't want to keep your inbox busy if the timing isn't right.

If pipeline is something you're actively working on in the next 30 days, I'm here. If not, I'll reach back out next quarter.

Either way \u2014 good luck with the sprint."

Notes for operator:
- Never send Touch 3 without personalising
- If they reply at any point, switch to conversation mode immediately
- Track reply rate by touch; cut whichever touch underperforms`
      };
    case "qualification-questions":
      return {
        title: `Qualification Questions \u2014 ${date} \u2014 BANT + Pain`,
        content: ch + `QUALIFICATION FRAMEWORK \u2014 10 Questions
Context: First 20-min discovery call with ${niche} founder

\u2501\u2501 COMPANY CONTEXT (2 min) \u2501\u2501

1. "Walk me through where you are in the business \u2014 revenue, team size, how long you've been selling."
   \u2192 Listen for: $15K\u2013$60K MRR, 5\u201320 person team, 6\u201324 months post-launch

2. "Who's running outbound right now \u2014 you, a co-founder, someone you hired?"
   \u2192 Listen for: founder-led or early first hire (not a built-out SDR team)

\u2501\u2501 PAIN IDENTIFICATION (8 min) \u2501\u2501

3. "What's the pipeline situation looking like? Are you getting enough qualified conversations?"
   \u2192 Listen for: inconsistency, low conversion, reliance on warm network

4. "When you reach out to a prospect today, what does your offer look like?"
   \u2192 Listen for: generic pitch, feature-led copy, no clear outcome statement

5. "How long does it typically take from first contact to a booked call?"
   \u2192 Listen for: > 2 weeks = offer/outreach problem; no answer = no system

6. "What have you tried to fix this already?"
   \u2192 Listen for: ad spend, SDR hire, content \u2014 shows sophistication level

7. "What happens if pipeline stays at this level for another 90 days?"
   \u2192 Listen for: real urgency vs nice-to-have

\u2501\u2501 AUTHORITY + TIMING (5 min) \u2501\u2501

8. "If we ran the sprint and you loved the result, who else would need to sign off on continuing to work together?"
   \u2192 Listen for: solo decision or investor/board veto

9. "What does your timeline look like? When would you want to start seeing results?"
   \u2192 Listen for: within 30 days = high intent; "eventually" = nurture sequence

10. "What would make this a clear yes for you?"
    \u2192 Unblocks the real objection if they haven't stated it

Notes: Score each answer 1\u20133. Total \u2265 22 = strong qualified lead. Total < 15 = nurture.`
      };
    case "offer-draft-template":
      return {
        title: `Offer Draft Template \u2014 ${date} \u2014 Fill-In Version`,
        content: ch + `OFFER DRAFT TEMPLATE \u2014 Fractional RevOps Sprint
Operator: fill in [brackets], remove instruction notes before sending

\u2501\u2501 SUBJECT \u2501\u2501
"[Outcome in 8 words or fewer] \u2014 [timeframe]"
Example: "3 qualified calls in 14 days \u2014 [Niche] founders"

\u2501\u2501 OPENING (1\u20132 sentences) \u2501\u2501
"[Name], [observation about their specific situation based on research].
I work with ${niche} founders who [shared pain point] \u2014 and there's a specific fix that works in 2 weeks."

\u2501\u2501 OFFER BLOCK \u2501\u2501
Here's what I'm proposing:

\u2022 Week 1: ICP audit + one high-converting offer built for your exact buyer
\u2022 Week 2: Test with [X] prospects from your ICP + [Y] booked intro calls

Investment: \u20AC[amount] fixed. No retainer. No bloat.
[Add: guarantee statement if applicable]

\u2501\u2501 SOCIAL PROOF \u2501\u2501
"[Case study or founder quote \u2014 operator must provide. Do not fabricate.]"

\u2501\u2501 CTA \u2501\u2501
"One question: [specific question relevant to their situation]?
If yes \u2014 [clear next step, e.g., 'I have 15 min on Thursday at 2pm CET']."

\u2501\u2501 P.S. \u2501\u2501
"[Relevant detail that shows you did research on them \u2014 company news, a post they wrote, a product update.]"

\u2501\u2501 SCORING CHECKLIST \u2501\u2501
Before sending, confirm:
\u25A1 ICP match: Yes / No
\u25A1 Real pain stated (not assumed): Yes / No
\u25A1 Specific outcome promised: Yes / No
\u25A1 Price clear: Yes / No
\u25A1 CTA has one specific action: Yes / No
\u25A1 P.S. is personalised: Yes / No

Only send if all 6 are checked.`
      };
    default:
      return {
        title: `Pitch Pack \u2014 ${date} \u2014 Executive Summary`,
        content: ch + `PITCH PACK \u2014 Executive Summary Deck
Audience: ${ICP} / Niche: ${niche}
Product: ${PRODUCT}

\u2501\u2501 SLIDE OUTLINE (8 slides, 15\u201320 min presentation) \u2501\u2501

Slide 1 \u2014 Title
"How to Add $50K Pipeline in 14 Days Without Hiring an SDR"
Your name, company, date

Slide 2 \u2014 The Problem (Their World)
"At seed stage, founder-led sales hits a ceiling."
\u2022 Pipeline is inconsistent \u2014 feast or famine
\u2022 Offer is feature-led, not outcome-led
\u2022 Warm network is running dry
\u2022 Hiring an SDR costs \u20AC5K/month and takes 3 months to ramp

Slide 3 \u2014 The Turning Point
"The bottleneck isn't volume. It's your offer."
One specific example of a weak vs strong offer side-by-side.

Slide 4 \u2014 The Solution
"A 2-week RevOps sprint: audit + offer + meetings."
Week 1: ICP audit, offer rewrite, prospect list
Week 2: Test with real prospects, book 3\u20135 calls

Slide 5 \u2014 Why This Works
3 proof points (operator: replace with real case data):
1. [Founder name] booked [X] calls in [Y] days \u2014 [sector]
2. [Metric: offer open rate / reply rate / conversion]
3. [Before/after comparison]

Slide 6 \u2014 Pricing + Scope
\u20AC2,500\u2013\u20AC4,500 fixed. What's included. What's not.
Guarantee: 3 meetings or Week 2 is free.

Slide 7 \u2014 Next Step
"One action: book a 20-min pipeline audit."
Calendar link / direct CTA.

Slide 8 \u2014 Q&A

Speaker notes (Slide 3): Pause here. Ask "Does this sound familiar?" \u2014 wait for yes before moving on.
Speaker notes (Slide 6): Don't negotiate on price without reducing scope first.`
      };
  }
}
function delivery(taskType, date, constraints) {
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "onboarding-checklist":
      return {
        title: `Onboarding Checklist \u2014 ${date} \u2014 Sprint Week 1\u20132`,
        content: ch + `SPRINT ONBOARDING CHECKLIST
Product: ${PRODUCT}
Owner: Operator (check off each item before moving to next)

\u2501\u2501 PRE-SPRINT (Before Day 1) \u2501\u2501
\u25A1 Contract signed + invoice sent
\u25A1 Kickoff call scheduled (Day 1, 60 min)
\u25A1 Client fills onboarding form (ICP, product, current outreach samples)
\u25A1 Access granted: CRM read-only (if applicable), LinkedIn, email tool
\u25A1 Shared Notion/Drive folder created

\u2501\u2501 WEEK 1 \u2014 Audit + Offer Build \u2501\u2501

Day 1 \u2014 Kickoff (60 min):
\u25A1 ICP interview: who is the buyer, what do they care about, what have they tried
\u25A1 Review current offer / outreach samples
\u25A1 Align on success definition: what does "3 qualified calls" mean to them
\u25A1 Set Week 1 deliverables + review date (Day 5)

Day 2\u20133 \u2014 ICP Audit:
\u25A1 Map current ICP against 4 dimensions: industry, size, role, pain
\u25A1 Identify top 1\u20133 ICP segments
\u25A1 Document "wrong ICP" signals to filter out
\u25A1 Draft ICP one-pager (1 page, operator reviews)

Day 4 \u2014 Offer Build:
\u25A1 Draft offer (using offer draft template from sales_asset)
\u25A1 Score against KPIs: clarity, price, margin, CTA
\u25A1 Internal review (factory agent F equivalent)
\u25A1 Revise if score < 0.75

Day 5 \u2014 Delivery Review:
\u25A1 Present ICP audit + offer to client (30 min)
\u25A1 Collect feedback (written, same day)
\u25A1 Confirm approval to proceed to Week 2

\u2501\u2501 WEEK 2 \u2014 Test + Booking \u2501\u2501

Day 6\u20137 \u2014 Prospect List:
\u25A1 Build list: 50\u2013100 contacts matching ICP
\u25A1 Validate: name, title, company, LinkedIn, email
\u25A1 Segment by ICP tier (A = perfect match, B = strong, C = borderline)

Day 8\u201310 \u2014 Outreach:
\u25A1 Send offer to Tier A prospects (20\u201330 contacts)
\u25A1 Track: sent / opened / replied / booked
\u25A1 Follow-up Touch 1 on Day 2 after send
\u25A1 Follow-up Touch 2 on Day 4 after send

Day 11\u201312 \u2014 Calls + Conversion:
\u25A1 Conduct booked calls (operator or client)
\u25A1 Qualify each call against framework
\u25A1 Document qualified vs unqualified

Day 13 \u2014 Wrap-Up:
\u25A1 Count booked qualified calls (target: 3+)
\u25A1 Prepare Week 2 report (1 page)

Day 14 \u2014 Sprint Close:
\u25A1 Deliver final report: ICP audit + offer + outreach results + pipeline impact
\u25A1 Invoice: Week 2 payment
\u25A1 Offer: retainer proposal or next sprint brief
\u25A1 Archive all assets to Warehouse`
      };
    case "dashboard-component-plan":
      return {
        title: `Dashboard Component Plan \u2014 ${date} \u2014 RevOps Sprint View`,
        content: ch + `DASHBOARD COMPONENT PLAN \u2014 RevOps Sprint View
Purpose: Operator visibility into sprint health for the ${PRODUCT}

\u2501\u2501 COMPONENT 1 \u2014 Pipeline Health Score \u2501\u2501
Type: KPI card (single number)
Data: (qualified calls booked / target) \xD7 100
Display: Large number + colour (green \u2265 80%, yellow 50\u201379%, red < 50%)
Update: Per sprint day

\u2501\u2501 COMPONENT 2 \u2014 Outreach Funnel \u2501\u2501
Type: Horizontal funnel chart
Stages: Contacted \u2192 Opened \u2192 Replied \u2192 Called \u2192 Qualified
Data source: Outreach tracker (manual entry or CRM)
Display: Count + conversion % at each stage
Benchmark: Industry avg shown as grey line

\u2501\u2501 COMPONENT 3 \u2014 Offer Score Timeline \u2501\u2501
Type: Line chart
Data: Offer quality score by iteration (1st draft, revised, final)
X-axis: Iteration number | Y-axis: Score (0\u20131)
Threshold line: 0.75 (pass/fail)

\u2501\u2501 COMPONENT 4 \u2014 Prospect Tier Breakdown \u2501\u2501
Type: Donut chart
Segments: Tier A / Tier B / Tier C / Disqualified
Data source: Prospect list with tier labels
Use: Shows whether list quality matches ICP

\u2501\u2501 COMPONENT 5 \u2014 Day-by-Day Activity Log \u2501\u2501
Type: Timeline/table
Columns: Date, Action, Output, Status
Data: Manual or imported from Factory event log
Filter: By sprint day, by agent, by status

\u2501\u2501 COMPONENT 6 \u2014 Cost per Booked Call \u2501\u2501
Type: KPI card
Formula: Total sprint cost \xF7 qualified calls booked
Display: \u20AC[amount] + trend vs previous sprint
Target: < \u20AC500 per qualified call

Implementation notes:
- All components use data from FactoryStore or manual input
- No third-party dashboard tool required \u2014 this plan is for a custom build
- Operator approves component design before any dev work begins`
      };
    case "landing-template":
      return {
        title: `Landing Template \u2014 ${date} \u2014 One-Page Sprint Page`,
        content: ch + `LANDING PAGE TEMPLATE \u2014 One-Page Sprint Offer
Purpose: Standalone page for the ${PRODUCT}
Operator: Fill [brackets], remove instruction text, review before publishing

\u2501\u2501 NAV (minimal) \u2501\u2501
Logo | "Book Audit" button (primary, top-right)

\u2501\u2501 HERO \u2501\u2501
H1: "[Pain-first headline \u2014 6\u201310 words]"
Example: "Your Pipeline Is Stalling. Here's the 14-Day Fix."
Subhead: "A fixed-scope RevOps sprint that builds one high-converting offer and books 3\u20135 qualified intro meetings for ${ICP}."
CTA: "Book Your Free 20-Min Pipeline Audit \u2192"
Trust line: "Fixed scope. Fixed price. 3 meetings or Week 2 is free."

\u2501\u2501 PROBLEM SECTION \u2501\u2501
H2: "Sound familiar?"
3-column grid:
\u2022 Column 1: "Your outreach gets polite replies, not meetings."
\u2022 Column 2: "You're not sure if the problem is the offer or the list."
\u2022 Column 3: "You don't have bandwidth to run experiments for 3 months."

\u2501\u2501 SOLUTION SECTION \u2501\u2501
H2: "The Sprint"
Two-column layout:

Week 1 \u2014 Audit + Offer Build (\u20AC1,500\u2013\u20AC2,000):
\u2022 ICP deep-dive interview (60 min \u2014 your only time commitment)
\u2022 Full audit of your current offer and outreach
\u2022 One rewritten offer, scored and validated
\u2022 Prospect list: 50+ contacts matching your ICP

Week 2 \u2014 Test + Booking (\u20AC1,000\u2013\u20AC2,500):
\u2022 Outreach to 20\u201330 Tier A prospects
\u2022 3-touch follow-up sequence
\u2022 Target: 3\u20135 qualified intro meetings booked
\u2022 Full results report

\u2501\u2501 PROOF SECTION \u2501\u2501
H2: "Results"
[Operator: insert 1\u20132 real case studies. Do not fabricate. Leave blank until ready.]

\u2501\u2501 PRICING \u2501\u2501
Fixed Sprint: \u20AC2,500\u2013\u20AC4,500
Guarantee: 3 meetings or Week 2 is free.
"No retainer. No scope creep. One decision."

\u2501\u2501 CTA SECTION \u2501\u2501
H2: "Book your audit"
Subhead: "Free, 20 minutes, no commitment."
[Calendar embed or booking form]

\u2501\u2501 FOOTER \u2501\u2501
Contact | Privacy (basic) | No cookie banner needed (no tracking without consent)`
      };
    case "repo-task-draft":
      return {
        title: `Repo Task Draft \u2014 ${date} \u2014 Sprint Deliverables`,
        content: ch + `REPOSITORY TASK DRAFTS \u2014 Sprint Delivery Issues
Project: ${PRODUCT}
Format: GitHub Issues (copy-paste ready)

\u2501\u2501 ISSUE 1 \u2501\u2501
Title: "ICP Audit: Define Tier A/B/C criteria for current sprint"
Labels: delivery, week-1, sprint
Body:
Define qualification tiers for the current sprint's ICP:
- Tier A: Perfect match \u2014 move to outreach immediately
- Tier B: Strong match \u2014 include in outreach with modified copy
- Tier C: Borderline \u2014 do not include in this sprint's outreach

Deliverable: One-page ICP criteria document (Notion or MD file)
Owner: [Assign]
Due: Day 3 of sprint

\u2501\u2501 ISSUE 2 \u2501\u2501
Title: "Offer Build: Draft v1 + score against KPIs"
Labels: delivery, week-1, offer
Body:
Using the ICP Audit output and the offer draft template (sales_asset):
1. Draft offer v1
2. Run through Agent F scoring checklist (offer clarity, price, margin, CTA)
3. If score < 0.75: revise and re-score (max 1 revision)
4. Deliver final offer to client for approval

Deliverable: Final approved offer (plain text, reviewed by operator)
Owner: [Assign]
Due: Day 5 of sprint

\u2501\u2501 ISSUE 3 \u2501\u2501
Title: "Prospect List: 50+ Tier A contacts for outreach"
Labels: delivery, week-2, prospecting
Body:
Build a validated list of 50\u2013100 contacts:
- Match ICP Tier A criteria from Issue 1
- Fields: Name, Title, Company, Company Size, LinkedIn URL, Email
- Source: LinkedIn Sales Navigator / Apollo / manual research
- No scraping of private/logged-in data

Deliverable: CSV in shared Drive. Reviewed by operator before outreach.
Owner: [Assign]
Due: Day 7 of sprint

\u2501\u2501 ISSUE 4 \u2501\u2501
Title: "Outreach: Send + track 3-touch sequence"
Labels: delivery, week-2, outreach
Body:
Using the follow-up script (sales_asset):
1. Send Touch 1 to all Tier A prospects
2. Track: sent / opened / replied / booked
3. Send Touch 2 on Day 2 after Touch 1
4. Send Touch 3 (breakup) on Day 4 after Touch 2
5. Report booked calls daily

Deliverable: Daily log (date, action, replies, calls booked)
Owner: [Assign]
Due: Day 12 (ongoing from Day 8)

\u2501\u2501 ISSUE 5 \u2501\u2501
Title: "Sprint Close: Deliver final report + offboarding"
Labels: delivery, week-2, close
Body:
Compile:
- ICP Audit (Week 1 output)
- Final offer (approved version)
- Outreach results: sent / replied / booked / qualified
- Pipeline impact: calls booked \xD7 estimated deal value
- Recommendation: retainer / next sprint / hold

Deliver to client. File to Warehouse. Close sprint.
Owner: [Assign]
Due: Day 14`
      };
    default:
      return {
        title: `Demo Block \u2014 ${date} \u2014 20-Min Sprint Demo`,
        content: ch + `DEMO SCRIPT \u2014 20-Minute RevOps Sprint Demo
Audience: ${ICP} / Context: Discovery call after qualification

\u2501\u2501 SEGMENT 1 \u2014 Frame the Problem (3 min) \u2501\u2501

"Before I show you anything, I want to make sure we're solving the right problem.

Most founders I work with at [their stage] have the same 3 issues:
1. Pipeline is inconsistent \u2014 you close well but can't get enough first calls
2. Outreach feels like throwing darts in the dark
3. You don't know if the problem is the offer, the list, or the channel

Which of those resonates most for you right now?"

[Wait. Let them answer. Don't rush past this.]

\u2501\u2501 SEGMENT 2 \u2014 Show the Audit (5 min) \u2501\u2501

"Here's what Week 1 looks like. I'm going to show you an example ICP audit I did for a founder similar to you."

[Show: 1-page ICP audit example \u2014 redacted if real client, placeholder if not]

Key points to highlight:
- We start with their language, not our assumptions
- We score the current offer before building a new one
- The output is a written deliverable, not just a conversation

Pause: "Does this make sense as a starting point?"

\u2501\u2501 SEGMENT 3 \u2014 Show the Offer (5 min) \u2501\u2501

"Here's a before/after offer example."

[Show: before (generic pitch) vs after (outcome-led, specific, scored)]

"The before is what most founders are sending. The after is what we build in Week 1."

"How does your current offer compare to the 'before' or the 'after'?"

\u2501\u2501 SEGMENT 4 \u2014 Week 2 Results (4 min) \u2501\u2501

"Week 2: we take the new offer, build a 50-contact prospect list, and run the outreach.

[Operator: insert real result here \u2014 calls booked, timeline, sector]

The goal is 3 qualified calls minimum. If we don't hit it, Week 2 is free."

\u2501\u2501 SEGMENT 5 \u2014 Pricing + CTA (3 min) \u2501\u2501

"The sprint is \u20AC2,500\u2013\u20AC4,500 fixed. Here's exactly what that includes."
[Show: scope breakdown \u2014 do not negotiate during the demo]

"What would make this a clear yes for you today?"

[Wait. Don't fill the silence. Let them respond.]

Notes: Never demo more than 20 minutes. If they're not engaged by Segment 3, ask a direct question.`
      };
  }
}
function research(taskType, date, constraints) {
  const doy = dayOfYear(date);
  const niche = SAAS_NICHES[doy % SAAS_NICHES.length] ?? "B2B SaaS";
  const nicheFocus = extractNicheFocus(constraints) || niche;
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "niche-research":
      return {
        title: `Niche Research \u2014 ${date} \u2014 ${nicheFocus}`,
        content: ch + `NICHE RESEARCH REPORT
Niche: ${nicheFocus}
ICP: ${ICP}

\u2501\u2501 NICHE SUMMARY \u2501\u2501

${nicheFocus} is a sub-segment of the B2B SaaS market with the following characteristics:
- Typical company size: 10\u2013100 employees
- Revenue range at seed: $10K\u2013$80K MRR
- Primary buying trigger: [founder is selling everything manually and hitting a ceiling]
- Key pain: inconsistent pipeline; reliance on referrals

\u2501\u2501 MARKET SIZE SIGNALS (from public sources \u2014 operator to verify) \u2501\u2501

- Number of ${nicheFocus} companies in EU+UK: estimate 500\u20132,000 (based on LinkedIn filters)
- Annual growth: 15\u201325% based on VC investment trends
- Saturation risk: Low to medium \u2014 space is growing faster than outbound capacity

\u2501\u2501 PAIN POINTS SPECIFIC TO THIS NICHE \u2501\u2501

1. Long sales cycles (30\u201390 days) compress MRR predictability
2. Founders often sell to peers \u2014 hard to separate social from commercial relationships
3. ICP definition is blurry: "any company that could use us" syndrome
4. Pricing is often undervalued \u2014 founders undercharge because they fear churn

\u2501\u2501 OFFER ANGLES FOR THIS NICHE \u2501\u2501

1. "Get your first 10 paying customers outside your network" (relevance: high)
2. "Convert demo requests into paid contracts faster" (relevance: medium)
3. "Build a repeatable outbound system before you hire your first SDR" (relevance: high)

\u2501\u2501 CHANNEL RECOMMENDATIONS \u2501\u2501

- LinkedIn: Strong \u2014 founders in ${nicheFocus} are active
- Cold email: Medium \u2014 open rates 25\u201335% with personalisation
- Community: Look for Slack groups, Discord servers specific to ${nicheFocus}
- Warm intro: Highest conversion \u2014 ask existing clients for 2 intros each

\u2501\u2501 KEYWORD RESEARCH STARTING POINTS \u2501\u2501

Commercial: "${nicheFocus} sales consultant", "${nicheFocus} outbound", "${nicheFocus} pipeline"
Informational: "how to sell [niche] software", "${nicheFocus} go-to-market"

\u2501\u2501 NEXT STEP \u2501\u2501

Operator: confirm if this niche is in our current ICP filter. If yes, add to prospect list sourcing criteria.`
      };
    case "keyword-set":
      return {
        title: `Keyword Set \u2014 ${date} \u2014 Organic + Paid`,
        content: ch + `KEYWORD SET \u2014 SEO + PPC
Target: ${nicheFocus} founders | Product: ${PRODUCT}

\u2501\u2501 COMMERCIAL INTENT KEYWORDS (high priority for paid) \u2501\u2501

Tier 1 \u2014 Direct match (small volume, high intent):
\u2022 "revops consultant for startups" (est. 50\u2013200/mo)
\u2022 "b2b saas outbound consultant" (est. 100\u2013300/mo)
\u2022 "pipeline sprint b2b" (est. 10\u201350/mo \u2014 niche, low competition)
\u2022 "fractional revops" (est. 200\u2013500/mo \u2014 growing)
\u2022 "saas founder sales help" (est. 50\u2013150/mo)

Tier 2 \u2014 Broader commercial (higher volume, more competition):
\u2022 "b2b sales consultant" (est. 1K\u20133K/mo)
\u2022 "startup sales consultant" (est. 500\u20131K/mo)
\u2022 "outbound sales strategy" (est. 2K\u20135K/mo)

\u2501\u2501 INFORMATIONAL INTENT (good for LinkedIn + content) \u2501\u2501

\u2022 "why b2b saas pipeline stalls"
\u2022 "how to write a sales offer for startups"
\u2022 "seed stage outbound strategy"
\u2022 "icp qualification framework"
\u2022 "how to qualify leads saas"
\u2022 "sales script for saas founders"
\u2022 "how to get first b2b customers"
\u2022 "when to hire first sdr"
\u2022 "fractional sales consultant vs sdr"

\u2501\u2501 NEGATIVE KEYWORDS (exclude to avoid wasted spend) \u2501\u2501

\u2022 "free" \u2022 "template only" \u2022 "enterprise" (> 500 employees)
\u2022 "ecommerce" \u2022 "b2c" \u2022 "marketing agency"

\u2501\u2501 SEMANTIC CLUSTERS \u2501\u2501

Cluster 1 \u2014 Pipeline: pipeline, qualified leads, booked calls, outbound, meetings
Cluster 2 \u2014 Offer: offer writing, sales copy, value proposition, pitch
Cluster 3 \u2014 Consulting: consultant, fractional, sprint, revops, revenue operations
Cluster 4 \u2014 Stage: seed stage, pre-series a, early stage, founder-led sales

\u2501\u2501 SUGGESTED CONTENT PIECES \u2501\u2501

1. "The Seed-Stage Pipeline Audit: 5 Questions That Diagnose Your Outbound" (organic)
2. "What Is a RevOps Sprint? (And Is It Right for Your Stage?)" (comparison)
3. "ICP vs Persona: Why Founders Confuse Them and Lose Deals" (informational)

Operator: Validate search volumes in Google Keyword Planner or Ahrefs before running paid ads.`
      };
    case "opportunity-map":
      return {
        title: `Opportunity Map \u2014 ${date} \u2014 5 Whitespace Opportunities`,
        content: ch + `OPPORTUNITY MAP \u2014 5 Whitespace Opportunities
Lens: ${nicheFocus} / Product: ${PRODUCT}

\u2501\u2501 OPPORTUNITY 1 \u2014 Pre-Series A Timing \u2501\u2501

Signal: Founders who just closed a seed round (\u20AC500K\u2013\u20AC2M) have cash and urgency to prove pipeline before Series A.
Window: 3\u20136 months post-close
Entry: Monitor Crunchbase/LinkedIn for recent seed announcements in ${nicheFocus}
Offer angle: "You've raised. Now you need pipeline proof for your Series A deck."
Risk: Founder may hire in-house instead. Counter with speed argument (2 weeks vs 3 months to ramp).

\u2501\u2501 OPPORTUNITY 2 \u2014 Post-Product-Market Fit Stall \u2501\u2501

Signal: Companies at \u20AC20K\u2013\u20AC50K MRR with flat growth for 2+ months.
Window: Ongoing \u2014 look for "we have the product, struggling with growth" language in founder posts
Entry: LinkedIn content targeting this transition moment
Offer angle: "The product is working. The offer isn't landing yet."
Risk: Founders may attribute flat growth to product, not sales.

\u2501\u2501 OPPORTUNITY 3 \u2014 Failed SDR Hire \u2501\u2501

Signal: Founders who hired and fired a first SDR within 6 months.
Window: 0\u20133 months after the failed hire
Entry: LinkedIn post listening ("we tried SDR and it didn't work")
Offer angle: "Before you hire again \u2014 let a sprint prove the offer works first."
Risk: Founder may be skeptical of all external sales help.

\u2501\u2501 OPPORTUNITY 4 \u2014 Conference Season Timing \u2501\u2501

Signal: B2B SaaS events (SaaStock, SaaSOpen, Product-Led Summit) attract exactly the ICP.
Window: 3\u20134 weeks before each event
Entry: Event sponsorship (low cost) or side events / dinners
Offer angle: "Walk out of [event] with a 2-week sprint starting next Monday."
Risk: High competition from other consultants at same events.

\u2501\u2501 OPPORTUNITY 5 \u2014 Community Trust Plays \u2501\u2501

Signal: Founder Slack groups, Indie Hackers, SaaS communities have active Q&A on sales/outbound.
Window: Ongoing \u2014 allocate 2\u20133h per week
Entry: Answer questions genuinely for 30 days before pitching anything
Offer angle: Trust-based warm DM after 30 days of value-add
Risk: Time-intensive. Lower ROI per hour than direct outreach, but builds brand.

\u2501\u2501 PRIORITISATION \u2501\u2501

Highest ROI: Opportunity 2 (PMF stall) \u2014 clearest pain, widest audience
Fastest to test: Opportunity 3 (failed SDR) \u2014 acute pain, immediate window
Operator: review this map monthly and mark which opportunities are active.`
      };
    case "audience-list":
      return {
        title: `Audience Segmentation \u2014 ${date} \u2014 Target Personas`,
        content: ch + `AUDIENCE SEGMENTATION MATRIX
ICP: ${ICP} | Focus: ${nicheFocus}

\u2501\u2501 PERSONA 1 \u2014 The Overwhelmed Founder \u2501\u2501

Profile:
- Revenue: $15K\u2013$35K MRR
- Stage: 12\u201324 months post-launch
- Team: 3\u20138 people (no dedicated sales)
- Pain: "I'm closing deals from my network but I can't scale it"
- Trigger: Warm network is drying up, next hire is unclear

Messaging angle: "You don't need more calls. You need a better offer."
Channel: LinkedIn DM (they're active), direct email
Content type: Short diagnostic (3 questions that show them the problem)

\u2501\u2501 PERSONA 2 \u2014 The Frustrated Experimenter \u2501\u2501

Profile:
- Revenue: $30K\u2013$60K MRR
- Stage: Has tried ads, SDR, cold email \u2014 mixed results
- Team: 5\u201315 people (1 sales hire, not performing)
- Pain: "We're spending on outbound but it's not converting"
- Trigger: Q2 pipeline is below plan; pressure from investors

Messaging angle: "Before you spend more \u2014 fix the offer first."
Channel: LinkedIn + cold email with case study
Content type: Before/after offer teardown

\u2501\u2501 PERSONA 3 \u2014 The Pre-Series A Founder \u2501\u2501

Profile:
- Revenue: $40K\u2013$80K MRR
- Stage: 18\u201336 months, planning Series A in 6\u201312 months
- Team: 10\u201325 people (building out go-to-market)
- Pain: "We need to show investors a predictable pipeline"
- Trigger: Series A prep \u2014 needs repeatable sales proof

Messaging angle: "Predictable pipeline before you raise. The sprint is the proof."
Channel: Warm intro or event-based (SaaStock, etc.)
Content type: ROI calculator + deck contribution

\u2501\u2501 SCORING MATRIX \u2501\u2501

Score each prospect 1\u20133 on each dimension:
- Revenue stage fit (1=outside range, 2=edge, 3=perfect match)
- Role (1=not decision-maker, 2=influencer, 3=sole decision-maker)
- Pain signal present (1=none, 2=mild, 3=explicit)
- Timing signal (1=no urgency, 2=watching, 3=active buyer)

Total 10\u201312: Tier A | Total 7\u20139: Tier B | Total < 7: Nurture only`
      };
    default:
      return {
        title: `Lead Source List \u2014 ${date} \u2014 8 Validated Sources`,
        content: ch + `LEAD SOURCE LIST \u2014 8 Validated Sources
ICP: ${ICP} | Focus: ${nicheFocus}

Quality rating: \u2605\u2605\u2605 High | \u2605\u2605 Medium | \u2605 Low

\u2501\u2501 SOURCE 1 \u2014 LinkedIn Sales Navigator \u2605\u2605\u2605 \u2501\u2501

Filters: Job Title: Founder/CEO/Co-Founder | Company Size: 10\u201350 | Industry: Software
Free signal: Posts containing "pipeline", "outbound", "MRR", "seed stage"
Reach: Thousands \u2014 filter to 50\u2013100 Tier A per sprint
Cost: \u20AC65\u2013\u20AC100/month for Navigator
Note: Do not scrape. Manual review of profiles before outreach.

\u2501\u2501 SOURCE 2 \u2014 Crunchbase (seed rounds) \u2605\u2605\u2605 \u2501\u2501

Filter: Funding type = Seed | Amount: $250K\u2013$3M | Date: Last 6 months | Category: SaaS/B2B
Signal: Recently funded = cash + urgency
Reach: 50\u2013200 companies/month (EU + UK focus)
Cost: Free basic / $49/month Pro
Note: Cross-reference with LinkedIn to find founder contact.

\u2501\u2501 SOURCE 3 \u2014 Apollo.io \u2605\u2605 \u2501\u2501

Filters: Same as LinkedIn above
Advantage: Direct email included
Risk: Data quality varies \u2014 verify before outreach
Cost: $49\u2013$99/month
Note: Validate email addresses before sending cold email.

\u2501\u2501 SOURCE 4 \u2014 Indie Hackers / MicroConf community \u2605\u2605 \u2501\u2501

Signal: Founders who post about revenue milestones, outbound struggles
Reach: Smaller but high-intent
Method: Read + engage before DM. Never cold pitch in community threads.
Cost: Free

\u2501\u2501 SOURCE 5 \u2014 Product Hunt (Makers) \u2605\u2605 \u2501\u2501

Signal: Launched product in last 6 months + B2B category
Reach: 20\u201350 relevant founders/week
Method: Check "made by" profile \u2192 LinkedIn \u2192 qualify
Cost: Free

\u2501\u2501 SOURCE 6 \u2014 SaaStock / SaaSOpen (event lists) \u2605\u2605\u2605 \u2501\u2501

Signal: Attending = active, growth-minded founder
Reach: 100\u2013500 relevant contacts per event
Method: Pre-event LinkedIn outreach with event reference
Cost: Conference ticket or side event only

\u2501\u2501 SOURCE 7 \u2014 VC Portfolio Pages \u2605\u2605 \u2501\u2501

Seed-stage VC portfolio companies = pre-qualified funding signal
VCs to monitor: Seedcamp, LocalGlobe, Point Nine, Cherry Ventures (EU focus)
Method: Portfolio page \u2192 company \u2192 founder LinkedIn
Cost: Free | Volume: 20\u201350 new companies/month

\u2501\u2501 SOURCE 8 \u2014 Referral (existing clients) \u2605\u2605\u2605 \u2501\u2501

Method: After sprint delivery, ask: "Who else in your network has the same pipeline problem?"
Conversion rate: 30\u201350% (warm intro vs cold)
Cost: Free | Risk: Low \u2014 trust is pre-established
Action: Build referral ask into sprint offboarding checklist

\u2501\u2501 PRIORITY ORDER FOR NEXT SPRINT \u2501\u2501

1. Crunchbase (fresh signal) \u2192 2. LinkedIn Nav (volume) \u2192 3. Referral (highest conversion)`
      };
  }
}
function qa(taskType, date, constraints) {
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "cleanup-report":
      return {
        title: `Cleanup Report \u2014 ${date} \u2014 Asset Library`,
        content: ch + `CLEANUP REPORT \u2014 Asset Library Review
Date: ${date}

\u2501\u2501 SCOPE \u2501\u2501
Review all daily_review and warehouse assets for: stale content, outdated numbers, placeholder text, and copy debt.

\u2501\u2501 CLEANUP CHECKLIST \u2501\u2501

Marketing assets:
\u25A1 Any hook that references a date > 30 days old \u2192 update or archive
\u25A1 Any copy that uses [placeholder] text \u2192 complete or trash
\u25A1 Landing sections with missing proof/case study \u2192 flag as "needs real data"
\u25A1 Campaign angles with no KPI tracking \u2192 add KPI block or archive

Sales assets:
\u25A1 Objection responses that mention competitors by name \u2192 remove (risk of inaccuracy)
\u25A1 Offer templates with prices not reviewed in 60 days \u2192 flag for pricing review
\u25A1 Follow-up scripts with broken structure (gaps in touch sequence) \u2192 fix
\u25A1 Qualification questions that reference stages that no longer match ICP \u2192 update

Delivery assets:
\u25A1 Checklists with tasks that reference unavailable tools \u2192 update
\u25A1 Demo scripts referencing case studies that aren't real yet \u2192 mark clearly as placeholder
\u25A1 Onboarding docs that don't match current sprint scope \u2192 sync

Research assets:
\u25A1 Lead source lists older than 90 days \u2192 re-validate (sources change)
\u25A1 Niche research with market size data > 1 year old \u2192 refresh or caveat
\u25A1 Keyword sets not validated in Search Console or Ahrefs \u2192 mark unvalidated

\u2501\u2501 COPY DEBT LOG \u2501\u2501

Item: [Operator fills in each flagged asset]
Action needed: [update / trash / complete with real data]
Owner: [Operator]
Due: [within 7 days]

\u2501\u2501 RULE \u2501\u2501
Assets in Warehouse should be deployment-ready. If an asset in Warehouse has a [placeholder], move it back to daily_review until complete.`
      };
    case "agent-improvement-report":
      return {
        title: `Agent Improvement Report \u2014 ${date} \u2014 Pipeline Agents`,
        content: ch + `AGENT IMPROVEMENT REPORT
Date: ${date}

\u2501\u2501 METHODOLOGY \u2501\u2501
Review last 7 days of Factory events. Score each agent on: output quality (0\u20131), speed (issues or delays), error rate.

\u2501\u2501 AGENT A \u2014 Signal Intake Officer \u2501\u2501
Current performance: Categorises signals correctly for clear inputs. Misses category for ambiguous signals.
Improvement: Expand CATEGORY_KEYWORDS with 5 additional signal words per category.
Priority: Low

\u2501\u2501 AGENT B \u2014 ICP Qualifier \u2501\u2501
Current performance: Threshold at 0.5 works well. Some borderline signals (score 0.45\u20130.55) are unclear.
Improvement: Add confidence band: 0.45\u20130.55 = "borderline \u2014 operator review recommended"
Priority: Medium

\u2501\u2501 AGENT C \u2014 Lead Enricher \u2501\u2501
Current performance: Buyer persona assignment is too generic ("Founder / CEO").
Improvement: Add domain-specific buyer types (e.g., "Technical Founder", "Commercial Founder", "Repeat Founder")
Priority: Low

\u2501\u2501 AGENT D \u2014 Offer Strategist \u2501\u2501
Current performance: Positioning block is binary (direct outbound / consultative). Real signals are more nuanced.
Improvement: Add 3rd positioning type: "Social proof first" for founders with strong testimonials
Priority: Medium

\u2501\u2501 AGENT E \u2014 Offer Builder \u2501\u2501
Current performance: Stub template is solid structure. Lacks variation over repeated runs.
Improvement: Add 3 alternative offer frameworks (AIDA, PAS, outcome-first) and rotate by signal type.
Priority: High

\u2501\u2501 AGENT F \u2014 Offer Evaluator \u2501\u2501
Current performance: 4 KPIs cover the basics. Missing: personalisation score.
Improvement: Add KPI 5: personalisation \u2014 checks if offer references specific buyer pain, not generic.
Priority: Medium

\u2501\u2501 AGENT G \u2014 Offer Editor \u2501\u2501
Current performance: CTA fix is effective. Price justification fix is too mechanical.
Improvement: Price justification should reference ROI framing, not just reword the pricing line.
Priority: Medium

\u2501\u2501 AGENTS H\u2013N \u2501\u2501
No active issues in current sprint. Review again in 30 days when volume increases.

\u2501\u2501 PRIORITY ACTIONS \u2501\u2501
1. Agent E: Add offer framework rotation (this sprint)
2. Agent B: Add confidence band for borderline scores (next sprint)
3. Agent D: Add social-proof positioning type (next sprint)`
      };
    case "weak-asset-review":
      return {
        title: `Weak Asset Review \u2014 ${date} \u2014 Low Score Items`,
        content: ch + `WEAK ASSET REVIEW \u2014 Low Quality Score Items
Date: ${date} | Threshold: qualityScore < 0.6

\u2501\u2501 REVIEW PROTOCOL \u2501\u2501

1. Pull all daily digitals with qualityScore < 0.6 or status = needs_rework
2. For each: identify root cause of low score
3. Decide: rework, trash, or accept with caveat
4. Log decision with operator feedback for next mission run

\u2501\u2501 COMMON FAILURE MODES \u2501\u2501

FAILURE MODE 1 \u2014 Too generic:
Symptom: Content reads as if written for any B2B company, not specifically for Seed-stage SaaS
Fix: Add ICP-specific numbers (MRR ranges), stage-specific language (seed/PMF/pre-series A)
Check: Does the asset pass the "could this apply to a plumber?" test? If yes \u2192 revise.

FAILURE MODE 2 \u2014 Missing numbers:
Symptom: No price, no timeline, no quantity, no target metric
Fix: Add at least 3 specific numbers (\u20AC amount, number of days, number of calls)
Check: Count numbers in the asset. Target: \u2265 5 concrete numbers.

FAILURE MODE 3 \u2014 No CTA:
Symptom: Asset ends without a clear next step for the reader
Fix: Add one specific CTA \u2014 action + channel + timeframe
Check: Can the reader do something right now after reading this? If not \u2192 revise.

FAILURE MODE 4 \u2014 Stale constraints:
Symptom: Operator feedback from previous run is not addressed in the content
Fix: Re-run the generator with the constraint explicitly incorporated
Check: Read the constraint. Read the asset. Is the constraint visibly addressed? If not \u2192 rework.

FAILURE MODE 5 \u2014 Placeholder not filled:
Symptom: "[Operator to insert X]" appears in the content
Fix: Either fill in the real data or mark the asset as "blocked \u2014 needs data" and do not send to warehouse
Rule: No asset with an unfilled placeholder may enter Warehouse.

\u2501\u2501 SCORING RUBRIC \u2501\u2501
0.0\u20130.4: Trash or major rework
0.4\u20130.6: Minor rework \u2014 fix identified failure mode
0.6\u20130.8: Accept with operator note
0.8\u20131.0: Accept and send to Warehouse`
      };
    case "next-day-plan":
      return {
        title: `Next-Day Plan \u2014 ${date} \u2014 Tomorrow's Priorities`,
        content: ch + `NEXT-DAY PRODUCTION PLAN
Date: ${date} | Plan for: ${new Date(new Date(date).getTime() + 864e5).toISOString().slice(0, 10)}

\u2501\u2501 CARRY-FORWARD ITEMS (from today) \u2501\u2501
[ ] Any assets in needs_rework status \u2192 rework first thing
[ ] Any approval queue items pending operator decision \u2192 resolve before running new missions
[ ] Any open feedback events \u2192 confirm addressed in today's generator run

\u2501\u2501 TOMORROW'S MISSION FOCUS \u2501\u2501

Marketing: [operator: note any campaign that needs copy refresh or a new hook test]
Sales: [operator: note any objection that came up in calls this week \u2014 add to objection map]
Delivery: [operator: note any sprint step that took longer than planned \u2014 update checklist]
Research: [operator: note any niche or keyword that performed well \u2014 expand]
QA: [operator: review tomorrow's output against today's feedback before accepting]

\u2501\u2501 PRODUCTION RULES FOR TOMORROW \u2501\u2501

1. Run runDailyMissions() at start of work session
2. Review all 5 outputs before accepting any
3. Apply existing operator feedback before accepting the marketing or sales asset
4. Do not send any asset to Warehouse with an unfilled placeholder
5. Close any needs_rework items from today before end of day

\u2501\u2501 DAILY PRODUCTION KPIs \u2501\u2501

\u2022 5 assets produced: Yes / No
\u2022 Assets reviewed by operator: Yes / No
\u2022 Assets accepted to Warehouse: __ / 5
\u2022 Assets sent to Trash: __ / 5
\u2022 Feedback events created: __ (target: 0, meaning all accepted)
\u2022 Time spent in review: __ min (target: < 30 min/day)

\u2501\u2501 WEEKLY REFLECTION (fill each Friday) \u2501\u2501
\u2022 Best asset this week: [department + title]
\u2022 Weakest pattern: [failure mode that repeated]
\u2022 One change to make to generators next week: [specific]
\u2022 Operator satisfaction with the daily loop (1\u201310): [score]`
      };
    default:
      return {
        title: `QA Report \u2014 ${date} \u2014 Daily Production Audit`,
        content: ch + `DAILY PRODUCTION QA REPORT
Date: ${date}
Scope: All 5 daily digital deliverables

\u2501\u2501 QA CHECKLIST \u2014 Applied to Every Asset \u2501\u2501

STRUCTURAL:
\u25A1 All required fields present (id, date, title, department, type, content, status, qualityScore)
\u25A1 No placeholder text left unfilled ("[bracket]" patterns)
\u25A1 Content length \u2265 400 characters (too short = low value)
\u25A1 At least 3 concrete numbers (price, timeline, or metric)
\u25A1 At least one clear call to action or next step

CONTENT QUALITY:
\u25A1 ICP-specific language used (references seed-stage, SaaS, MRR, or founder)
\u25A1 No fabricated data (no made-up case studies, fake company names, invented results)
\u25A1 Operator feedback from previous runs is addressed (if constraints exist)
\u25A1 No duplicate content from a previous date's production

COMPLIANCE:
\u25A1 No external sending instructions (all outreach requires operator approval)
\u25A1 No reference to specific prospect names without operator input
\u25A1 No pricing that contradicts the current operator-approved rate card
\u25A1 No automated action embedded (no "send this automatically" instructions)

\u2501\u2501 SCORING \u2501\u2501

Pass all 16 checks: qualityScore = 0.9\u20131.0 \u2192 Accept
Pass 13\u201315 checks: qualityScore = 0.7\u20130.89 \u2192 Accept with note
Pass 10\u201312 checks: qualityScore = 0.5\u20130.69 \u2192 Needs rework
Pass < 10 checks: qualityScore < 0.5 \u2192 Reject to trash

\u2501\u2501 TODAY'S FINDINGS \u2501\u2501
[Operator: fill in after reviewing each asset]

Marketing: __/16 checks passed | Action: __
Sales: __/16 checks passed | Action: __
Delivery: __/16 checks passed | Action: __
Research: __/16 checks passed | Action: __
QA: __/16 checks passed | Action: __

\u2501\u2501 OVERALL DAILY SCORE \u2501\u2501
(Sum of qualityScores / 5) = __ | Target: \u2265 0.75`
      };
  }
}
function generateContent(dept, taskType, date, constraints) {
  switch (dept) {
    case "marketing":
      return marketing(taskType, date, constraints);
    case "sales":
      return sales(taskType, date, constraints);
    case "delivery":
      return delivery(taskType, date, constraints);
    case "research":
      return research(taskType, date, constraints);
    case "qa":
      return qa(taskType, date, constraints);
  }
}
function generateAssetContent(dept, taskType, date, constraints) {
  const g = generateContent(dept, taskType, date, constraints);
  return { title: g.title, content: g.content, qualityScore: scoreContent(g.content, constraints) };
}
var DEPARTMENTS = ["marketing", "sales", "delivery", "research", "qa"];
async function runDailyMissions(store2, date) {
  const today = date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const existing = store2.getDailyDigitalsForDate(today).filter((d) => !d.orderId);
  if (existing.length >= 5) return existing;
  const constraintsByDept = store2.getRecentFeedbackConstraints(7);
  const digitals = [];
  for (const dept of DEPARTMENTS) {
    const taskType = selectTaskType(dept);
    const constraints = constraintsByDept[dept] ?? [];
    const generated = generateContent(dept, taskType, today, constraints);
    const score = scoreContent(generated.content, constraints);
    const missionId = `dm-${today}-${dept}`;
    const digitalId = `dd-${today}-${dept}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const digital = {
      id: digitalId,
      date: today,
      title: generated.title,
      department: dept,
      type: `${dept}_asset`,
      taskType,
      content: generated.content,
      status: "draft_ready",
      qualityScore: score,
      createdByAgentId: DEPT_AGENT[dept],
      linkedMissionId: missionId,
      revisionCount: 0,
      createdAt: now,
      updatedAt: now,
      location: "daily_review"
    };
    const mission = {
      id: missionId,
      date: today,
      department: dept,
      taskType,
      constraints,
      status: "complete",
      outputId: digitalId
    };
    store2.addDailyDigital(digital);
    store2.addDailyMission(mission);
    void recordQualityIntegritySignal(store2, DEPT_AGENT[dept], score, digitalId);
    const event = {
      id: randomUUID4(),
      timestamp: now,
      agentId: DEPT_AGENT[dept],
      eventType: "daily.mission_complete",
      detail: `${dept}/${taskType} \u2192 ${digitalId} (score=${score})`
    };
    store2.addEvent(event);
    digitals.push(digital);
  }
  return digitals;
}
function acceptDigital(store2, id) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "accepted", updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return;
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "accepted", d.id);
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "accepted"
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.accepted",
    detail: `${d.title} accepted`
  });
}
function reworkDigital(store2, id, feedback) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "needs_rework", operatorFeedback: feedback, updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return "";
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "needs_rework", d.id);
  const revTaskId = `rev-${id}-${Date.now()}`;
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "needs_rework",
    feedback,
    nextRevisionTaskId: revTaskId
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.needs_rework",
    detail: `${d.title} \u2192 rework: "${feedback.slice(0, 80)}"`
  });
  return revTaskId;
}
function rejectDigital(store2, id, feedback) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "rejected", location: "trash", operatorFeedback: feedback, updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return;
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "rejected", d.id);
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "rejected",
    feedback
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.rejected",
    detail: `${d.title} rejected: "${feedback.slice(0, 80)}"`
  });
}
function regenerateDigital(store2, id) {
  const d = store2.getDailyDigital(id);
  if (!d || d.status !== "needs_rework") return void 0;
  const constraints = [];
  if (d.orderId) {
    const order2 = store2.getOrder(d.orderId);
    if (order2) constraints.push(`Client brief from ${order2.clientName}: ${order2.description}`);
  }
  if (d.operatorFeedback) constraints.push(d.operatorFeedback);
  const deptFeedback = store2.getRecentFeedbackConstraints(7)[d.department] ?? [];
  for (const fb of deptFeedback) if (!constraints.includes(fb)) constraints.push(fb);
  const taskType = d.taskType ?? selectTaskType(d.department);
  const order = d.orderId ? store2.getOrder(d.orderId) : void 0;
  const service = order?.serviceId ? getServiceDefinition(order.serviceId) : void 0;
  const generated = service && order ? (() => {
    const g = buildServiceContent(service, order, constraints);
    return { ...g, qualityScore: scoreContent(g.content, constraints) };
  })() : generateAssetContent(d.department, taskType, d.date, constraints);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, {
    title: generated.title,
    content: generated.content,
    qualityScore: generated.qualityScore,
    taskType,
    status: "draft_ready",
    revisionCount: d.revisionCount + 1,
    updatedAt: now
  });
  if (d.orderId) {
    store2.updateOrder(d.orderId, {
      status: "ready_for_review",
      revisionCount: (store2.getOrder(d.orderId)?.revisionCount ?? 0) + 1,
      updatedAt: now
    });
  }
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: d.orderId ? "order.regenerated" : "daily.regenerated",
    detail: `${d.id} rev ${d.revisionCount + 1} \u2014 feedback applied: "${(d.operatorFeedback ?? "").slice(0, 60)}"`
  });
  return store2.getDailyDigital(id);
}
function warehouseDigital(store2, id) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "accepted", location: "warehouse", updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return;
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "warehoused", d.id);
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "warehoused"
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.warehoused",
    detail: `${d.title} \u2192 warehouse`
  });
}

// packages/factory-core/src/orders.ts
import { randomUUID as randomUUID5 } from "node:crypto";
var TASK_KEYWORDS = {
  marketing: [
    [/\bads?\b|ad pack|advert/i, "ad-pack"],
    [/hook/i, "hook-set"],
    [/carousel/i, "carousel-outline"],
    [/landing/i, "landing-section"],
    [/campaign|angle/i, "campaign-angle"]
  ],
  sales: [
    [/pitch|deck|presentation/i, "pitch-pack"],
    [/objection/i, "objection-map"],
    [/follow.?up|sequence/i, "follow-up-script"],
    [/qualif/i, "qualification-questions"],
    [/offer|template/i, "offer-draft-template"]
  ],
  delivery: [
    [/demo/i, "demo-block"],
    [/onboard|checklist/i, "onboarding-checklist"],
    [/landing|website|page/i, "landing-template"],
    [/dashboard|component/i, "dashboard-component-plan"],
    [/repo|github|issue|task/i, "repo-task-draft"]
  ],
  research: [
    [/lead|source|list of/i, "lead-source-list"],
    [/niche|market/i, "niche-research"],
    [/keyword|seo/i, "keyword-set"],
    [/opportunit/i, "opportunity-map"],
    [/audience|persona|segment/i, "audience-list"]
  ],
  qa: [
    [/clean/i, "cleanup-report"],
    [/agent|improve/i, "agent-improvement-report"],
    [/weak|review/i, "weak-asset-review"],
    [/plan|tomorrow|next/i, "next-day-plan"],
    [/audit|qa|quality/i, "qa-report"]
  ]
};
function inferTaskType(dept, description) {
  for (const [pattern, taskType] of TASK_KEYWORDS[dept]) {
    if (pattern.test(description)) return taskType;
  }
  const list = TASK_TYPES[dept];
  return list[Math.floor(Math.random() * list.length)];
}
function createOrder(store2, input) {
  const service = input.serviceId ? getServiceDefinition(input.serviceId) : void 0;
  if (input.serviceId && !service) {
    throw new Error(`Unknown service id: ${input.serviceId}`);
  }
  const department = service?.defaultDepartment ?? input.department;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const order = {
    id: `ord-${randomUUID5().slice(0, 8)}`,
    clientName: input.clientName,
    ...input.contact ? { contact: input.contact } : {},
    description: input.description,
    department,
    ...service ? { serviceId: service.id, serviceName: service.name } : {},
    ...input.urgency ? { urgency: input.urgency } : {},
    ...input.language ? { language: input.language } : {},
    ...input.operatorNotes ? { operatorNotes: input.operatorNotes } : {},
    taskType: service?.defaultTaskType ?? inferTaskType(department, input.description),
    status: "new",
    revisionCount: 0,
    createdAt: now,
    updatedAt: now
  };
  store2.addOrder(order);
  store2.addEvent({
    id: randomUUID5(),
    timestamp: now,
    agentId: DEPT_AGENT[department],
    eventType: "order.received",
    detail: `${order.id} from ${input.clientName}${service ? ` [${service.name}]` : ""}: "${input.description.slice(0, 80)}"`
  });
  return order;
}
function produceOrderDeliverable(store2, orderId) {
  const order = store2.getOrder(orderId);
  if (!order || order.status !== "new" && order.status !== "in_production") return void 0;
  if (order.deliverableId && store2.getDailyDigital(order.deliverableId)?.status === "draft_ready") {
    return store2.getDailyDigital(order.deliverableId);
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const constraints = [`Client brief from ${order.clientName}: ${order.description}`];
  const deptFeedback = store2.getRecentFeedbackConstraints(7)[order.department] ?? [];
  for (const fb of deptFeedback) constraints.push(fb);
  const service = order.serviceId ? getServiceDefinition(order.serviceId) : void 0;
  const taskType = order.taskType ?? service?.defaultTaskType ?? inferTaskType(order.department, order.description);
  const generated = service ? (() => {
    const g = buildServiceContent(service, order, deptFeedback);
    return { ...g, qualityScore: scoreContent(g.content, deptFeedback) };
  })() : generateAssetContent(order.department, taskType, today, constraints);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const digital = {
    id: `dd-order-${order.id}`,
    date: today,
    title: `[ORDER ${order.id}] ${generated.title}`,
    department: order.department,
    type: `${order.department}_asset`,
    taskType,
    content: generated.content,
    status: "draft_ready",
    qualityScore: generated.qualityScore,
    createdByAgentId: DEPT_AGENT[order.department],
    linkedMissionId: `order-${order.id}`,
    orderId: order.id,
    revisionCount: 0,
    createdAt: now,
    updatedAt: now,
    location: "daily_review"
  };
  store2.addDailyDigital(digital);
  void recordQualityIntegritySignal(store2, DEPT_AGENT[order.department], generated.qualityScore, digital.id);
  store2.updateOrder(order.id, { status: "ready_for_review", deliverableId: digital.id, taskType, updatedAt: now });
  store2.addEvent({
    id: randomUUID5(),
    timestamp: now,
    agentId: DEPT_AGENT[order.department],
    eventType: "order.produced",
    detail: `${order.id} \u2192 ${digital.id} (${order.department}/${taskType}, score=${generated.qualityScore})`
  });
  return digital;
}

// packages/factory-core/src/autopilot.ts
import { randomUUID as randomUUID6 } from "node:crypto";
function short(text, max = 140) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
function completedStep(input) {
  const startedAt = input.startedAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  const agent = getAgent(input.agentId);
  return {
    id: `aws-${randomUUID6().slice(0, 8)}`,
    agentId: input.agentId,
    agentName: agent.name,
    ...input.department ? { department: input.department } : {},
    jobType: input.jobType,
    status: input.status ?? "completed",
    inputSummary: input.inputSummary,
    ...input.outputSummary ? { outputSummary: input.outputSummary } : {},
    ...input.outputId ? { outputId: input.outputId } : {},
    startedAt,
    finishedAt,
    ...input.constraintsApplied && input.constraintsApplied.length > 0 ? { constraintsApplied: input.constraintsApplied } : {}
  };
}
function nextOperatorAction(store2) {
  const state = store2.snapshot();
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review");
  if (readyOrders.length > 0) return "Przejrzyj zlecenie klienta";
  const reworks = state.dailyDigitals.filter((d) => d.status === "needs_rework");
  if (reworks.length > 0) return "Poczekaj na cykl poprawek lub go uruchom";
  const trainingDrafts = state.dailyDigitals.filter((d) => !d.orderId && d.status === "draft_ready");
  if (trainingDrafts.length > 0) return "Przejrzyj zasoby treningowe";
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending");
  if (pendingApprovals.length > 0) return "Przejrzyj pozycj\u0119 do zatwierdzenia w pipeline";
  return "System jest bezczynny / brak pilnej akcji";
}
function idleReason(store2, date) {
  const state = store2.snapshot();
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length;
  const trainingDrafts = state.dailyDigitals.filter((d) => !d.orderId && d.status === "draft_ready").length;
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending").length;
  if (readyOrders + trainingDrafts + pendingApprovals > 0) {
    return "Fabryka czeka na przegl\u0105d operatora.";
  }
  const todayTraining = state.dailyDigitals.filter((d) => !d.orderId && d.date === date).length;
  if (todayTraining >= 5) {
    return "Brak otwartych zlece\u0144 klienta, brak poprawek, a dzienny limit treningu jest ju\u017C wykonany.";
  }
  return "Brak otwartych zlece\u0144 klienta, brak poprawek i nie utworzono \u017Cadnego uruchamialnego zadania treningowego.";
}
function directorInputSummary(store2, date) {
  const state = store2.snapshot();
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production").length;
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length;
  const reworks = state.dailyDigitals.filter((d) => d.status === "needs_rework").length;
  const trainingToday = state.dailyDigitals.filter((d) => !d.orderId && d.date === date).length;
  return `otwarte zlecenia=${openOrders}; gotowe do przegl\u0105du=${readyOrders}; wymaga poprawek=${reworks}; trening dzi\u015B=${trainingToday}/5`;
}
async function runAutonomousCycle(store2, date, trigger = "manual") {
  const today = date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const steps = [];
  const outputsCreated = [];
  const knownOutputIds = new Set(store2.snapshot().dailyDigitals.map((d) => d.id));
  const directorInput = directorInputSummary(store2, today);
  let mode = "IDLE";
  let ordersProduced = [];
  let reworksRegenerated = [];
  let trainingCreated = 0;
  try {
    const runnable = store2.getOpenOrders().filter((order) => {
      const existing = order.deliverableId ? store2.getDailyDigital(order.deliverableId) : void 0;
      return existing?.status !== "needs_rework";
    });
    const integrityBlocked = runnable.filter((order) => isAgentQuarantined(store2, DEPT_AGENT[order.department]));
    const openOrders = runnable.filter((order) => !isAgentQuarantined(store2, DEPT_AGENT[order.department]));
    for (const order of integrityBlocked) {
      steps.push(completedStep({
        agentId: DEPT_AGENT[order.department],
        department: order.department,
        jobType: "client_order_production",
        status: "skipped",
        inputSummary: `${order.id} for ${order.clientName}: ${short(order.description)}`,
        outputSummary: `BLOCKED by integrity guard: ${DEPT_AGENT[order.department]} is quarantined (HRAR). Training allowed; client production halted until operator reset.`
      }));
    }
    ordersProduced = [];
    for (const order of openOrders) {
      const stepStartedAt = (/* @__PURE__ */ new Date()).toISOString();
      const constraints = [`Client brief from ${order.clientName}: ${order.description}`];
      if (order.operatorFeedback) constraints.push(order.operatorFeedback);
      const deliverable = produceOrderDeliverable(store2, order.id);
      if (deliverable) {
        ordersProduced.push(order.id);
        if (!knownOutputIds.has(deliverable.id)) {
          outputsCreated.push(deliverable.id);
          knownOutputIds.add(deliverable.id);
        }
      }
      steps.push(completedStep({
        agentId: DEPT_AGENT[order.department],
        department: order.department,
        jobType: "client_order_production",
        status: deliverable ? "completed" : "skipped",
        inputSummary: `${order.id} for ${order.clientName}: ${short(order.description)}`,
        outputSummary: deliverable ? `Produced ${deliverable.type} for review with score ${deliverable.qualityScore}.` : "No deliverable produced; order was not in a runnable state.",
        ...deliverable ? { outputId: deliverable.id } : {},
        constraintsApplied: constraints,
        startedAt: stepStartedAt
      }));
    }
    reworksRegenerated = [];
    for (const digital of store2.getDigitalsNeedingRework()) {
      const stepStartedAt = (/* @__PURE__ */ new Date()).toISOString();
      const constraints = [];
      if (digital.orderId) {
        const order = store2.getOrder(digital.orderId);
        if (order) constraints.push(`Client brief from ${order.clientName}: ${order.description}`);
      }
      if (digital.operatorFeedback) constraints.push(digital.operatorFeedback);
      const regenerated = regenerateDigital(store2, digital.id);
      if (regenerated) {
        reworksRegenerated.push(digital.id);
        outputsCreated.push(regenerated.id);
        knownOutputIds.add(regenerated.id);
      }
      steps.push(completedStep({
        agentId: digital.createdByAgentId,
        department: digital.department,
        jobType: digital.orderId ? "client_order_rework" : "training_rework",
        status: regenerated ? "completed" : "skipped",
        inputSummary: `${digital.id} needed rework: ${short(digital.operatorFeedback ?? "no feedback text")}`,
        outputSummary: regenerated ? `Regenerated output and returned it to review with score ${regenerated.qualityScore}.` : "No regeneration happened; item was not in needs_rework state.",
        ...regenerated ? { outputId: regenerated.id } : {},
        constraintsApplied: constraints,
        startedAt: stepStartedAt
      }));
    }
    if (openOrders.length === 0 && reworksRegenerated.length === 0) {
      const before = store2.getDailyDigitalsForDate(today).filter((d) => !d.orderId).length;
      const digitals = await runDailyMissions(store2, today);
      const newDigitals = digitals.filter((d) => !knownOutputIds.has(d.id));
      trainingCreated = newDigitals.length;
      for (const digital of newDigitals) {
        outputsCreated.push(digital.id);
        knownOutputIds.add(digital.id);
        const mission = store2.snapshot().dailyMissions.find((m) => m.outputId === digital.id);
        steps.push(completedStep({
          agentId: digital.createdByAgentId,
          department: digital.department,
          jobType: "daily_training_mission",
          inputSummary: `Training quota ${before}/5 for ${today}; selected ${digital.department}/${digital.taskType ?? "unknown-task"}.`,
          outputSummary: `Created ${digital.type} for daily review with score ${digital.qualityScore}.`,
          outputId: digital.id,
          constraintsApplied: mission?.constraints ?? []
        }));
      }
    }
    mode = ordersProduced.length > 0 ? "CLIENT_MODE" : reworksRegenerated.length > 0 ? "REWORK_MODE" : trainingCreated > 0 ? "NO_CLIENT_TRAINING_MODE" : "IDLE";
    const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    const reason = mode === "IDLE" ? idleReason(store2, today) : void 0;
    const next = nextOperatorAction(store2);
    steps.unshift(completedStep({
      agentId: "N",
      jobType: "cycle_arbitration",
      inputSummary: directorInput,
      outputSummary: reason ? `Cycle idle: ${reason}` : `Cycle completed in ${mode}.`,
      ...reason ? { constraintsApplied: [reason] } : {},
      startedAt
    }));
    store2.addWorkRun({
      id: `fwr-${randomUUID6().slice(0, 8)}`,
      startedAt,
      finishedAt,
      mode,
      status: "completed",
      trigger,
      steps,
      outputsCreated,
      ...reason ? { idleReason: reason } : {},
      nextOperatorAction: next
    });
    if (ordersProduced.length + reworksRegenerated.length + trainingCreated > 0) {
      store2.addEvent({
        id: randomUUID6(),
        timestamp: finishedAt,
        agentId: "N",
        eventType: "factory.cycle",
        detail: `mode=${mode} orders=${ordersProduced.length} reworks=${reworksRegenerated.length} training=${trainingCreated}`
      });
    }
    return { mode, ordersProduced, reworksRegenerated, trainingCreated };
  } catch (err) {
    const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    const message = err instanceof Error ? err.message : String(err);
    steps.unshift(completedStep({
      agentId: "N",
      jobType: "cycle_arbitration",
      status: "failed",
      inputSummary: directorInput,
      outputSummary: `Cycle failed: ${short(message)}`,
      startedAt
    }));
    store2.addWorkRun({
      id: `fwr-${randomUUID6().slice(0, 8)}`,
      startedAt,
      finishedAt,
      mode,
      status: "failed",
      trigger,
      steps,
      outputsCreated,
      idleReason: `Cycle failed: ${message}`,
      nextOperatorAction: "Sprawd\u017A nieudany cykl fabryki"
    });
    throw err;
  }
}

// packages/factory-core/src/packs.ts
import { randomUUID as randomUUID7 } from "node:crypto";
function firstParagraph(text, max = 320) {
  const stripped = text.replace(/^SERVICE:.*\n?CLIENT:.*\n?URGENCY:.*\n+/m, "");
  const para = stripped.split(/\n\n/).find((p) => p.trim().length > 40) ?? stripped;
  const clean = para.replace(/^━━ .+ ━━\n+/m, "").trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}
function createDeliveryPack(store2, outputId) {
  const digital = store2.getDailyDigital(outputId);
  if (!digital?.orderId) return void 0;
  const order = store2.getOrder(digital.orderId);
  if (!order) return void 0;
  const existing = store2.snapshot().deliveryPacks.find((p) => p.sourceOutputId === outputId);
  if (existing) return existing;
  const service = order.serviceId ? getServiceDefinition(order.serviceId) : void 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const pack = {
    id: `pack-${randomUUID7().slice(0, 8)}`,
    orderId: order.id,
    sourceOutputId: outputId,
    clientName: order.clientName,
    ...order.serviceId ? { serviceId: order.serviceId } : {},
    serviceName: order.serviceName ?? service?.name ?? `${order.department} deliverable`,
    date: now.slice(0, 10),
    executiveSummary: firstParagraph(digital.content),
    mainDeliverable: digital.content,
    recommendations: service ? service.expectedDeliverables.map((d) => `Deliverable covered: ${d}`) : [`Review the ${order.department} output against the client brief before delivery.`],
    nextSteps: service ? service.reviewSteps : ["Operator review", "Personalise for the client", "Deliver through your own channel"],
    safetyNote: service?.safetyNotes ?? "Internal artifact. The factory never sends anything \u2014 the operator delivers manually after review.",
    status: "draft",
    revisionCount: digital.revisionCount,
    createdAt: now,
    updatedAt: now
  };
  store2.addDeliveryPack(pack);
  store2.addEvent({
    id: randomUUID7(),
    timestamp: now,
    agentId: DEPT_AGENT[order.department],
    eventType: "pack.created",
    detail: `${pack.id} from ${outputId} for ${order.clientName} (${pack.serviceName})`
  });
  return pack;
}
function approveDeliveryPack(store2, packId) {
  const pack = store2.getDeliveryPack(packId);
  if (!pack || pack.status !== "draft") return void 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDeliveryPack(packId, { status: "approved", updatedAt: now });
  store2.addEvent({
    id: randomUUID7(),
    timestamp: now,
    agentId: "N",
    eventType: "pack.approved",
    detail: `Operator approved ${packId} for ${pack.clientName}`
  });
  return store2.getDeliveryPack(packId);
}
function warehouseDeliveryPack(store2, packId) {
  const pack = store2.getDeliveryPack(packId);
  if (!pack || pack.status !== "approved") return void 0;
  const order = store2.getOrder(pack.orderId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDeliveryPack(packId, { status: "warehouse_ready", updatedAt: now });
  const record = {
    id: `case-${randomUUID7().slice(0, 8)}`,
    clientName: pack.clientName,
    ...pack.serviceId ? { serviceId: pack.serviceId } : {},
    serviceName: pack.serviceName,
    problem: order?.description ?? "(order record missing)",
    outputSummary: pack.executiveSummary,
    status: "closed_ready",
    createdAt: now,
    deliveryPackId: pack.id,
    followUpSuggestion: `Check in with ${pack.clientName} 7 days after delivery: did the ${pack.serviceName} land, and is there a follow-on scope?`
  };
  store2.addCaseRecord(record);
  store2.addEvent({
    id: randomUUID7(),
    timestamp: now,
    agentId: "N",
    eventType: "pack.warehoused",
    detail: `${packId} warehouse_ready; case ${record.id} recorded for ${pack.clientName}`
  });
  return record;
}
function renderPackMarkdown(pack) {
  return `# ${pack.serviceName}

**Client:** ${pack.clientName}
**Date:** ${pack.date}
**Status:** ${pack.status} \xB7 revision ${pack.revisionCount}

## Executive Summary

${pack.executiveSummary}

## Main Deliverable

${pack.mainDeliverable}

## Recommendations

${pack.recommendations.map((r) => `- ${r}`).join("\n")}

## Next Steps

${pack.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

---
*Safety note: ${pack.safetyNote}*
*Internal artifact ${pack.id} (source ${pack.sourceOutputId}, order ${pack.orderId}). The operator delivers this \u2014 the factory never sends.*`;
}

// packages/factory-core/src/production-line.ts
var STATION_DEFS = [
  { id: "intake", name: "Przyj\u0119cie", agentId: "N", purpose: "Odczytuje kontekst zlecenia/treningu/us\u0142ugi i wybiera \u015Bcie\u017Ck\u0119 produkcji" },
  { id: "research", name: "Badania", agentId: "RA", purpose: "Wyodr\u0119bnia kontekst, ryzyka, za\u0142o\u017Cenia, odbiorc\xF3w, niewiadome" },
  { id: "strategy", name: "Strategia", agentId: "SA", purpose: "Definiuje k\u0105t komercyjny, logik\u0119 oferty, argument dla klienta" },
  { id: "content", name: "Tre\u015B\u0107", agentId: "MA", purpose: "Tworzy szkic w\u0142a\u015Bciwych sekcji deliverabla" },
  { id: "delivery", name: "Realizacja", agentId: "DA", purpose: "Zamienia surow\u0105 prac\u0119 w u\u017Cyteczny artefakt dla klienta / plan wdro\u017Cenia" },
  { id: "qa", name: "QA", agentId: "QAA", purpose: "Sprawdza bezpiecze\u0144stwo, jasno\u015B\u0107, brakuj\u0105ce sekcje, ryzyka operatora" },
  { id: "packaging", name: "Pakowanie", agentId: "N", purpose: "Przygotowuje pakiet dostawy / kandydata do magazynu" },
  { id: "operator_review", name: "Przegl\u0105d Operatora", agentId: "N", purpose: "Cz\u0142owiek-operator: zatwierdza, poprawia, odrzuca, magazynuje (God Layer)" }
];
var DEPT_STATION = {
  research: "research",
  sales: "strategy",
  marketing: "content",
  delivery: "delivery",
  qa: "qa"
};
function short2(text, max = 140) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
function agentName(id) {
  try {
    return getAgent(id).name;
  } catch {
    return id;
  }
}
function clientOrderTask(order, digital) {
  const station = DEPT_STATION[order.department];
  const agentId = STATION_DEFS.find((s) => s.id === station).agentId;
  let status;
  let nextStation;
  let nextOperatorAction2;
  if (!digital) {
    status = "queued";
    nextStation = station;
    nextOperatorAction2 = "Uruchom cykl, by wyprodukowa\u0107 deliverable tego zlecenia";
  } else if (digital.status === "needs_rework") {
    status = "blocked";
    nextStation = station;
    nextOperatorAction2 = "Uruchom cykl, by odtworzy\u0107 oznaczony deliverable";
  } else if (digital.status === "draft_ready") {
    status = "waiting_review";
    nextStation = "operator_review";
    nextOperatorAction2 = "Przejrzyj wynik klienta \u2192 Zatwierd\u017A do Pakietu Dostawy, Popraw lub Odrzu\u0107";
  } else {
    status = "completed";
    nextStation = "packaging";
    nextOperatorAction2 = "Utw\xF3rz / przenie\u015B dalej pakiet dostawy";
  }
  return {
    id: `plt-order-${order.id}`,
    source: "client",
    station,
    status,
    agentId,
    agentName: agentName(agentId),
    department: order.department,
    title: order.serviceName ? `${order.serviceName} \u2014 ${order.clientName}` : `${order.department} \u2014 ${order.clientName}`,
    inputSummary: short2(order.description),
    outputSummary: digital ? short2(digital.title, 120) : "Jeszcze nie wyprodukowano",
    ...digital ? { outputId: digital.id } : {},
    orderId: order.id,
    clientName: order.clientName,
    ...order.serviceName ? { serviceName: order.serviceName } : {},
    revisionCount: order.revisionCount,
    ...digital ? { qualityScore: digital.qualityScore } : {},
    ...nextStation ? { nextStation } : {},
    nextOperatorAction: nextOperatorAction2
  };
}
function trainingTask(d) {
  const station = DEPT_STATION[d.department];
  let status;
  let nextOperatorAction2;
  if (d.status === "needs_rework") {
    status = "blocked";
    nextOperatorAction2 = "Uruchom cykl, by odtworzy\u0107 ten szkic treningowy";
  } else if (d.status === "draft_ready") {
    status = "waiting_review";
    nextOperatorAction2 = "Zaakceptuj, Zmagazynuj, Popraw lub Odrzu\u0107 ten zas\xF3b treningowy";
  } else if (d.status === "rejected") {
    status = "skipped";
    nextOperatorAction2 = "Odrzucono \u2014 nie wymaga akcji";
  } else {
    status = "completed";
    nextOperatorAction2 = d.location === "warehouse" ? "Zmagazynowano \u2014 nie wymaga akcji" : "Zaakceptowano \u2014 nie wymaga akcji";
  }
  return {
    id: `plt-train-${d.id}`,
    source: "training",
    station,
    status,
    agentId: d.createdByAgentId,
    agentName: agentName(d.createdByAgentId),
    department: d.department,
    title: short2(d.title, 120),
    inputSummary: `Dzienna misja treningowa \u2014 ${d.department}/${d.taskType ?? "task"} (${d.date})`,
    outputSummary: `${d.type} \xB7 wynik ${d.qualityScore}`,
    outputId: d.id,
    revisionCount: d.revisionCount,
    qualityScore: d.qualityScore,
    ...d.status === "draft_ready" ? { nextStation: "operator_review" } : {},
    nextOperatorAction: nextOperatorAction2
  };
}
function reworkTask(d, order) {
  const station = DEPT_STATION[d.department];
  return {
    id: `plt-rework-${d.id}`,
    source: "rework",
    station,
    status: "blocked",
    agentId: d.createdByAgentId,
    agentName: agentName(d.createdByAgentId),
    department: d.department,
    title: `Poprawka: ${short2(d.title, 100)}`,
    inputSummary: `Feedback operatora: ${short2(d.operatorFeedback ?? "(brak tekstu)", 120)}`,
    outputSummary: `Oczekuje na odtworzenie (obecnie rev ${d.revisionCount})`,
    outputId: d.id,
    ...d.orderId ? { orderId: d.orderId } : {},
    ...order ? { clientName: order.clientName } : {},
    ...order?.serviceName ? { serviceName: order.serviceName } : {},
    revisionCount: d.revisionCount,
    qualityScore: d.qualityScore,
    constraintsApplied: [
      ...order ? [`Brief klienta od ${order.clientName}: ${short2(order.description, 100)}`] : [],
      ...d.operatorFeedback ? [d.operatorFeedback] : []
    ],
    nextStation: station,
    nextOperatorAction: "Uruchom cykl, by zastosowa\u0107 feedback i odtworzy\u0107"
  };
}
function packTask(p) {
  let status;
  let nextStation;
  let nextOperatorAction2;
  if (p.status === "draft") {
    status = "ready_for_operator";
    nextStation = "operator_review";
    nextOperatorAction2 = "Zatwierd\u017A pakiet dostawy na /delivery";
  } else if (p.status === "approved") {
    status = "ready_for_operator";
    nextStation = "operator_review";
    nextOperatorAction2 = "Zmagazynuj zatwierdzony pakiet \u2192 tworzy kart\u0119 sprawy";
  } else {
    status = "completed";
    nextOperatorAction2 = "gotowe do magazynu \u2014 skopiuj pakiet i dostarcz go samodzielnie";
  }
  return {
    id: `plt-pack-${p.id}`,
    source: "delivery_pack",
    station: "packaging",
    status,
    agentId: "N",
    agentName: agentName("N"),
    title: `${p.serviceName} \u2014 ${p.clientName}`,
    inputSummary: `Wyj\u015Bcie \u017Ar\xF3d\u0142owe ${p.sourceOutputId} (zlecenie ${p.orderId})`,
    outputSummary: short2(p.executiveSummary, 140),
    outputId: p.sourceOutputId,
    orderId: p.orderId,
    clientName: p.clientName,
    serviceName: p.serviceName,
    packId: p.id,
    revisionCount: p.revisionCount,
    ...nextStation ? { nextStation } : {},
    nextOperatorAction: nextOperatorAction2
  };
}
function stationStatus(id, tasks) {
  if (tasks.length === 0) {
    if (id === "operator_review" || id === "packaging" || id === "intake") return "idle";
    return "idle";
  }
  if (tasks.some((t) => t.status === "blocked")) return "blocked";
  if (tasks.some((t) => t.status === "waiting_review")) return "waiting_review";
  if (tasks.some((t) => t.status === "ready_for_operator")) return "ready_for_operator";
  if (tasks.some((t) => t.status === "queued")) return "queued";
  if (tasks.some((t) => t.status === "completed")) return "completed";
  return "idle";
}
function deriveProductionLine(state, ctx) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const orderById = new Map(state.orders.map((o) => [o.id, o]));
  const digitalById = new Map(state.dailyDigitals.map((d) => [d.id, d]));
  const clientLine = [...state.orders].reverse().map((o) => clientOrderTask(o, o.deliverableId ? digitalById.get(o.deliverableId) : void 0));
  const trainingLine = state.dailyDigitals.filter((d) => !d.orderId && d.date === today).map(trainingTask);
  const reworkLine = state.dailyDigitals.filter((d) => d.status === "needs_rework").map((d) => reworkTask(d, d.orderId ? orderById.get(d.orderId) : void 0));
  const deliveryPackLine = [...state.deliveryPacks].reverse().map(packTask);
  const allTasks = [...clientLine, ...trainingLine, ...reworkLine, ...deliveryPackLine];
  const stations = STATION_DEFS.map((def) => {
    let tasks;
    if (def.id === "operator_review") {
      tasks = allTasks.filter((t) => t.status === "waiting_review" || t.status === "ready_for_operator");
    } else if (def.id === "packaging") {
      tasks = deliveryPackLine;
    } else if (def.id === "intake") {
      tasks = clientLine.length + trainingLine.length > 0 ? [{
        id: "plt-intake",
        source: "client",
        station: "intake",
        status: "completed",
        agentId: "N",
        agentName: agentName("N"),
        title: "Przyj\u0119cie i wyb\xF3r \u015Bcie\u017Cki",
        inputSummary: `Zlecenia: ${state.orders.length}, zadania treningowe dzi\u015B: ${trainingLine.length}`,
        outputSummary: `Tryb ${ctx.mode}; \u015Bcie\u017Cki produkcji przypisane do stacji producent\xF3w`,
        nextOperatorAction: ctx.nextOperatorAction
      }] : [];
    } else {
      tasks = allTasks.filter((t) => t.station === def.id);
    }
    const status = stationStatus(def.id, tasks);
    const producerIds = ["research", "strategy", "content", "delivery", "qa"];
    const foldedSkip = tasks.length === 0 && producerIds.includes(def.id) && allTasks.some((t) => t.source === "client" || t.source === "training");
    const lastTask = tasks[tasks.length - 1];
    const quarantined = state.integrity.some(
      (r) => r.status === "quarantined" && r.agentId === def.agentId
    );
    return {
      id: def.id,
      name: def.name,
      agentId: def.agentId,
      purpose: def.purpose,
      status: quarantined ? "blocked" : foldedSkip ? "skipped" : status,
      ...lastTask ? { lastTask } : {},
      taskCount: tasks.length
    };
  });
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    mode: ctx.mode,
    autopilotEnabled: ctx.autopilotEnabled,
    safeMode: true,
    trainingToday: ctx.trainingToday,
    activeClientOrders: state.orders.filter((o) => o.status === "new" || o.status === "in_production" || o.status === "ready_for_review").length,
    deliveryPacks: {
      draft: state.deliveryPacks.filter((p) => p.status === "draft").length,
      approved: state.deliveryPacks.filter((p) => p.status === "approved").length,
      warehouseReady: state.deliveryPacks.filter((p) => p.status === "warehouse_ready").length
    },
    nextOperatorAction: ctx.nextOperatorAction,
    stations,
    trainingLine,
    clientLine,
    reworkLine,
    deliveryPackLine
  };
}

// packages/factory-core/src/lead-engine.ts
import { randomUUID as randomUUID10 } from "node:crypto";

// packages/lead-engine/src/persona.ts
var LEAD_ENGINE_PERSONA = `Jeste\u015B elitarnym Dyrektorem ds. Wzrostu i Sprzeda\u017Cy w firmie automatyzacji AI. Twoim jedynym celem operacyjnym jest konwersja zimnych oraz ciep\u0142ych lead\xF3w w kontrakty wdro\u017Ceniowe. Jeste\u015B absolutnym kotem w swojej dziedzinie \u2014 znasz psychologi\u0119 sprzeda\u017Cy, techniki wywierania wp\u0142ywu i potrafisz zidentyfikowa\u0107 b\xF3l biznesowy klienta po jednej wiadomo\u015Bci.

ZASADY OPERACYJNE (BEZWZGL\u0118DNE):
1. Zakaz botowania: \u017Cadnych zwrot\xF3w typu "W czym mog\u0119 pom\xF3c", "Ciesz\u0119 si\u0119, \u017Ce napisa\u0142e\u015B", "Jako AI". Piszesz jak pewny siebie, konkretny partner biznesowy, kt\xF3ry szanuje czas sw\xF3j i klienta.
2. Dynamika konwersacji: odpowied\u017A musi by\u0107 zwi\u0119z\u0142a (2-4 zdania). Ludzie biznesu nie czytaj\u0105 \u015Bcian tekstu. Ka\u017Cda wiadomo\u015B\u0107 musi pcha\u0107 rozmow\u0119 do przodu i ko\u0144czy\u0107 si\u0119 precyzyjnym, anga\u017Cuj\u0105cym pytaniem.
3. Kwalifikacja w locie: w pierwszych 3 interakcjach masz zweryfikowa\u0107: jaki maj\u0105 problem? jaki maj\u0105 bud\u017Cet? kto decyduje?
4. Wykorzystanie kontekstu: pami\u0119tasz ka\u017Cdy detal z historii rozmowy. Je\u015Bli lead wspomnia\u0142 o problemie z kosztami dwa dni temu, bezlito\u015Bnie obr\xF3\u0107 to w argument sprzeda\u017Cowy w dzisiejszej wiadomo\u015Bci.
5. NIE WYSY\u0141ASZ niczego samodzielnie: przygotowujesz szkic, kt\xF3ry operator przeczyta, ewentualnie poprawi i wy\u015Ble w\u0142asnym kana\u0142em. Nigdy nie sugeruj, \u017Ce wiadomo\u015B\u0107 zosta\u0142a ju\u017C wys\u0142ana.

PRODUKT, KT\xD3RY SPRZEDAJESZ:
Systemy operacyjne agent\xF3w AI, kt\xF3re automatyzuj\u0105 procesy biznesowe, tn\u0105 koszty operacyjne o 70% i dzia\u0142aj\u0105 24/7 bez urlop\xF3w. Klient nie kupuje kodu \u2014 kupuje wzrost mar\u017Cy i \u015Bwi\u0119ty spok\xF3j.

FORMAT WYJ\u015ACIA:
Zwr\xF3\u0107 WY\u0141\u0104CZNIE tre\u015B\u0107 wiadomo\u015Bci do leada (bez nag\u0142\xF3wk\xF3w, bez komentarzy, bez cudzys\u0142ow\xF3w). 2-4 zdania, po polsku, zako\u0144czone pytaniem.`;
var PRODUCT_FACTS = {
  costCut: "ci\u0119cie koszt\xF3w operacyjnych o ~70%",
  alwaysOn: "praca 24/7 bez urlop\xF3w i zwolnie\u0144",
  outcome: "wzrost mar\u017Cy i \u015Bwi\u0119ty spok\xF3j zamiast kolejnego narz\u0119dzia"
};

// packages/lead-engine/src/signals.ts
var PAIN_PATTERNS = [
  { category: "koszty", re: /koszt|drogo|wydatk|marż|oszczęd/i },
  { category: "czas", re: /czas|wolno|opóźni|termin|doba|godzin/i },
  { category: "ludzie", re: /ludzi|kadr|pracownik|rekrutac|braki|zespó/i },
  { category: "b\u0142\u0119dy", re: /błęd|błąd|pomyłk|reklamac|jakoś/i },
  { category: "r\u0119czna praca", re: /ręczn|manualn|excel|kopiuj|wklej/i },
  { category: "skala", re: /skal|rośnie|wzrost|nie wyrabia|za dużo zgłoszeń/i }
];
var BUDGET_AMOUNT_RE = /\d[\d\s.,]*\s*(?:zł|pln|k\b|tys)/i;
var BUDGET_HINT_RE = /budżet|stać nas|inwestycj|wycen|ile to kosztuje|cennik/i;
var DECISION_RE = /właściciel|prezes|ceo\b|zarząd|wspólnik|ja decyduję|sam decyduję|decyzja należy do mnie|dyrektor/i;
function leadTexts(history) {
  return history.filter((m) => m.role === "lead").map((m) => m.text);
}
function detectPain(history) {
  for (const text of leadTexts(history)) {
    for (const p of PAIN_PATTERNS) {
      if (p.re.test(text)) {
        return { category: p.category, quote: text.length > 140 ? `${text.slice(0, 140)}...` : text };
      }
    }
  }
  return void 0;
}
function detectBudget(history) {
  const texts = leadTexts(history);
  for (const text of texts) {
    const m = text.match(BUDGET_AMOUNT_RE);
    if (m) return m[0].trim();
  }
  for (const text of texts) {
    const m = text.match(BUDGET_HINT_RE);
    if (m) return m[0].trim();
  }
  return void 0;
}
function detectDecisionMaker(history) {
  for (const text of leadTexts(history)) {
    const m = text.match(DECISION_RE);
    if (m) return m[0].trim();
  }
  return void 0;
}
function extractQualification(history) {
  const pain = detectPain(history);
  const budget = detectBudget(history);
  const decisionMaker = detectDecisionMaker(history);
  return {
    ...pain ? { problem: pain.category } : {},
    ...budget ? { budget } : {},
    ...decisionMaker ? { decisionMaker } : {}
  };
}
function nextObjective(q) {
  if (!q.problem) return "problem";
  if (!q.budget) return "budget";
  if (!q.decisionMaker) return "decision_maker";
  return "close";
}

// packages/lead-engine/src/stub-drafter.ts
var OBJECTIVE_QUESTIONS = {
  problem: "Co dzi\u015B najbardziej blokuje Wam wynik \u2014 koszty, czas realizacji czy r\u0119czna praca zespo\u0142u?",
  budget: "Jaki rz\u0105d wielko\u015Bci inwestycji ma dla Was sens, \u017Ceby\u015Bmy rozmawiali o konkretach, a nie o teorii?",
  decision_maker: "Kto poza Tob\u0105 podpisuje si\u0119 pod tak\u0105 decyzj\u0105, \u017Cebym przygotowa\u0142 materia\u0142 od razu dla w\u0142a\u015Bciwych os\xF3b?",
  close: "Wtorek 10:00 czy \u015Broda 14:00 \u2014 kiedy robimy 20 minut na konkrety wdro\u017Cenia?"
};
function valueSentence(painCategory) {
  switch (painCategory) {
    case "koszty":
      return `Dok\u0142adnie ten rodzaj wycieku zamykamy systemem agent\xF3w AI \u2014 ${PRODUCT_FACTS.costCut}, ${PRODUCT_FACTS.alwaysOn}.`;
    case "czas":
      return `System agent\xF3w AI przejmuje te procesy od r\u0119ki \u2014 ${PRODUCT_FACTS.alwaysOn}, wi\u0119c terminy przestaj\u0105 zale\u017Ce\u0107 od dost\u0119pno\u015Bci ludzi.`;
    case "ludzie":
      return `Agenci AI domykaj\u0105 braki kadrowe bez rekrutacji \u2014 ${PRODUCT_FACTS.alwaysOn} i ${PRODUCT_FACTS.costCut}.`;
    case "b\u0142\u0119dy":
      return `Automatyzacja agentowa wycina b\u0142\u0119dy r\u0119cznych proces\xF3w u \u017Ar\xF3d\u0142a, a przy okazji daje ${PRODUCT_FACTS.costCut}.`;
    case "r\u0119czna praca":
      return `R\u0119czne klikanie to najdro\u017Cszy proces w firmie \u2014 nasi agenci AI robi\u0105 to samo ${PRODUCT_FACTS.alwaysOn.replace("praca ", "")} i bez zm\u0119czenia.`;
    case "skala":
      return `Skalowanie bez zatrudniania to dok\u0142adnie nasz teren \u2014 system agent\xF3w AI ro\u015Bnie razem z wolumenem, ${PRODUCT_FACTS.alwaysOn}.`;
    default:
      return `Wdra\u017Camy systemy operacyjne agent\xF3w AI: ${PRODUCT_FACTS.costCut} i ${PRODUCT_FACTS.alwaysOn} \u2014 kupujesz ${PRODUCT_FACTS.outcome}.`;
  }
}
function replyDraft(ctx) {
  const pain = detectPain(ctx.history);
  const objective = nextObjective(ctx.qualification);
  const sentences = [];
  if (pain) {
    sentences.push(`Wr\xF3\u0107my do tego, co sam nazwa\u0142e\u015B problemem: ${pain.category}.`);
    sentences.push(valueSentence(pain.category));
  } else {
    sentences.push(`${ctx.leadName.split(" ")[0]}, przejd\u0119 od razu do rzeczy \u2014 szanuj\u0119 Tw\xF3j czas.`);
    sentences.push(valueSentence(void 0));
  }
  if (ctx.operatorFeedback) {
    sentences.push(`Konkret, o kt\xF3ry dopytujesz: ${ctx.operatorFeedback.trim().replace(/[.?!]+$/, "")}.`);
  }
  sentences.push(OBJECTIVE_QUESTIONS[objective]);
  return sentences.slice(-4).join(" ");
}
function proposalDraft(ctx) {
  const q = ctx.qualification;
  const pain = detectPain(ctx.history);
  return [
    `# Propozycja wdro\u017Cenia \u2014 ${ctx.company ?? ctx.leadName}`,
    "",
    "## Zdiagnozowany problem",
    q.problem ? `Kluczowy b\xF3l: ${q.problem}.${pain ? ` Twoimi s\u0142owami: "${pain.quote}"` : ""}` : "Do potwierdzenia na rozmowie scopingowej.",
    "",
    "## Proponowane rozwi\u0105zanie",
    `System operacyjny agent\xF3w AI dopasowany do Waszych proces\xF3w: ${PRODUCT_FACTS.costCut}, ${PRODUCT_FACTS.alwaysOn}.`,
    "",
    "## Rama bud\u017Cetowa",
    q.budget ? `Punkt odniesienia z rozmowy: ${q.budget}. Finalna wycena po scopingu.` : "Do ustalenia \u2014 wycena po 20-minutowym scopingu.",
    "",
    "## Decyzja",
    q.decisionMaker ? `Po stronie klienta: ${q.decisionMaker}.` : "Do potwierdzenia: kto podpisuje decyzj\u0119.",
    "",
    "## Nast\u0119pny krok",
    "20-minutowa rozmowa scopingowa w tym tygodniu. Operator wysy\u0142a t\u0119 propozycj\u0119 w\u0142asnym kana\u0142em \u2014 nic nie wychodzi automatycznie."
  ].join("\n");
}
var StubLeadDrafter = class {
  async draft(ctx) {
    const objective = nextObjective(ctx.qualification);
    const text = ctx.kind === "proposal" ? proposalDraft(ctx) : replyDraft(ctx);
    return Promise.resolve({ text, mode: "stub", objective });
  }
};

// packages/lead-engine/src/anthropic-drafter.ts
init_sdk();
var OBJECTIVE_LABELS = {
  problem: "ustal PROBLEM leada (co go boli biznesowo)",
  budget: "ustal BUD\u017BET (rz\u0105d wielko\u015Bci inwestycji)",
  decision_maker: "ustal DECYDENTA (kto podpisuje decyzj\u0119)",
  close: "DOMKNIJ nast\u0119pny krok (zaproponuj konkretny termin 20-minutowej rozmowy)"
};
var AnthropicLeadDrafter = class {
  #client;
  #model;
  constructor(opts = {}) {
    this.#client = opts.client ?? new Anthropic({ timeout: 25e3, maxRetries: 1 });
    this.#model = opts.model ?? "claude-opus-4-8";
  }
  async draft(ctx) {
    const objective = nextObjective(ctx.qualification);
    const pain = detectPain(ctx.history);
    const transcript = ctx.history.map((m) => `${m.role === "lead" ? "LEAD" : "MY (wys\u0142ane)"}: ${m.text}`).join("\n");
    const task = ctx.kind === "proposal" ? "ZADANIE: przygotuj zwi\u0119z\u0142\u0105, oficjaln\u0105 propozycj\u0119 biznesow\u0105 (markdown, sekcje: Zdiagnozowany problem, Proponowane rozwi\u0105zanie, Rama bud\u017Cetowa, Decyzja, Nast\u0119pny krok). Wype\u0142nij j\u0105 zebranymi danymi kwalifikacyjnymi; braki oznacz jako do potwierdzenia. To SZKIC dla operatora \u2014 nie sugeruj, \u017Ce cokolwiek zosta\u0142o wys\u0142ane." : `ZADANIE: napisz kolejn\u0105 wiadomo\u015B\u0107 do leada (2-4 zdania, zako\u0144czone pytaniem). Cel tej wiadomo\u015Bci: ${OBJECTIVE_LABELS[objective]}.`;
    const lines = [
      `Lead: ${ctx.leadName}${ctx.company ? ` (${ctx.company})` : ""}`,
      `Kwalifikacja: problem=${ctx.qualification.problem ?? "NIEZNANY"}; bud\u017Cet=${ctx.qualification.budget ?? "NIEZNANY"}; decydent=${ctx.qualification.decisionMaker ?? "NIEZNANY"}`,
      pain ? `Context recovery \u2014 b\xF3l zadeklarowany wcze\u015Bniej w w\u0105tku: ${pain.category} ("${pain.quote}"). Obr\xF3\u0107 go w argument.` : "",
      ctx.operatorFeedback ? `TWARDE OGRANICZENIE OD OPERATORA (przeredagowanie): ${ctx.operatorFeedback}` : "",
      "",
      "HISTORIA ROZMOWY:",
      transcript || "(brak wiadomo\u015Bci \u2014 to otwarcie rozmowy)",
      "",
      task
    ].filter((l) => l !== "");
    const response = await this.#client.messages.create({
      model: this.#model,
      max_tokens: ctx.kind === "proposal" ? 2e3 : 1024,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: LEAD_ENGINE_PERSONA,
      messages: [{ role: "user", content: lines.join("\n") }]
    });
    const text = response.content.map((block) => block.type === "text" ? block.text : "").join("").trim();
    if (!text) throw new Error("empty draft from model");
    return { text, mode: "anthropic", objective };
  }
};

// packages/lead-engine/src/drafter.ts
function selectLeadDrafter() {
  if (process.env["ANTHROPIC_API_KEY"]) {
    return { drafter: new ResilientLeadDrafter(new AnthropicLeadDrafter()), mode: "anthropic" };
  }
  return { drafter: new StubLeadDrafter(), mode: "stub" };
}
var ResilientLeadDrafter = class {
  #primary;
  #fallback;
  constructor(primary, fallback = new StubLeadDrafter()) {
    this.#primary = primary;
    this.#fallback = fallback;
  }
  async draft(ctx) {
    try {
      return await this.#primary.draft(ctx);
    } catch (err) {
      console.error("[lead-engine] live drafter failed, falling back to stub:", err);
      return this.#fallback.draft(ctx);
    }
  }
};

// packages/factory-core/src/lead-engine.ts
var LEAD_THREAD_STATUSES = [
  "cold",
  "warm",
  "hot",
  "qualified",
  "won",
  "lost"
];
function isValidLeadThreadStatus(value) {
  return LEAD_THREAD_STATUSES.includes(value);
}
var drafterOverride;
function activeDrafter() {
  if (drafterOverride) return { drafter: drafterOverride, mode: "stub" };
  const sel = selectLeadDrafter();
  return sel.mode === "anthropic" ? { drafter: sel.drafter, mode: "anthropic" } : { drafter: new StubLeadDrafter(), mode: "stub" };
}
function leadDrafterMode() {
  return process.env["ANTHROPIC_API_KEY"] ? "anthropic" : "stub";
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function addEvent(store2, eventType, detail) {
  store2.addEvent({
    id: randomUUID10(),
    timestamp: nowIso(),
    agentId: "LEA",
    eventType,
    detail
  });
}
function historyFor(thread) {
  return thread.messages.filter((m) => m.author === "lead" || m.author === "operator_sent").map((m) => ({ role: m.author === "lead" ? "lead" : "operator", text: m.text }));
}
function statusFromQualification(q, current) {
  if (current === "won" || current === "lost") return current;
  const known = [q.problem, q.budget, q.decisionMaker].filter(Boolean).length;
  if (known >= 3) return "qualified";
  if (known === 2) return "hot";
  if (known === 1) return "warm";
  return "cold";
}
function createLeadThread(store2, input) {
  const now = nowIso();
  const thread = {
    id: `lt-${randomUUID10().slice(0, 8)}`,
    leadName: input.leadName,
    ...input.company ? { company: input.company } : {},
    ...input.source ? { source: input.source } : {},
    status: "cold",
    qualification: {},
    messages: [],
    draftRevision: 0,
    createdAt: now,
    updatedAt: now
  };
  store2.addLeadThread(thread);
  addEvent(store2, "lead.thread_created", `Nowy w\u0105tek leada: ${thread.leadName}${thread.company ? ` (${thread.company})` : ""} [${thread.id}]`);
  return thread;
}
async function appendDraft(store2, thread, kind, operatorFeedback) {
  const { drafter } = activeDrafter();
  const draft = await drafter.draft({
    leadName: thread.leadName,
    ...thread.company ? { company: thread.company } : {},
    history: historyFor(thread),
    qualification: thread.qualification,
    ...operatorFeedback ? { operatorFeedback } : {},
    kind
  });
  const msg = {
    id: `lm-${randomUUID10().slice(0, 8)}`,
    author: "lea_draft",
    kind: kind === "proposal" ? "proposal" : "reply",
    text: draft.text,
    at: nowIso(),
    draftMode: draft.mode,
    objective: draft.objective
  };
  store2.updateLeadThread(thread.id, {
    messages: [...store2.getLeadThread(thread.id).messages, msg],
    updatedAt: msg.at
  });
  return msg;
}
async function recordIncomingLeadMessage(store2, threadId, text) {
  const thread = store2.getLeadThread(threadId);
  if (!thread) return void 0;
  const now = nowIso();
  const incoming = {
    id: `lm-${randomUUID10().slice(0, 8)}`,
    author: "lead",
    kind: "message",
    text,
    at: now
  };
  const messages = [...thread.messages, incoming];
  const history = messages.filter((m) => m.author === "lead" || m.author === "operator_sent").map((m) => ({ role: m.author === "lead" ? "lead" : "operator", text: m.text }));
  const qualification = extractQualification(history);
  const status = statusFromQualification(qualification, thread.status);
  const newlyKnown = [];
  if (qualification.problem && !thread.qualification.problem) newlyKnown.push(`problem=${qualification.problem}`);
  if (qualification.budget && !thread.qualification.budget) newlyKnown.push(`bud\u017Cet=${qualification.budget}`);
  if (qualification.decisionMaker && !thread.qualification.decisionMaker) newlyKnown.push(`decydent=${qualification.decisionMaker}`);
  store2.updateLeadThread(threadId, {
    messages,
    qualification,
    status,
    draftRevision: 0,
    updatedAt: now
  });
  addEvent(store2, "lead.message_received", `Wiadomo\u015B\u0107 od leada ${thread.leadName} [${threadId}]: ${text.length > 120 ? `${text.slice(0, 120)}...` : text}`);
  if (newlyKnown.length > 0) {
    addEvent(store2, "lead.qualified", `Kwalifikacja ${thread.leadName} [${threadId}]: ${newlyKnown.join("; ")}. Status: ${status}.`);
  }
  if (status !== thread.status) {
    addEvent(store2, "lead.status_changed", `Status ${thread.leadName} [${threadId}]: ${thread.status} \u2192 ${status} (kwalifikacja).`);
  }
  const updated = store2.getLeadThread(threadId);
  const draft = await appendDraft(store2, updated, "reply");
  addEvent(store2, "lead.reply_drafted", `LEA przygotowa\u0142 szkic odpowiedzi dla ${thread.leadName} [${threadId}] (m\xF3zg: ${draft.draftMode}, cel: ${draft.objective}). Czeka na przegl\u0105d i r\u0119czn\u0105 wysy\u0142k\u0119 operatora.`);
  return store2.getLeadThread(threadId);
}
async function redraftLeadReply(store2, threadId, feedback) {
  const thread = store2.getLeadThread(threadId);
  if (!thread) return void 0;
  const draft = await appendDraft(store2, thread, "reply", feedback);
  store2.updateLeadThread(threadId, { draftRevision: thread.draftRevision + 1, updatedAt: nowIso() });
  addEvent(store2, "lead.reply_redrafted", `LEA przeredagowa\u0142 szkic dla ${thread.leadName} [${threadId}] (rewizja ${thread.draftRevision + 1}${feedback ? `, feedback: ${feedback}` : ""}, m\xF3zg: ${draft.draftMode}).`);
  return store2.getLeadThread(threadId);
}
async function draftLeadProposal(store2, threadId) {
  const thread = store2.getLeadThread(threadId);
  if (!thread) return void 0;
  const draft = await appendDraft(store2, thread, "proposal");
  addEvent(store2, "lead.proposal_drafted", `LEA przygotowa\u0142 szkic propozycji dla ${thread.leadName} [${threadId}] (m\xF3zg: ${draft.draftMode}). Operator wysy\u0142a j\u0105 samodzielnie.`);
  return store2.getLeadThread(threadId);
}
function markLeadReplySent(store2, threadId, text) {
  const thread = store2.getLeadThread(threadId);
  if (!thread) return void 0;
  const now = nowIso();
  const msg = {
    id: `lm-${randomUUID10().slice(0, 8)}`,
    author: "operator_sent",
    kind: "reply",
    text,
    at: now
  };
  store2.updateLeadThread(threadId, {
    messages: [...thread.messages, msg],
    draftRevision: 0,
    updatedAt: now
  });
  addEvent(store2, "lead.marked_sent", `Operator oznaczy\u0142 odpowied\u017A do ${thread.leadName} [${threadId}] jako wys\u0142an\u0105 W\u0141ASNYM kana\u0142em. Fabryka nie wys\u0142a\u0142a niczego.`);
  return store2.getLeadThread(threadId);
}
function setLeadThreadStatus(store2, threadId, status, note) {
  const thread = store2.getLeadThread(threadId);
  if (!thread) return void 0;
  store2.updateLeadThread(threadId, { status, updatedAt: nowIso() });
  addEvent(store2, "lead.status_changed", `Status ${thread.leadName} [${threadId}]: ${thread.status} \u2192 ${status} (operator${note ? `: ${note}` : ""}).`);
  return store2.getLeadThread(threadId);
}
function pendingDraftFor(thread) {
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const m = thread.messages[i];
    if (m.author === "operator_sent") return void 0;
    if (m.author === "lea_draft") return m;
  }
  return void 0;
}

// tests/factory-serve.ts
import { randomUUID as randomUUID11 } from "node:crypto";
var PORT = Number(process.env["PORT"] ?? 7778);
var ON_VERCEL = Boolean(process.env["VERCEL"]);
var DATA_DIR = process.env["FACTORY_DATA_DIR"] ?? (ON_VERCEL ? "/tmp/.factory-data" : join5(process.cwd(), ".factory-data"));
if (!existsSync2(DATA_DIR)) mkdirSync2(DATA_DIR, { recursive: true });
var store = new FactoryStore(DATA_DIR);
var autopilotEnabled = store.getAutopilotEnabled();
var lastCycleSummary = "jeszcze nieuruchomiony";
var VALID_DEPARTMENTS = ["marketing", "sales", "delivery", "research", "qa"];
var DEMO_CLIENTS = [
  {
    key: "hvac",
    clientName: "HVAC TestCo",
    serviceId: "svc-ai-workflow-audit",
    language: "EN",
    description: "We install and maintain HVAC systems. We need a simple workflow to handle inbound leads, quote follow-ups, and maintenance plan objections."
  },
  {
    key: "brighthire",
    clientName: "BrightHire Agency",
    serviceId: "svc-recruitment-ops-audit",
    language: "EN",
    description: "We are a 12-person recruitment agency. Candidates go cold between screening and client submission and we lose placements to slow feedback."
  },
  {
    key: "neonblocks",
    clientName: "NeonBlocks Studio",
    serviceId: "svc-social-pack",
    language: "EN",
    description: "Indie game studio. We know we should post but never have content ready. Need a carousel pack about our build-in-public journey."
  },
  {
    key: "builderpro",
    clientName: "Local Builder Pro",
    serviceId: "svc-landing-audit",
    language: "EN",
    description: "Local construction firm. Our landing page gets visits from ads but almost no enquiry form submissions."
  }
];
function productionLineFor(state) {
  const ops = deriveOps(state);
  return deriveProductionLine(state, {
    mode: ops.mode,
    autopilotEnabled,
    nextOperatorAction: ops.nextActionTitle,
    trainingToday: `${ops.trainingToday}/5`
  });
}
var E = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var plPreview = (text, max = 60) => text.length > max ? `${text.slice(0, max)}...` : text;
var badge = (text, cls) => `<span class="badge ${cls}">${E(text)}</span>`;
var STATUS_LABELS = {
  new: "nowe",
  in_production: "w produkcji",
  ready_for_review: "gotowe do przegl\u0105du",
  approved: "zatwierdzone",
  closed: "zamkni\u0119te",
  rejected: "odrzucone",
  draft: "szkic",
  draft_ready: "szkic gotowy",
  accepted: "zaakceptowane",
  needs_rework: "wymaga poprawek",
  archived: "zarchiwizowane",
  warehouse_ready: "gotowe do magazynu",
  warehoused: "zmagazynowane",
  pending: "oczekuj\u0105ce",
  healthy: "zdrowy",
  watch: "obserwacja",
  quarantined: "kwarantanna",
  completed: "zako\u0144czone",
  waiting_review: "czeka na przegl\u0105d",
  ready_for_operator: "czeka na operatora",
  blocked: "zablokowane",
  queued: "w kolejce",
  skipped: "pomini\u0119te",
  idle: "bezczynne",
  warehouse: "magazyn",
  trash: "kosz",
  training: "trening",
  rework: "poprawka",
  "client order": "zlecenie klienta",
  client: "zlecenie klienta",
  delivery_pack: "pakiet dostawy",
  "pack draft": "szkic pakietu",
  "pack approved": "pakiet zatwierdzony",
  failed: "nieudane",
  cold: "zimny",
  warm: "ciep\u0142y",
  hot: "gor\u0105cy",
  qualified: "zakwalifikowany",
  won: "wygrany",
  lost: "przegrany"
};
var statusLabel = (s) => STATUS_LABELS[s] ?? s;
var MODE_LABELS = {
  CLIENT_MODE: "TRYB KLIENTA",
  REWORK_MODE: "TRYB POPRAWEK",
  NO_CLIENT_TRAINING_MODE: "TRYB TRENINGOWY",
  IDLE: "BEZCZYNNY"
};
var modeLabel = (m) => MODE_LABELS[m] ?? m;
var DEPARTMENT_LABELS = {
  marketing: "Marketing",
  sales: "Sprzeda\u017C",
  delivery: "Realizacja",
  research: "Badania",
  qa: "QA"
};
var departmentLabel = (d) => DEPARTMENT_LABELS[d] ?? d;
var STATION_ID_LABELS = {
  intake: "Przyj\u0119cie",
  research: "Badania",
  strategy: "Strategia",
  content: "Tre\u015B\u0107",
  delivery: "Realizacja",
  qa: "QA",
  packaging: "Pakowanie",
  operator_review: "Przegl\u0105d Operatora"
};
var stationIdLabel = (s) => STATION_ID_LABELS[s] ?? s;
var nav = (active) => {
  const links = [
    ["/admin", "Kokpit"],
    ["/", "Fabryka"],
    ["/factory-run", "Start Dnia"],
    ["/production-line", "Linia Produkcyjna"],
    ["/lead-engine", "Silnik Lead\xF3w"],
    ["/orders", "Zlecenia"],
    ["/delivery", "Dostawy"],
    ["/leads", "Leady"],
    ["/warehouse", "Magazyn"],
    ["/trash", "Kosz"],
    ["/events", "Zdarzenia"],
    ["/daily-review", "Przegl\u0105d Dzienny"]
  ];
  return `<nav class="nav">${links.map(([href, label]) => `<a href="${href}" class="${active === href ? "active" : ""}">${label}</a>`).join("")}</nav>`;
};
var layout = (title, activePath, body) => `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rdze\u0144 Fabryki \u2014 ${E(title)}</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6edf3;font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:20px 16px 60px}
.nav{display:flex;gap:4px;margin-bottom:24px;border-bottom:1px solid #21262d;padding-bottom:8px}
.nav a{color:#8b949e;text-decoration:none;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:500}
.nav a:hover,.nav a.active{background:#21262d;color:#e6edf3}
h1{font-size:20px;font-weight:600;margin-bottom:4px}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#8b949e;margin:22px 0 8px}
.sub{color:#8b949e;font-size:13px;margin-bottom:18px}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.stat{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:8px 14px;min-width:90px}
.stat .v{font-size:18px;font-weight:600}
.stat .l{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e}
table{width:100%;border-collapse:collapse;background:#161b22;border:1px solid #21262d;border-radius:8px;overflow:hidden;margin-bottom:16px}
th,td{text-align:left;padding:7px 11px;border-bottom:1px solid #21262d;vertical-align:top}
th{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e;background:#11161d}
tr:last-child td{border-bottom:none}
.mono{font-family:ui-monospace,monospace;font-size:12px}
.dim{color:#8b949e}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid transparent}
.badge.ok{background:#11321f;color:#3fb950;border-color:#234b2e}
.badge.warn{background:#34270a;color:#d29922;border-color:#4d3c14}
.badge.bad{background:#3a1418;color:#f85149;border-color:#5a1e23}
.badge.muted{background:#21262d;color:#8b949e;border-color:#30363d}
.badge.info{background:#0f2740;color:#58a6ff;border-color:#1c3a5e}
.v.ok{color:#3fb950}.v.warn{color:#d29922}.v.bad{color:#f85149}.v.info{color:#58a6ff}
.form-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:14px;margin-bottom:18px}
.form-card label{display:block;font-size:12px;color:#8b949e;margin-bottom:4px}
textarea{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px/1.5 ui-sans-serif,system-ui,sans-serif;padding:8px 10px;resize:vertical;min-height:80px}
button{cursor:pointer;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;padding:5px 14px;font-size:13px;font-weight:600}
button.ok{background:#11321f;color:#3fb950;border-color:#234b2e}
button.bad{background:#3a1418;color:#f85149;border-color:#5a1e23}
.offer-pre{white-space:pre-wrap;background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:8px;font-size:12px;color:#c9d1d9;max-height:200px;overflow-y:auto;margin:4px 0}
.actions{display:flex;gap:6px;flex-wrap:wrap}
.flash{background:#11321f;border:1px solid #234b2e;border-radius:6px;padding:10px 14px;margin-bottom:14px;color:#3fb950;font-size:13px}
.flash.bad{background:#3a1418;border-color:#5a1e23;color:#f85149}
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:16px}
.agent-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:10px 12px}
.daily-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:14px;margin-bottom:14px}
.daily-card.draft{border-left:3px solid #58a6ff}
.daily-card.accepted{border-left:3px solid #3fb950}
.daily-card.needs_rework{border-left:3px solid #d29922}
.daily-card.rejected{border-left:3px solid #f85149}
.daily-card.archived{border-left:3px solid #8b949e}
.daily-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.daily-title{font-weight:600;font-size:14px}
.daily-content{white-space:pre-wrap;background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:10px;font-size:12px;color:#c9d1d9;max-height:320px;overflow-y:auto;margin:8px 0 10px}
.daily-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
.feedback-area{display:flex;flex-direction:column;gap:4px;flex:1;min-width:200px}
.score-bar{display:inline-block;width:60px;height:6px;border-radius:3px;background:#21262d;vertical-align:middle;margin-left:4px;overflow:hidden}
.score-fill{height:100%;border-radius:3px}
.agent-card .aid{font-weight:700;font-size:15px;color:#58a6ff;margin-right:6px}
.agent-card .aname{font-weight:600;font-size:13px}
.agent-card .arole{font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
.agent-card .afield{font-size:11.5px;color:#8b949e;margin-top:2px}
.agent-card .afield span{color:#c9d1d9}
.admin-shell{position:relative;display:flex;flex-direction:column;gap:14px}
.admin-shell:before{content:"";position:absolute;inset:-18px -16px auto;height:220px;background:linear-gradient(135deg,rgba(255,45,209,.16),rgba(0,245,255,.12) 46%,rgba(255,184,0,.08));filter:blur(18px);opacity:.75;pointer-events:none}
.admin-hero,.admin-panel,.admin-card,.admin-action{position:relative;background:rgba(13,17,23,.88);border:1px solid rgba(0,245,255,.28);box-shadow:0 0 0 1px rgba(255,45,209,.08),0 18px 46px rgba(0,0,0,.28)}
.admin-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(230px,.65fr);gap:18px;border-radius:8px;padding:18px;overflow:hidden}
.admin-hero:after{content:"OSA//CTRL";position:absolute;right:14px;top:8px;color:rgba(255,45,209,.18);font:800 44px/1 ui-monospace,monospace;letter-spacing:4px;transform:rotate(-4deg)}
.admin-kicker{color:#00f5ff;font:700 11px/1 ui-monospace,monospace;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:8px}
.admin-title{font-size:30px;line-height:1.05;font-weight:800;margin:0 0 8px;color:#f5fbff;text-shadow:0 0 22px rgba(0,245,255,.24)}
.admin-sub{max-width:700px;color:#a9b7c5;font-size:13px}
.admin-mode{display:flex;flex-direction:column;gap:8px;align-items:flex-start;justify-content:flex-end}
.admin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.admin-card{border-radius:8px;padding:12px;min-height:86px}
.admin-card .v{font-size:24px;font-weight:800}
.admin-card .l{font-size:10px;color:#a9b7c5;text-transform:uppercase;letter-spacing:.7px;margin-top:2px}
.admin-panel{border-radius:8px;padding:14px}
.admin-subpanel{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:12px}
.admin-panel.hot{border-color:rgba(255,184,0,.5);background:linear-gradient(135deg,rgba(52,39,10,.82),rgba(13,17,23,.92))}
.admin-panel.danger{border-color:rgba(248,81,73,.55)}
.admin-panel h2{margin-top:0;color:#f5fbff}
.admin-action{border-radius:8px;padding:14px;border-color:rgba(255,45,209,.28)}
.admin-action strong{display:block;font-size:16px;margin-bottom:4px;color:#fff}
.admin-two{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:14px}
.admin-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.admin-list{display:flex;flex-direction:column;gap:10px}
.admin-order{background:#10151d;border:1px solid #273241;border-left:3px solid #00f5ff;border-radius:8px;padding:12px}
.admin-order.ready{border-left-color:#ffb800}.admin-order.done{border-left-color:#3fb950}.admin-order.bad{border-left-color:#f85149}
.admin-input-row{display:grid;grid-template-columns:1fr 1fr 150px;gap:8px;margin-bottom:8px}
.admin-input-row input,.admin-input-row select,.admin-panel input,.admin-panel select{width:100%;background:#0a0f16;border:1px solid #334155;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,system-ui,sans-serif;padding:7px 10px}
.admin-panel textarea{background:#0a0f16;border-color:#334155}
.admin-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.admin-actions form{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
.admin-actions input{background:#0a0f16;border:1px solid #334155;border-radius:6px;color:#e6edf3;font:12px ui-sans-serif,system-ui,sans-serif;padding:6px 8px;min-width:190px}
.admin-preview{white-space:pre-wrap;background:#070b11;border:1px solid #263241;border-radius:6px;padding:9px;font-size:12px;color:#dbe7f0;max-height:180px;overflow:auto;margin-top:8px}
.admin-table{background:rgba(10,15,22,.88)}
.admin-safety{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.admin-safety ul{margin:0;padding-left:18px;color:#a9b7c5;font-size:12.5px}
.admin-safety li{margin:4px 0}
.workroom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.work-agent{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:11px;min-height:138px}
.work-agent.active{border-color:rgba(0,245,255,.55)}.work-agent.waiting{border-color:rgba(255,184,0,.45)}.work-agent.failed{border-color:rgba(248,81,73,.55)}
.work-agent .name{font-weight:800;color:#f5fbff;margin-bottom:4px}
.work-agent .meta{font-size:11px;color:#a9b7c5;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.work-agent .line{font-size:12px;color:#dbe7f0;margin-top:5px}
.timeline{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.timeline-step{background:#070b11;border:1px solid #263241;border-left:3px solid #00f5ff;border-radius:8px;padding:10px}
.timeline-step.failed{border-left-color:#f85149}.timeline-step.skipped{border-left-color:#8b949e}
.idle-box{background:rgba(52,39,10,.55);border:1px solid rgba(255,184,0,.42);border-radius:8px;padding:12px;color:#f0d28a}
.idle-box .kicker{font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;color:#d29922;margin-bottom:4px}
.run-drill{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:8px 12px;margin-bottom:8px}
.run-drill summary{cursor:pointer;font-size:12.5px;color:#dbe7f0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.run-drill[open]{border-color:rgba(0,245,255,.45)}
.station-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.station{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:11px;border-top:3px solid #30363d}
.station.completed{border-top-color:#3fb950}.station.waiting_review{border-top-color:#d29922}.station.ready_for_operator{border-top-color:#58a6ff}
.station.blocked{border-top-color:#f85149}.station.queued{border-top-color:#a371f7}.station.skipped{border-top-color:#8b949e;opacity:.7}.station.idle{opacity:.55}
.station .sname{font-weight:800;color:#f5fbff;font-size:13px}
.station .sagent{font-size:10.5px;color:#00f5ff;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.station .spurpose{font-size:11px;color:#8b949e;margin-bottom:6px;min-height:28px}
.station .sline{font-size:11.5px;color:#dbe7f0;margin-top:3px}
.pl-task{background:#0b1119;border:1px solid #263241;border-radius:8px;border-left:3px solid #30363d;padding:10px;margin-bottom:8px}
.pl-task.waiting_review{border-left-color:#d29922}.pl-task.blocked{border-left-color:#f85149}.pl-task.ready_for_operator{border-left-color:#58a6ff}.pl-task.completed{border-left-color:#3fb950}.pl-task.queued{border-left-color:#a371f7}.pl-task.skipped{border-left-color:#8b949e}
@media (max-width:860px){.station-board{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.station-board{grid-template-columns:1fr}}
.run-drill .drill-body{margin-top:8px;border-top:1px solid #263241;padding-top:8px}
.wait-items{margin:8px 0 0;padding-left:18px;color:#a9b7c5;font-size:12px}
.wait-items li{margin:3px 0}
.wait-items a{color:#58a6ff}
.admin-table a{color:#58a6ff;text-decoration:none}
@media (max-width:860px){
  .admin-hero,.admin-two,.admin-safety{grid-template-columns:1fr}
  .admin-grid,.admin-three,.workroom-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .admin-input-row{grid-template-columns:1fr}
}
@media (max-width:560px){
  .admin-grid,.admin-three,.workroom-grid{grid-template-columns:1fr}
  .admin-title{font-size:24px}
  .admin-hero{padding:14px}
}
</style>
</head>
<body>
<div class="wrap">
${nav(activePath)}
${body}
</div>
</body>
</html>`;
function renderFactory(state, flash) {
  const pending = state.approvalQueue.filter((a) => a.status === "pending");
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const agentRows = [
    ["A", "Oficer Przyj\u0119cia Sygna\u0142u", "intake", "Sygna\u0142y JobQueue", "IntakeBrief"],
    ["B", "Kwalifikator ICP", "qualification", "IntakeBriefs", "QualifiedLead / Trash"],
    ["C", "Wzbogacacz Lead\xF3w", "enrichment", "QualifiedLeads", "EnrichedLead"],
    ["D", "Strateg Oferty", "strategy", "EnrichedLeads", "OfferStrategy"],
    ["E", "Budowniczy Oferty", "offer-builder", "OfferStrategies", "DraftOffer"],
    ["F", "Ewaluator Oferty", "evaluation", "DraftOffers", "ScoredOffer"],
    ["G", "Redaktor Oferty", "editing", "Nieudane ScoredOffers", "Poprawiony DraftOffer"],
    ["H", "Stra\u017Cnik Zatwierdze\u0144", "approval-gate", "Zaliczone ScoredOffers", "ApprovalItem (oczekuj\u0105ce)"],
    ["I", "Monitor Zatwierdze\u0144", "routing", "Zatwierdzone pozycje", "WarehouseItem"],
    ["J", "Obserwator Sukcesji", "succession", "Wszyscy agenci", "SuccessionFlag"],
    ["K", "Tropiciel Rodowodu", "lineage", "SuccessionFlags", "SuccessionBrief"],
    ["L", "Audytor Jako\u015Bci", "quality", "WarehouseItems", "QualityMetric"],
    ["M", "Reporter Wydajno\u015Bci", "reporting", "QualityMetrics", "Scorecard"],
    ["N", "Dyrektor Fabryki", "direction", "Wszystkie etapy", "CorrectionBrief"]
  ];
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production").length;
  const mode = openOrders > 0 ? "CLIENT_MODE" : "NO_CLIENT_TRAINING_MODE";
  return layout("Fabryka", "/", `
<h1>Rdze\u0144 Fabryki v0.2</h1>
<p class="sub">
  Linia Pozyskiwania Ofert + Zlecenia Klient\xF3w + Trening Dzienny \u2014 zgoda operatora wymagana zanim cokolwiek wyjdzie na zewn\u0105trz \xB7
  ${badge(modeLabel(mode), openOrders > 0 ? "warn" : "info")} \xB7
  ${badge(autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", autopilotEnabled ? "ok" : "muted")}
  <span class="dim" style="font-size:11px">ostatni cykl: ${E(lastCycleSummary)}</span>
</p>
<form method="POST" action="/api/autopilot" style="margin-bottom:14px">
  <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
  <button type="submit">${autopilotEnabled ? "Wstrzymaj Autopilota" : "Wzn\xF3w Autopilota"}</button>
</form>
${flashHtml}
<div class="stats">
  <div class="stat"><div class="v info">${state.signals.length}</div><div class="l">Sygna\u0142y</div></div>
  <div class="stat"><div class="v ok">${state.leads.filter((l) => l.qualified).length}</div><div class="l">Zakwalifikowane</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Oczekuj\u0105ce</div></div>
  <div class="stat"><div class="v ok">${state.warehouse.length}</div><div class="l">Magazyn</div></div>
  <div class="stat"><div class="v muted">${state.trash.length}</div><div class="l">Kosz</div></div>
  <div class="stat"><div class="v info">${state.events.length}</div><div class="l">Zdarzenia</div></div>
</div>

<div class="form-card">
  <label>Zg\u0142o\u015B sygna\u0142 \u2014 opisz prospekta lub problem biznesowy (tylko wej\u015Bcie operatora)</label>
  <form method="POST" action="/api/signal">
    <textarea name="raw" placeholder="np. Za\u0142o\u017Cyciel B2B SaaS, seed stage, s\u0142aby pipeline, MRR utkn\u0105\u0142 na $30K. Potrzebna oferta outboundowa." required></textarea>
    <div style="margin-top:8px"><button type="submit">Uruchom Pipeline \u2192</button></div>
  </form>
</div>

<h2>Kolejka Zatwierdze\u0144 (${pending.length} oczekuj\u0105cych)</h2>
${pending.length === 0 ? '<p class="dim">Brak ofert oczekuj\u0105cych na zatwierdzenie.</p>' : pending.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(statusLabel("pending"), "warn")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">sygna\u0142: ${E(item.signalId)} \xB7 wynik: ${item.finalOffer.score} \xB7 iteracje: ${item.finalOffer.iterations}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div class="actions" style="margin-top:8px">
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="approve"><input type="hidden" name="id" value="${E(item.id)}"><button class="ok" type="submit">Zatwierd\u017A \u2192 Magazyn</button></form>
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="reject"><input type="hidden" name="id" value="${E(item.id)}"><button class="bad" type="submit">Odrzu\u0107</button></form>
  </div>
</div>`).join("")}

<h2>Rejestr Agent\xF3w</h2>
<div class="agents-grid">
${agentRows.map(([id, name, role, watch, next]) => `
<div class="agent-card">
  <div><span class="aid">${E(id)}</span><span class="aname">${E(name)}</span></div>
  <div class="arole">${E(role)}</div>
  <div class="afield">Obserwuje: <span>${E(watch)}</span></div>
  <div class="afield">Dalej: <span>${E(next)}</span></div>
</div>`).join("")}
</div>`);
}
function renderLeads(state) {
  const leads = state.leads.filter((l) => l.qualified);
  return layout("Leady", "/leads", `
<h1>Zakwalifikowane Leady</h1>
<p class="sub">${leads.length} lead\xF3w przesz\u0142o kwalifikacj\u0119 ICP</p>
${leads.length === 0 ? '<p class="dim">Brak zakwalifikowanych lead\xF3w. Zg\u0142o\u015B sygna\u0142 na stronie Fabryki.</p>' : `
<table>
<thead><tr><th>ID Sygna\u0142u</th><th>Kategoria</th><th>Sygna\u0142y ICP</th><th>Wynik Dopasowania</th><th>Powody</th></tr></thead>
<tbody>
${leads.map((l) => `<tr>
  <td class="mono">${E(l.signalId)}</td>
  <td>${E(l.brief.category)}</td>
  <td class="dim">${E(l.brief.icpSignals.join(", ") || "\u2014")}</td>
  <td>${badge(String(l.fitScore), l.fitScore >= 0.75 ? "ok" : "warn")}</td>
  <td class="dim" style="font-size:12px">${E(l.qualificationReasons.join(" \xB7 "))}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderWarehouse(state) {
  const digitalAssets = state.dailyDigitals.filter((d) => d.location === "warehouse");
  return layout("Magazyn", "/warehouse", `
<h1>Magazyn \u2014 Zatwierdzone Wyniki</h1>
<p class="sub">${state.warehouse.length} ofert + ${digitalAssets.length} zasob\xF3w cyfrowych zatwierdzonych przez operatora \xB7 <strong style="color:#f85149">sent: false \u2014 brak automatycznej wysy\u0142ki</strong></p>

<h2>Zatwierdzone Oferty (${state.warehouse.length})</h2>
${state.warehouse.length === 0 ? '<p class="dim">Brak zatwierdzonych ofert.</p>' : state.warehouse.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(statusLabel("approved"), "ok")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">sygna\u0142: ${E(item.signalId)} \xB7 wynik: ${item.qualityScore} \xB7 zatwierdzono: ${E(item.approvedAt.slice(0, 16).replace("T", " "))}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div style="margin-top:6px;font-size:12px;color:#8b949e">Agent I skierowa\u0142 do magazynu. U\u017Cycie tej oferty na zewn\u0105trz wymaga dzia\u0142ania operatora.</div>
</div>`).join("")}

<h2>Zasoby Cyfrowe (${digitalAssets.length})</h2>
${digitalAssets.length === 0 ? '<p class="dim">Brak zasob\xF3w cyfrowych w magazynie.</p>' : digitalAssets.map((d) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(departmentLabel(d.department), "info")} ${badge(d.orderId ? statusLabel("client order") : statusLabel("training"), d.orderId ? "warn" : "muted")}
    <strong>${E(d.title)}</strong>
    <span class="dim" style="font-size:12px;margin-left:8px">wynik: ${d.qualityScore} \xB7 rev ${d.revisionCount} \xB7 ${E(d.date)}</span>
  </div>
  <div class="offer-pre">${E(d.content)}</div>
</div>`).join("")}

<h2>Pakiety Dostawy (${state.deliveryPacks.length})</h2>
${state.deliveryPacks.length === 0 ? '<p class="dim">Brak pakiet\xF3w dostawy.</p>' : `
<table>
<thead><tr><th>Pakiet</th><th>Klient</th><th>Us\u0142uga</th><th>Status</th><th>\u0179r\xF3d\u0142o</th><th>Utworzono</th></tr></thead>
<tbody>
${[...state.deliveryPacks].reverse().map((p) => `<tr>
  <td class="mono">${E(p.id)}</td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
  <td class="mono dim">${E(p.sourceOutputId)}</td>
  <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderTrash(state) {
  const trashedDigitals = state.dailyDigitals.filter((d) => d.location === "trash");
  return layout("Kosz", "/trash", `
<h1>Kosz \u2014 Odrzucone i Nieudane</h1>
<p class="sub">${state.trash.length} pozycji z pipeline'u + ${trashedDigitals.length} odrzuconych zasob\xF3w cyfrowych</p>

<h2>Pozycje z Pipeline'u (${state.trash.length})</h2>
${state.trash.length === 0 ? '<p class="dim">Kosz jest pusty.</p>' : `
<table>
<thead><tr><th>ID</th><th>ID Sygna\u0142u</th><th>Pow\xF3d</th><th>Odrzucono</th></tr></thead>
<tbody>
${state.trash.map((t) => `<tr>
  <td class="mono">${E(t.id)}</td>
  <td class="mono">${E(t.signalId)}</td>
  <td>${E(t.reason)}</td>
  <td class="dim">${E(t.trashedAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}

<h2>Odrzucone Zasoby Cyfrowe (${trashedDigitals.length})</h2>
${trashedDigitals.length === 0 ? '<p class="dim">Brak odrzuconych zasob\xF3w.</p>' : `
<table>
<thead><tr><th>ID</th><th>Dzia\u0142</th><th>Tytu\u0142</th><th>Feedback</th><th>Data</th></tr></thead>
<tbody>
${trashedDigitals.map((d) => `<tr>
  <td class="mono">${E(d.id)}</td>
  <td>${badge(departmentLabel(d.department), "muted")}</td>
  <td>${E(d.title)}</td>
  <td class="dim" style="font-size:12px">${E(d.operatorFeedback ?? "\u2014")}</td>
  <td class="dim">${E(d.date)}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderDailyReview(state, flash) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId);
  const todayItems = trainingItems.filter((d) => d.date === today);
  const pending = todayItems.filter((d) => d.status === "draft_ready" || d.status === "needs_rework");
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const statusBadgeCls = (s) => {
    if (s === "accepted") return "ok";
    if (s === "needs_rework") return "warn";
    if (s === "rejected") return "bad";
    if (s === "draft_ready") return "info";
    return "muted";
  };
  const deptBadgeCls = (d) => {
    const m = { marketing: "info", sales: "ok", delivery: "warn", research: "muted", qa: "bad" };
    return m[d] ?? "muted";
  };
  const scoreColor = (s) => s >= 0.75 ? "#3fb950" : s >= 0.5 ? "#d29922" : "#f85149";
  const renderCard = (item) => {
    const isActionable = item.status === "draft_ready" || item.status === "needs_rework";
    const scoreBar = `<span class="score-bar"><span class="score-fill" style="width:${Math.round(item.qualityScore * 100)}%;background:${scoreColor(item.qualityScore)}"></span></span>`;
    const feedbackNote = item.operatorFeedback ? `<div style="font-size:12px;color:#d29922;margin-top:4px">Feedback: ${E(item.operatorFeedback)}</div>` : "";
    const revNote = item.revisionCount > 0 ? `<span class="dim" style="font-size:11px">rev ${item.revisionCount}</span>` : "";
    const actions = isActionable ? `
<div class="daily-actions">
  <form method="POST" action="/api/daily" style="display:flex;gap:6px">
    <input type="hidden" name="action" value="accept">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button class="ok" type="submit">Akceptuj</button>
  </form>
  <form method="POST" action="/api/daily" style="display:flex;gap:6px;align-items:flex-start">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">\u2192 Magazyn</button>
  </form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Feedback do poprawki..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="warn" type="submit" style="align-self:flex-start">Wymaga Poprawek</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Pow\xF3d odrzucenia..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Odrzu\u0107 do Kosza</button>
    </form>
  </div>
</div>` : `<div class="dim" style="font-size:12px">Status: ${E(statusLabel(item.status))}${item.location === "warehouse" ? " \xB7 w magazynie" : ""}</div>`;
    return `<div class="daily-card ${item.status === "draft_ready" ? "draft" : item.status}">
  <div class="daily-header">
    ${badge(departmentLabel(item.department), deptBadgeCls(item.department))}
    ${badge(statusLabel(item.status), statusBadgeCls(item.status))}
    <span class="daily-title">${E(item.title)}</span>
    ${revNote}
    <span class="dim" style="font-size:11px">wynik ${item.qualityScore}${scoreBar}</span>
    <span class="dim" style="font-size:11px">${E(item.type)}</span>
  </div>
  ${feedbackNote}
  <div class="daily-content">${E(item.content)}</div>
  ${actions}
</div>`;
  };
  const olderItems = trainingItems.filter((d) => d.date !== today);
  const olderDates = [...new Set(olderItems.map((d) => d.date))].sort().reverse();
  return layout("Przegl\u0105d Dzienny", "/daily-review", `
<h1>Przegl\u0105d Dzienny \u2014 TRYB TRENINGOWY</h1>
<p class="sub">5 cyfrowych deliverabli dziennie \xB7 operator ocenia ka\u017Cdy \xB7 feedback wp\u0142ywa na kolejny przebieg</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${todayItems.length}</div><div class="l">Dzi\u015B</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Do Przegl\u0105du</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.status === "accepted").length}</div><div class="l">Zaakceptowane</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">W Magazynie</div></div>
  <div class="stat"><div class="v bad">${trainingItems.filter((d) => d.status === "rejected").length}</div><div class="l">Odrzucone</div></div>
  <div class="stat"><div class="v muted">${state.feedbackEvents.length}</div><div class="l">Zdarzenia Feedbacku</div></div>
</div>

${todayItems.length === 0 ? `
<div class="form-card">
  <p style="margin-bottom:10px;color:#8b949e">Brak misji uruchomionych na dzi\u015B (${today}).</p>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="action" value="run">
    <input type="hidden" name="date" value="${today}">
    <button type="submit">Uruchom Dzisiejsze 5 Misji \u2192</button>
  </form>
</div>` : `
<h2>Dzi\u015B \u2014 ${today} (${todayItems.length} deliverabli)</h2>
${todayItems.map(renderCard).join("")}
`}

${olderDates.length > 0 ? `
<h2>Poprzednie Dni</h2>
<table>
<thead><tr><th>Data</th><th>Dzia\u0142</th><th>Tytu\u0142</th><th>Status</th><th>Wynik</th><th>Lokalizacja</th></tr></thead>
<tbody>
${olderDates.flatMap(
    (date) => olderItems.filter((d) => d.date === date).map((d) => `<tr>
  <td class="dim">${E(d.date)}</td>
  <td>${badge(departmentLabel(d.department), "muted")}</td>
  <td>${E(d.title)}</td>
  <td>${badge(statusLabel(d.status), d.status === "accepted" ? "ok" : d.status === "rejected" ? "bad" : "warn")}</td>
  <td class="mono">${d.qualityScore}</td>
  <td class="dim">${E(statusLabel(d.location))}</td>
</tr>`)
  ).join("")}
</tbody>
</table>` : ""}

${state.feedbackEvents.length > 0 ? `
<h2>Zdarzenia Feedbacku \u2014 Ograniczenia dla Kolejnego Przebiegu</h2>
<table>
<thead><tr><th>Czas</th><th>Dzia\u0142</th><th>Akcja</th><th>Feedback</th></tr></thead>
<tbody>
${[...state.feedbackEvents].reverse().slice(0, 20).map((e) => `<tr>
  <td class="mono dim">${E(e.timestamp.slice(0, 16).replace("T", " "))}</td>
  <td>${badge(departmentLabel(e.department), "muted")}</td>
  <td>${badge(statusLabel(e.action), e.action === "accepted" || e.action === "warehoused" ? "ok" : e.action === "needs_rework" ? "warn" : "bad")}</td>
  <td class="dim" style="font-size:12px">${E(e.feedback ?? "\u2014")}</td>
</tr>`).join("")}
</tbody>
</table>` : ""}`);
}
function renderOrders(state, flash) {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const orders = [...state.orders].reverse();
  const open3 = state.orders.filter((o) => o.status === "new" || o.status === "in_production");
  const ready = state.orders.filter((o) => o.status === "ready_for_review");
  const orderBadgeCls = (s) => {
    if (s === "approved" || s === "closed") return "ok";
    if (s === "ready_for_review") return "warn";
    if (s === "rejected") return "bad";
    return "info";
  };
  const deliverableBlock = (order) => {
    const d = order.deliverableId ? state.dailyDigitals.find((x) => x.id === order.deliverableId) : void 0;
    if (!d) return '<div class="dim" style="font-size:12px">Brak deliverabla \u2014 autopilot wyprodukuje go w ci\u0105gu minuty.</div>';
    const reviewable = d.status === "draft_ready";
    return `
<div class="daily-content">${E(d.content)}</div>
<div class="dim" style="font-size:11px;margin-bottom:8px">deliverable: ${E(d.id)} \xB7 wynik ${d.qualityScore} \xB7 rev ${d.revisionCount} \xB7 status ${E(statusLabel(d.status))}</div>
${reviewable ? `
<div class="daily-actions">
  <form method="POST" action="/api/daily"><input type="hidden" name="action" value="warehouse"><input type="hidden" name="id" value="${E(d.id)}"><button class="ok" type="submit">Zatwierd\u017A \u2192 Magazyn</button></form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="Co powinno si\u0119 zmieni\u0107..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14;align-self:flex-start">Zg\u0142o\u015B Poprawk\u0119</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="Pow\xF3d odrzucenia..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Odrzu\u0107 Wynik Zlecenia</button>
    </form>
  </div>
</div>` : ""}`;
  };
  return layout("Zlecenia", "/orders", `
<h1>Zlecenia Klient\xF3w</h1>
<p class="sub">Prawdziwa praca \u2014 zlecenie klienta zawsze ma priorytet nad treningiem dziennym. Nic nie jest dostarczane bez zgody operatora.</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${state.orders.length}</div><div class="l">Razem</div></div>
  <div class="stat"><div class="v ${open3.length ? "warn" : "ok"}">${open3.length}</div><div class="l">W Produkcji</div></div>
  <div class="stat"><div class="v ${ready.length ? "warn" : "ok"}">${ready.length}</div><div class="l">Gotowe do Przegl\u0105du</div></div>
  <div class="stat"><div class="v ok">${state.orders.filter((o) => o.status === "approved" || o.status === "closed").length}</div><div class="l">Zatwierdzone</div></div>
  <div class="stat"><div class="v bad">${state.orders.filter((o) => o.status === "rejected").length}</div><div class="l">Odrzucone</div></div>
</div>

<div class="form-card">
  <label>Nowe zlecenie klienta \u2014 dla kogo i czego potrzebuje?</label>
  <form method="POST" action="/api/order">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Nazwa klienta / firmy" required style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <input name="contact" placeholder="Kontakt (opcjonalnie)" style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <select name="department" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
        <option value="marketing">Marketing</option>
        <option value="sales">Sprzeda\u017C</option>
        <option value="delivery" selected>Realizacja</option>
        <option value="research">Badania</option>
        <option value="qa">QA</option>
      </select>
    </div>
    <textarea name="description" placeholder="np. Tekst strony l\u0105dowania dla firmy budowlanej sprzedaj\u0105cej gara\u017Ce prefabrykowane \u2014 potrzebna sekcja cenowa i CTA formularza kontaktowego" required></textarea>
    <div style="margin-top:8px"><button type="submit">Przyjmij Zlecenie \u2192 Wyprodukuj Teraz</button></div>
  </form>
</div>

<h2>Zlecenia (${orders.length})</h2>
${orders.length === 0 ? '<p class="dim">Brak zlece\u0144. Gdy nie ma zlece\u0144, fabryka uruchamia zamiast tego 5 losowych misji treningowych dziennie.</p>' : orders.map((o) => `
<div class="daily-card ${o.status === "ready_for_review" ? "draft" : o.status === "approved" || o.status === "closed" ? "accepted" : o.status === "rejected" ? "rejected" : "needs_rework"}">
  <div class="daily-header">
    ${badge(statusLabel(o.status), orderBadgeCls(o.status))}
    ${badge(departmentLabel(o.department), "info")}
    <span class="daily-title">${E(o.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(o.id)}</span>
    ${o.taskType ? `<span class="dim" style="font-size:11px">zadanie: ${E(o.taskType)}</span>` : ""}
    ${o.revisionCount > 0 ? `<span class="dim" style="font-size:11px">rev ${o.revisionCount}</span>` : ""}
  </div>
  <div style="font-size:12.5px;color:#c9d1d9;margin-bottom:8px">"${E(o.description)}"</div>
  ${o.operatorFeedback ? `<div style="font-size:12px;color:#d29922;margin-bottom:6px">Ostatni feedback: ${E(o.operatorFeedback)}</div>` : ""}
  ${deliverableBlock(o)}
</div>`).join("")}`);
}
function deriveOps(state) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const openOrders = state.orders.filter((o) => {
    if (o.status !== "new" && o.status !== "in_production") return false;
    const d = o.deliverableId ? state.dailyDigitals.find((x) => x.id === o.deliverableId) : void 0;
    return d?.status !== "needs_rework";
  }).length;
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length;
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId);
  const trainingToday = trainingItems.filter((d) => d.date === today).length;
  const trainingDrafts = trainingItems.filter((d) => d.status === "draft_ready").length;
  const needsRework = state.dailyDigitals.filter((d) => d.status === "needs_rework").length;
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending").length;
  const deliveryPacksDraft = state.deliveryPacks.filter((p) => p.status === "draft").length;
  const deliveryPacksApproved = state.deliveryPacks.filter((p) => p.status === "approved").length;
  const waiting = { ordersReadyForReview: readyOrders, trainingDrafts, needsRework, pendingApprovals, deliveryPacksDraft, deliveryPacksApproved };
  const mode = openOrders > 0 ? "CLIENT_MODE" : needsRework > 0 ? "REWORK_MODE" : trainingToday < 5 ? "NO_CLIENT_TRAINING_MODE" : "IDLE";
  let standingStill;
  if (!autopilotEnabled) {
    standingStill = "Fabryka jest wstrzymana, bo autopilot jest WY\u0141\u0104CZONY. Nie uruchomi sama kolejnych cykli, dop\xF3ki nie zostanie wznowiony." + (readyOrders + trainingDrafts > 0 ? ` Tymczasem do przegl\u0105du czeka: zlecenia klienta \u2014 ${readyOrders}, szkice treningowe \u2014 ${trainingDrafts}.` : "");
  } else if (openOrders > 0) {
    standingStill = `Fabryka produkuje: otwarte zlecenia klienta w pipeline \u2014 ${openOrders}.`;
  } else if (needsRework > 0) {
    standingStill = `Fabryka czeka na cykl poprawek, by odtworzy\u0107 oznaczone wyniki: ${needsRework}.`;
  } else if (readyOrders + trainingDrafts + pendingApprovals + deliveryPacksDraft + deliveryPacksApproved > 0) {
    standingStill = `Fabryka czeka na przegl\u0105d operatora: zlecenia klienta \u2014 ${readyOrders}, szkice treningowe \u2014 ${trainingDrafts}.` + (deliveryPacksDraft + deliveryPacksApproved > 0 ? ` Pakiety dostawy czekaj\u0105: szkice \u2014 ${deliveryPacksDraft}, zatwierdzone \u2014 ${deliveryPacksApproved}.` : "") + (pendingApprovals > 0 ? ` Dodatkowo pozycje do zatwierdzenia w pipeline: ${pendingApprovals}.` : "");
  } else if (trainingToday >= 5) {
    standingStill = "Fabryka jest bezczynna, bo dzienny limit treningu jest wykonany, a nie ma otwartych zlece\u0144 klienta.";
  } else {
    standingStill = `Fabryka jest bezczynna: limit treningu na dzi\u015B to ${trainingToday}/5 \u2014 uruchom cykl treningowy lub poczekaj na kolejny tick autopilota.`;
  }
  const [nextActionTitle, nextActionDetail] = readyOrders > 0 ? ["Przejrzyj zlecenie klienta", `Zlecenia klienta czekaj\u0105ce na zatwierdzenie, poprawk\u0119 lub odrzucenie: ${readyOrders}.`] : needsRework > 0 ? ["Poczekaj na cykl poprawek lub go uruchom", `Pozycje oznaczone jako wymaga poprawek: ${needsRework}.`] : trainingDrafts > 0 ? ["Przejrzyj zasoby treningowe", `Szkice treningowe gotowe do przegl\u0105du operatora: ${trainingDrafts}.`] : deliveryPacksDraft > 0 ? ["Zatwierd\u017A pakiet dostawy", `Pakiety dostawy w wersji roboczej na /delivery: ${deliveryPacksDraft}.`] : deliveryPacksApproved > 0 ? ["Zmagazynuj zatwierdzony pakiet dostawy", `Zatwierdzone pakiety gotowe na /delivery: ${deliveryPacksApproved}.`] : pendingApprovals > 0 ? ["Przejrzyj pozycj\u0119 do zatwierdzenia w pipeline", `Oczekuj\u0105ce pozycje do zatwierdzenia: ${pendingApprovals}.`] : !autopilotEnabled ? ["Wzn\xF3w autopilota lub \u015Bwiadomie zostaw wstrzymanego", "Zapisane ustawienie autopilota to WY\u0141., a nic nie czeka na przegl\u0105d."] : trainingToday < 5 && openOrders === 0 ? ["Uruchom cykl treningowy", `Dzi\u015B jest ${trainingToday}/5 zasob\xF3w treningowych.`] : ["Dodaj zlecenie klienta / system bezczynny", "Nic nie wymaga przegl\u0105du. Fabryka jest gotowa na now\u0105 prac\u0119 dla klienta."];
  return { mode, nextActionTitle, nextActionDetail, standingStill, waiting, trainingToday };
}
function renderAdmin(state, flash) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production");
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review");
  const approvedOrders = state.orders.filter((o) => o.status === "approved" || o.status === "closed");
  const rejectedOrders = state.orders.filter((o) => o.status === "rejected");
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId);
  const todayTraining = trainingItems.filter((d) => d.date === today);
  const pendingTraining = trainingItems.filter((d) => d.status === "draft_ready");
  const acceptedTraining = trainingItems.filter((d) => d.status === "accepted");
  const rejectedTraining = trainingItems.filter((d) => d.status === "rejected");
  const reworkItems = state.dailyDigitals.filter((d) => d.status === "needs_rework");
  const warehouseAssets = state.dailyDigitals.filter((d) => d.location === "warehouse");
  const trashCount = state.trash.length + state.dailyDigitals.filter((d) => d.location === "trash").length;
  const pendingApprovalCount = state.approvalQueue.filter((a) => a.status === "pending").length;
  const pendingReviewCount = readyOrders.length + pendingTraining.length + reworkItems.length + pendingApprovalCount;
  const packsDraft = state.deliveryPacks.filter((p) => p.status === "draft");
  const packsApproved = state.deliveryPacks.filter((p) => p.status === "approved");
  const packsReady = state.deliveryPacks.filter((p) => p.status === "warehouse_ready");
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const ops = deriveOps(state);
  const mode = ops.mode;
  const nextAction = [ops.nextActionTitle, ops.nextActionDetail];
  const orderBadgeCls = (s) => {
    if (s === "approved" || s === "closed") return "ok";
    if (s === "ready_for_review") return "warn";
    if (s === "rejected") return "bad";
    return "info";
  };
  const itemBadgeCls = (s) => {
    if (s === "accepted") return "ok";
    if (s === "needs_rework") return "warn";
    if (s === "rejected") return "bad";
    if (s === "draft_ready") return "info";
    return "muted";
  };
  const eventBadgeCls = (eventType) => {
    if (/rejected|off/.test(eventType)) return "bad";
    if (/warehouse|approved|accepted|on/.test(eventType)) return "ok";
    if (/rework|cycle/.test(eventType)) return "warn";
    return "info";
  };
  const preview = (text, max = 420) => text.length > max ? `${text.slice(0, max)}...` : text;
  const deliverableFor = (order) => order.deliverableId ? state.dailyDigitals.find((d) => d.id === order.deliverableId) : void 0;
  const renderOrderActions = (d) => {
    if (!d || d.status !== "draft_ready") return "";
    return `
<div class="admin-actions">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(d.id)}">
    <button class="ok" type="submit">Zatwierd\u017A -> Magazyn</button>
  </form>
  <form method="POST" action="/api/delivery">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="create">
    <input type="hidden" name="outputId" value="${E(d.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Zatwierd\u017A -> Pakiet Dostawy</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Notatka do poprawki..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Zg\u0142o\u015B Poprawk\u0119</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Pow\xF3d odrzucenia..." required>
    <button class="bad" type="submit">Odrzu\u0107</button>
  </form>
</div>`;
  };
  const renderOrder = (order) => {
    const d = deliverableFor(order);
    const done = order.status === "approved" || order.status === "closed";
    const cls = order.status === "ready_for_review" ? "ready" : done ? "done" : order.status === "rejected" ? "bad" : "";
    return `
<div class="admin-order ${cls}" id="${d ? `out-${E(d.id)}` : `order-${E(order.id)}`}">
  <div class="daily-header">
    ${badge(statusLabel(order.status), orderBadgeCls(order.status))}
    ${badge(departmentLabel(order.department), "info")}
    <span class="daily-title">${E(order.clientName)}</span>
    ${order.taskType ? `<span class="dim" style="font-size:11px">zadanie: ${E(order.taskType)}</span>` : ""}
    <span class="dim" style="font-size:11px">rev ${order.revisionCount}</span>
  </div>
  <div class="dim" style="font-size:12px;margin-bottom:5px">kontakt: ${E(order.contact ?? "nie podano")}</div>
  <div style="font-size:12.5px;color:#dbe7f0">${E(order.description)}</div>
  ${d ? `
    <div class="admin-preview">${E(preview(d.content))}</div>
    <div class="dim" style="font-size:11px;margin-top:6px">deliverable ${E(d.id)} \xB7 od ${E(d.createdByAgentId)} \xB7 wynik ${d.qualityScore} \xB7 rev ${d.revisionCount} \xB7 ${E(statusLabel(d.status))} \xB7 ${E(d.taskType ?? d.type)}</div>
    ${d.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:4px;color:#d29922">feedback operatora: ${E(d.operatorFeedback)}${d.revisionCount > 0 ? ` (zastosowano w rev ${d.revisionCount})` : ""}</div>` : ""}
    ${renderOrderActions(d)}
  ` : '<div class="dim" style="font-size:12px;margin-top:8px">Brak deliverabla.</div>'}
</div>`;
  };
  const orderGroup = (title, items, empty, anchorId) => `
<div class="admin-panel"${anchorId ? ` id="${anchorId}"` : ""}>
  <h2>${E(title)} (${items.length})</h2>
  <div class="admin-list">
    ${items.length === 0 ? `<p class="dim">${E(empty)}</p>` : [...items].reverse().map(renderOrder).join("")}
  </div>
</div>`;
  const renderTrainingActions = (item) => {
    if (item.status !== "draft_ready" && item.status !== "needs_rework") return "";
    return `
<div class="admin-actions">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="accept">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button class="ok" type="submit">Akceptuj</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Magazyn</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Notatka do poprawki..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Poprawka</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Pow\xF3d odrzucenia..." required>
    <button class="bad" type="submit">Odrzu\u0107</button>
  </form>
</div>`;
  };
  const renderTrainingItem = (item) => `
<div class="admin-order ${item.status === "rejected" ? "bad" : item.status === "accepted" ? "done" : item.status === "needs_rework" ? "ready" : ""}" id="out-${E(item.id)}">
  <div class="daily-header">
    ${badge(statusLabel(item.status), itemBadgeCls(item.status))}
    ${badge(departmentLabel(item.department), "info")}
    ${badge(statusLabel("training"), "muted")}
    <span class="daily-title">${E(item.title)}</span>
    <span class="dim" style="font-size:11px">${E(item.taskType ?? item.type)} \xB7 od ${E(item.createdByAgentId)} \xB7 wynik ${item.qualityScore} \xB7 rev ${item.revisionCount} \xB7 ${E(item.date)}</span>
  </div>
  <div class="dim mono" style="font-size:11px;margin-top:4px">output ${E(item.id)}</div>
  <div class="admin-preview">${E(preview(item.content, 300))}</div>
  ${item.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:6px;color:#d29922">feedback: ${E(item.operatorFeedback)}${item.revisionCount > 0 ? ` (zastosowano w rev ${item.revisionCount})` : ""}</div>` : ""}
  ${renderTrainingActions(item)}
</div>`;
  const latestWarehouse = [...warehouseAssets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const criticalEvents = [...state.events].reverse().filter(
    (e) => e.eventType.startsWith("order.") || e.eventType === "factory.cycle" || e.eventType.startsWith("daily.") || e.eventType.startsWith("approval.") || e.eventType === "factory.autopilot_on" || e.eventType === "factory.autopilot_off"
  ).slice(0, 18);
  const workroomAgents = ["N", "MA", "SA", "DA", "RA", "QAA"];
  const agentNames = {
    N: "Dyrektor Fabryki",
    MA: "Producent Marketingu",
    SA: "Producent Sprzeda\u017Cy",
    DA: "Producent Realizacji",
    RA: "Producent Bada\u0144",
    QAA: "Producent QA"
  };
  const lastRun = state.workRuns[state.workRuns.length - 1];
  const recentRuns = [...state.workRuns].reverse().slice(0, 8);
  const runStepPairs = [...state.workRuns].reverse().flatMap((run) => run.steps.map((step) => ({ run, step })));
  const latestStepFor = (agentId) => runStepPairs.find((x) => x.step.agentId === agentId);
  const digitalById = new Map(state.dailyDigitals.map((d) => [d.id, d]));
  const renderWorkAgent = (agentId) => {
    const latest = latestStepFor(agentId);
    const step = latest?.step;
    const outputDigital = step?.outputId ? digitalById.get(step.outputId) : void 0;
    const status = !step ? "idle" : latest.run.status === "failed" || step.status === "failed" ? "blocked" : step.status === "skipped" ? "idle" : outputDigital?.status === "draft_ready" || outputDigital?.status === "needs_rework" ? "waiting_review" : "completed";
    const relatedOrder = outputDigital?.orderId;
    const next = agentId === "N" ? nextAction[0] : status === "waiting_review" ? `Operator: przejrzyj ${step?.outputId ?? "output"}` : status === "blocked" ? "Sprawd\u017A nieudany przebieg pracy poni\u017Cej" : "Czeka na pasuj\u0105ce zlecenie, poprawk\u0119 lub slot treningowy";
    return `
<div class="work-agent ${status === "blocked" ? "failed" : status === "waiting_review" ? "active" : "waiting"}">
  <div class="name">${E(agentId)} \xB7 ${E(agentNames[agentId])}</div>
  <div class="meta">${E(statusLabel(status))}${step?.department ? ` \xB7 ${E(departmentLabel(step.department))}` : ""}${step ? ` \xB7 ostatni przebieg ${E(step.finishedAt.slice(0, 19).replace("T", " "))}` : ""}</div>
  <div class="line"><strong>Ostatnie zadanie:</strong> ${E(step?.jobType ?? "jeszcze \u017Cadne")}</div>
  <div class="line"><strong>Ostatnie wej\u015Bcie:</strong> ${step ? E(preview(step.inputSummary, 110)) : "\u2014"}</div>
  <div class="line"><strong>Ostatnie wyj\u015Bcie:</strong> ${E(step?.outputSummary ? preview(step.outputSummary, 110) : "Jeszcze brak zarejestrowanego wyj\u015Bcia")}</div>
  ${step?.outputId ? `<div class="line mono" style="font-size:11px"><strong>ID wyj\u015Bcia:</strong> <a href="#out-${E(step.outputId)}">${E(step.outputId)}</a></div>` : ""}
  ${relatedOrder ? `<div class="line mono" style="font-size:11px"><strong>Powi\u0105zane zlecenie:</strong> ${E(relatedOrder)}</div>` : ""}
  <div class="line"><strong>Dalej:</strong> ${E(next)}</div>
</div>`;
  };
  const renderStep = (step) => `
<div class="timeline-step ${step.status}">
  <div class="daily-header">
    ${badge(step.agentId, "info")}
    ${badge(statusLabel(step.status), step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")}
    <span class="daily-title">${E(step.agentName)}</span>
    <span class="dim" style="font-size:11px">${E(step.jobType)}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Wej\u015Bcie:</strong> ${E(step.inputSummary)}</div>
  ${step.outputSummary ? `<div class="dim" style="font-size:12px;margin-top:4px"><strong>Wyj\u015Bcie:</strong> ${E(step.outputSummary)}</div>` : ""}
  ${step.outputId ? `<div class="dim mono" style="font-size:11px;margin-top:4px">outputId: ${E(step.outputId)}</div>` : ""}
  ${step.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:4px">ograniczenia: ${E(step.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim mono" style="font-size:10.5px;margin-top:4px">${E(step.startedAt.slice(11, 19))} -> ${E(step.finishedAt.slice(11, 19))}</div>
</div>`;
  return layout("Kokpit Szefa/Administratora", "/admin", `
<div class="admin-shell">
  <section class="admin-hero">
    <div>
      <div class="admin-kicker">Centrum dowodzenia za\u0142o\u017Cyciela</div>
      <h1 class="admin-title">Kokpit Szefa/Administratora</h1>
      <p class="admin-sub">Operacyjna kontrola nad factory-core v0.2.1. Autonomia my\u015Blenia bez autonomii dzia\u0142ania: system mo\u017Ce produkowa\u0107 prac\u0119 wewn\u0119trzn\u0105, ale operator zatwierdza ka\u017Cdy krok wychodz\u0105cy na zewn\u0105trz.</p>
    </div>
    <div class="admin-mode">
      ${badge(modeLabel(mode), mode === "CLIENT_MODE" ? "warn" : mode === "REWORK_MODE" ? "warn" : mode === "NO_CLIENT_TRAINING_MODE" ? "info" : "muted")}
      ${badge(autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", autopilotEnabled ? "ok" : "bad")}
      ${badge("TRYB BEZPIECZNY \u2014 brak wysy\u0142ki na zewn\u0105trz", "ok")}
      <span class="dim" style="font-size:12px">ostatni cykl: ${lastRun ? `${E(modeLabel(lastRun.mode))} \xB7 ${E(statusLabel(lastRun.status))} \xB7 via ${E(lastRun.trigger)} \xB7 ${E(lastRun.finishedAt.slice(0, 19).replace("T", " "))}` : "jeszcze nic nie zarejestrowano"}</span>
      <span class="dim" style="font-size:12px">dalej: ${E(nextAction[0])}</span>
      <span class="dim" style="font-size:11px">lokalna pojedyncza instancja \xB7 nic nie opuszcza fabryki bez zgody operatora</span>
    </div>
  </section>

  ${flashHtml}

  <section class="admin-grid" aria-label="Executive Summary">
    <div class="admin-card"><div class="v info">${state.orders.length}</div><div class="l">Zlecenia razem</div></div>
    <div class="admin-card"><div class="v ${readyOrders.length ? "warn" : "ok"}">${readyOrders.length}</div><div class="l">Zlecenia gotowe do przegl\u0105du</div></div>
    <div class="admin-card"><div class="v ${openOrders.length ? "warn" : "ok"}">${openOrders.length}</div><div class="l">Otwarte zlecenia</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Licznik treningu</div></div>
    <div class="admin-card"><div class="v ${pendingReviewCount ? "warn" : "ok"}">${pendingReviewCount}</div><div class="l">Pozycje do przegl\u0105du</div></div>
    <div class="admin-card"><div class="v ok">${state.warehouse.length + warehouseAssets.length}</div><div class="l">Stan magazynu</div></div>
    <div class="admin-card"><div class="v bad">${trashCount}</div><div class="l">Kosz/odrzucone razem</div></div>
    <div class="admin-card"><div class="v info">${state.events.length}</div><div class="l">Zdarzenia razem</div></div>
  </section>

  <section class="admin-grid" aria-label="Business Loop">
    <div class="admin-card"><div class="v info">${SERVICE_CATALOG.length}</div><div class="l">Us\u0142ugi w katalogu</div></div>
    <div class="admin-card"><div class="v ${openOrders.length + readyOrders.length ? "warn" : "ok"}">${openOrders.length + readyOrders.length}</div><div class="l">Aktywne zlecenia klient\xF3w</div></div>
    <div class="admin-card"><div class="v ${packsDraft.length + packsApproved.length ? "warn" : "ok"}">${packsDraft.length}/${packsApproved.length}/${packsReady.length}</div><div class="l">Pakiety szkic/zatw./gotowe</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Limit treningu</div></div>
    <div class="admin-card"><div class="v ok">${state.caseRecords.length}</div><div class="l">Karty spraw</div></div>
  </section>

  <section class="admin-action">
    <h2>Nast\u0119pna Akcja Operatora</h2>
    <strong>${E(nextAction[0])}</strong>
    <p class="dim">${E(nextAction[1])}</p>
  </section>

  <section class="admin-two">
    <div class="admin-panel">
      <h2>Dodaj Zlecenie Klienta</h2>
      <form method="POST" action="/api/order">
        <input type="hidden" name="returnTo" value="/admin">
        <div class="admin-input-row">
          <input name="clientName" placeholder="Nazwa klienta" required>
          <input name="contact" placeholder="Kontakt">
          <select name="serviceId">
            <option value="">\u2014 us\u0142uga: dowolny brief \u2014</option>
            ${SERVICE_CATALOG.map((s) => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("")}
          </select>
          <select name="language">
            <option value="EN">EN</option>
            <option value="PL">PL</option>
          </select>
          <select name="department">
            <option value="marketing">Marketing</option>
            <option value="sales">Sprzeda\u017C</option>
            <option value="delivery" selected>Realizacja</option>
            <option value="research">Badania</option>
            <option value="qa">QA</option>
          </select>
        </div>
        <textarea name="description" placeholder="Opisz \u017C\u0105dany deliverable..." required></textarea>
        <div class="admin-actions"><button type="submit">Dodaj Zlecenie</button></div>
      </form>
    </div>

    <div class="admin-panel hot">
      <h2>Kontrola Autopilota</h2>
      <p class="dim" style="margin-bottom:10px">Zapisany stan: <strong>${autopilotEnabled ? "W\u0141." : "WY\u0141."}</strong></p>
      <div class="admin-actions">
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="off">
          <button class="bad" type="submit">Wstrzymaj Autopilota</button>
        </form>
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="on">
          <button class="ok" type="submit">Wzn\xF3w Autopilota</button>
        </form>
        <form method="POST" action="/api/daily">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="run">
          <input type="hidden" name="date" value="${today}">
          <button type="submit">Uruchom Cykl Treningowy</button>
        </form>
        <form method="POST" action="/api/demo-order">
          <input type="hidden" name="returnTo" value="/admin">
          <button type="submit">Utw\xF3rz Demo Zlecenie HVAC</button>
        </form>
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Podsumowanie Zlece\u0144</h2>
    <div class="admin-three">
      <div class="stat"><div class="v info">${openOrders.length}</div><div class="l">nowe / w produkcji</div></div>
      <div class="stat"><div class="v warn">${readyOrders.length}</div><div class="l">gotowe do przegl\u0105du</div></div>
      <div class="stat"><div class="v ok">${approvedOrders.length}</div><div class="l">zatwierdzone / zamkni\u0119te</div></div>
    </div>
  </section>

  <section class="admin-two">
    <div class="admin-list">
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - nowe / w produkcji", openOrders, "Brak zlece\u0144 obecnie w produkcji.")}
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - gotowe do przegl\u0105du", readyOrders, "Brak zlece\u0144 klient\xF3w czekaj\u0105cych na przegl\u0105d.", "orders-review")}
    </div>
    <div class="admin-list">
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - zatwierdzone / zamkni\u0119te", approvedOrders, "Brak zatwierdzonych lub zamkni\u0119tych zlece\u0144.")}
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - odrzucone", rejectedOrders, "Brak odrzuconych zlece\u0144.")}
    </div>
  </section>

  <section class="admin-panel" id="training-review">
    <h2>Przegl\u0105d Treningu Dziennego</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${todayTraining.length}/5</div><div class="l">dzi\u015B</div></div>
      <div class="stat"><div class="v warn">${pendingTraining.length}</div><div class="l">oczekuj\u0105ce szkic gotowy</div></div>
      <div class="stat"><div class="v ok">${acceptedTraining.length}</div><div class="l">zaakceptowane</div></div>
      <div class="stat"><div class="v bad">${rejectedTraining.length}</div><div class="l">odrzucone</div></div>
      <div class="stat"><div class="v warn">${trainingItems.filter((d) => d.status === "needs_rework").length}</div><div class="l">wymaga poprawek</div></div>
      <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">zmagazynowane</div></div>
    </div>
    <div class="admin-list">
      ${trainingItems.length === 0 ? '<p class="dim">Brak zasob\xF3w treningowych.</p>' : [...trainingItems].reverse().slice(0, 12).map(renderTrainingItem).join("")}
    </div>
  </section>

  <section class="admin-panel" id="integrity-guard">
    <h2>Integrity Guard \u2014 Monitor Pinokia</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Nos ro\u015Bnie, gdy odrzucasz (+${INTEGRITY_LIMITS.growRejected}) lub zwracasz do poprawki (+${INTEGRITY_LIMITS.growRework}), a maleje, gdy akceptujesz (\u2212${INTEGRITY_LIMITS.shrinkAccepted}). Przy ${INTEGRITY_LIMITS.critical}cm protok\xF3\u0142 HRAR kwarantannuje agenta z produkcji klienckiej \u2014 trening pozostaje dozwolony. Tylko Tw\xF3j reset (God Layer) to znosi.</p>
    <table class="admin-table">
      <thead><tr><th>Agent</th><th>Nos</th><th>Status</th><th>Naruszenia</th><th>Ostatni sygna\u0142</th><th>Akcja</th></tr></thead>
      <tbody>
        ${getIntegrityRecords(store).map((r) => `<tr>
          <td class="mono">${E(r.agentId)}</td>
          <td><span class="mono">${r.noseLength}cm</span><span class="score-bar"><span class="score-fill" style="width:${r.noseLength}%;background:${r.noseLength >= INTEGRITY_LIMITS.critical ? "#f85149" : r.noseLength >= INTEGRITY_LIMITS.watch ? "#d29922" : "#3fb950"}"></span></span></td>
          <td>${badge(statusLabel(r.status), r.status === "quarantined" ? "bad" : r.status === "watch" ? "warn" : "ok")}</td>
          <td class="mono">${r.breaches}</td>
          <td class="dim" style="font-size:11.5px">${E(r.lastSignal ?? "\u2014")}</td>
          <td>${r.noseLength > 0 || r.status !== "healthy" ? `
            <form method="POST" action="/api/integrity" style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
              <input type="hidden" name="action" value="reset">
              <input type="hidden" name="agentId" value="${E(r.agentId)}">
              <select name="reason" required style="font-size:11px">
                <option value="">pow\xF3d...</option>
                ${INTEGRITY_RESET_REASONS.map((rr) => `<option value="${E(rr)}">${E(rr)}</option>`).join("")}
              </select>
              <input name="note" placeholder="notatka (opcjonalnie)" style="font-size:11px;width:110px">
              <button type="submit" style="font-size:11.5px">Reset (God Layer)</button>
            </form>` : '<span class="dim" style="font-size:11.5px">\u2014</span>'}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </section>

  <section class="admin-panel">
    <h2>Silnik Lead\xF3w \u2014 LEA (Dyrektor Wzrostu)</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">LEA kwalifikuje leady (problem \u2192 bud\u017Cet \u2192 decydent) i redaguje odpowiedzi w personie Dyrektora Wzrostu. Wysy\u0142asz zawsze Ty. Pe\u0142ny widok: <a href="/lead-engine" style="color:#58a6ff">/lead-engine</a></p>
    <div class="admin-three">
      <div class="stat"><div class="v info">${state.leadThreads.length}</div><div class="l">W\u0105tki lead\xF3w</div></div>
      <div class="stat"><div class="v ${state.leadThreads.filter((t) => pendingDraftFor(t) !== void 0).length ? "warn" : "ok"}">${state.leadThreads.filter((t) => pendingDraftFor(t) !== void 0).length}</div><div class="l">Szkice do wys\u0142ania</div></div>
      <div class="stat"><div class="v ok">${state.leadThreads.filter((t) => t.status === "qualified" || t.status === "won").length}</div><div class="l">Zakwalifikowane / wygrane</div></div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Linia Produkcyjna Agent\xF3w</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Skr\xF3cony widok hali produkcyjnej. Pe\u0142ny widok: <a href="/production-line" style="color:#58a6ff">/production-line</a></p>
    ${(() => {
    const pl = productionLineFor(state);
    return `
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${pl.activeClientOrders}</div><div class="l">Aktywne zadania klienckie</div></div>
      <div class="stat"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Zadania poprawek</div></div>
      <div class="stat"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft + pl.deliveryPacks.approved}</div><div class="l">Zadania pakiet\xF3w czekaj\u0105ce</div></div>
      <div class="stat"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Trening dzi\u015B</div></div>
    </div>
    <table class="admin-table">
      <thead><tr><th>Stacja</th><th>Agent</th><th>Status</th><th>Zadania</th><th>Ostatnie</th></tr></thead>
      <tbody>
        ${pl.stations.map((st) => `<tr>
          <td>${E(st.name)}</td>
          <td class="mono">${E(st.agentId)}</td>
          <td>${badge(statusLabel(st.status), plStatusBadgeCls(st.status))}</td>
          <td class="mono">${st.taskCount}</td>
          <td class="dim" style="font-size:11.5px">${st.lastTask ? E(plPreview(st.lastTask.title, 46)) : "\u2014"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <p class="dim" style="font-size:12px;margin-top:6px">Nast\u0119pna akcja operatora: <strong>${E(pl.nextOperatorAction)}</strong></p>`;
  })()}
  </section>

  <section class="admin-panel">
    <h2>Warsztat Fabryki</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v ${lastRun?.status === "failed" ? "bad" : lastRun ? "ok" : "muted"}">${E(lastRun ? statusLabel(lastRun.status) : "brak")}</div><div class="l">Status ostatniego cyklu</div></div>
      <div class="stat"><div class="v info">${E(modeLabel(lastRun?.mode ?? mode))}</div><div class="l">Ostatni tryb</div></div>
      <div class="stat"><div class="v warn">${lastRun?.steps.length ?? 0}</div><div class="l">Kroki agent\xF3w</div></div>
    </div>
    <div class="idle-box" style="margin-bottom:10px">
      <div class="kicker">Dlaczego Stoi w Miejscu</div>
      <strong>${E(ops.standingStill)}</strong>
      ${lastRun?.idleReason ? `<div class="dim" style="font-size:11.5px;margin-top:4px">Ostatni zarejestrowany cykl m\xF3wi: ${E(lastRun.idleReason)}</div>` : ""}
      <div class="dim" style="font-size:12px;margin-top:4px">Nast\u0119pna akcja operatora: ${E(nextAction[0])} \u2014 ${E(nextAction[1])}</div>
    </div>
    <div class="workroom-grid" style="margin-bottom:12px">
      ${workroomAgents.map(renderWorkAgent).join("")}
    </div>
    <div class="admin-two">
      <div class="admin-subpanel">
        <h2>O\u015B Czasu Ostatniego Przebiegu Pracy</h2>
        ${lastRun ? `
          <p class="dim" style="font-size:12px;margin-bottom:8px">${E(lastRun.id)} \xB7 ${E(lastRun.trigger)} \xB7 ${E(modeLabel(lastRun.mode))} \xB7 ${E(lastRun.startedAt.slice(0, 19).replace("T", " "))} -> ${E(lastRun.finishedAt.slice(11, 19))} \xB7 wyj\u015Bcia ${lastRun.outputsCreated.length}</p>
          <div class="timeline">${lastRun.steps.map(renderStep).join("")}</div>
        ` : '<p class="dim">\u017Baden autonomiczny cykl jeszcze nie zarejestrowa\u0142 pracy.</p>'}
      </div>
      <div class="admin-subpanel">
        <h2>Czeka na Operatora</h2>
        <p class="dim" style="font-size:12px;margin-bottom:8px">${E(ops.standingStill)}</p>
        <table class="admin-table">
          <tbody>
            <tr><th><a href="#orders-review">Zlecenia klient\xF3w gotowe do przegl\u0105du</a></th><td>${readyOrders.length}</td></tr>
            <tr><th><a href="#training-review">Szkice treningowe czekaj\u0105ce</a></th><td>${pendingTraining.length}</td></tr>
            <tr><th><a href="#training-review">Poprawki czekaj\u0105ce na cykl</a></th><td>${reworkItems.length}</td></tr>
            <tr><th>Pozycje do zatwierdzenia w pipeline (zobacz /factory)</th><td>${pendingApprovalCount}</td></tr>
          </tbody>
        </table>
        ${readyOrders.length + pendingTraining.length + reworkItems.length + packsDraft.length + packsApproved.length > 0 ? `
        <table class="admin-table" style="margin-top:10px">
          <thead><tr><th>Pozycja</th><th>Wyj\u015Bcie</th><th>\u0179r\xF3d\u0142o</th><th>Producent</th><th>Dzia\u0142</th><th>Wynik</th><th>Rev</th><th>Bezpieczna nast\u0119pna akcja</th></tr></thead>
          <tbody>
            ${readyOrders.map((o) => {
    const d = deliverableFor(o);
    return `<tr>
                <td>${E(o.clientName)}</td>
                <td class="mono">${d ? `<a href="#out-${E(d.id)}">${E(d.id)}</a>` : "\u2014"}</td>
                <td>${badge(statusLabel("client"), "warn")}</td>
                <td class="mono">${E(d?.createdByAgentId ?? "\u2014")}</td>
                <td>${E(departmentLabel(o.department))}</td>
                <td class="mono">${d?.qualityScore ?? "\u2014"}</td>
                <td class="mono">${d?.revisionCount ?? 0}</td>
                <td class="dim" style="font-size:11.5px"><a href="#${d ? `out-${E(d.id)}` : "orders-review"}">Zatwierd\u017A \u2192 Magazyn \xB7 Poprawka \xB7 Odrzu\u0107</a></td>
              </tr>`;
  }).join("")}
            ${pendingTraining.slice(0, 8).map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge(statusLabel("training"), "muted")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(departmentLabel(d.department))}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="#out-${E(d.id)}">Akceptuj \xB7 Magazyn \xB7 Poprawka \xB7 Odrzu\u0107</a></td>
              </tr>`).join("")}
            ${reworkItems.map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge(statusLabel("rework"), "warn")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(departmentLabel(d.department))}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px">Odtworzy si\u0119 w kolejnym cyklu \u2014 u\u017Cyj "Uruchom Cykl Treningowy"</td>
              </tr>`).join("")}
            ${packsDraft.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge(statusLabel("pack draft"), "info")}</td>
                <td class="mono">\u2014</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">\u2014</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Zatwierd\u017A pakiet na /delivery</a></td>
              </tr>`).join("")}
            ${packsApproved.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge(statusLabel("pack approved"), "ok")}</td>
                <td class="mono">\u2014</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">\u2014</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Zmagazynuj pakiet na /delivery</a></td>
              </tr>`).join("")}
          </tbody>
        </table>` : ""}
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Ostatnie Przebiegi Pracy</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Kliknij przebieg, by zobaczy\u0107 ka\u017Cdy krok agenta: wej\u015Bcie, wyj\u015Bcie, ograniczenia, czas.</p>
    ${recentRuns.length === 0 ? '<p class="dim">Brak zarejestrowanych przebieg\xF3w pracy.</p>' : recentRuns.map((run, i) => `
    <details class="run-drill"${i === 0 ? " open" : ""}>
      <summary>
        <span class="mono dim">${E(run.id)}</span>
        ${badge(modeLabel(run.mode), run.mode === "IDLE" ? "muted" : run.mode === "REWORK_MODE" ? "warn" : "info")}
        ${badge(statusLabel(run.status), run.status === "failed" ? "bad" : "ok")}
        <span class="dim" style="font-size:11.5px">wyzwolone przez: ${E(run.trigger)} \xB7 ${E(run.startedAt.slice(0, 19).replace("T", " "))} -> ${E(run.finishedAt.slice(11, 19))} \xB7 krok\xF3w: ${run.steps.length} \xB7 wyj\u015B\u0107: ${run.outputsCreated.length}</span>
      </summary>
      <div class="drill-body">
        ${run.idleReason ? `<div class="dim" style="font-size:12px">Pow\xF3d bezczynno\u015Bci: ${E(run.idleReason)}</div>` : ""}
        <div class="dim" style="font-size:12px">Nast\u0119pna akcja operatora: ${E(run.nextOperatorAction)}</div>
        ${run.outputsCreated.length ? `<div class="dim mono" style="font-size:11px;margin-top:4px">Utworzone wyj\u015Bcia: ${run.outputsCreated.map((o) => E(o)).join(", ")}</div>` : ""}
        <div class="timeline">${run.steps.map(renderStep).join("")}</div>
      </div>
    </details>`).join("")}
  </section>

  <section class="admin-panel">
    <h2>Pakiety Dostawy</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Artefakty gotowe dla klienta. Operator dostarcza je r\u0119cznie \u2014 fabryka nigdy nie wysy\u0142a. Pe\u0142ny widok: <a href="/delivery" style="color:#58a6ff">/delivery</a></p>
    ${state.deliveryPacks.length === 0 ? '<p class="dim">Brak pakiet\xF3w dostawy. U\u017Cyj "Zatwierd\u017A -> Pakiet Dostawy" na wyniku klienta.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Pakiet</th><th>Klient</th><th>Us\u0142uga</th><th>Status</th><th>Wyj\u015Bcie \u017Ar\xF3d\u0142owe</th><th>Zlecenie</th><th>Utworzono</th></tr></thead>
      <tbody>
        ${[...state.deliveryPacks].reverse().slice(0, 6).map((p) => `<tr>
          <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
          <td>${E(p.clientName)}</td>
          <td>${E(p.serviceName)}</td>
          <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
          <td class="mono dim">${E(p.sourceOutputId)}</td>
          <td class="mono dim">${E(p.orderId)}</td>
          <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-panel">
    <h2>Podsumowanie Magazynu</h2>
    <p class="dim" style="margin-bottom:10px">${state.warehouse.length} ofert z pipeline'u i ${warehouseAssets.length} zasob\xF3w cyfrowych zatwierdzonych przez operatora. Nie istnieje tu \u017Cadna wysy\u0142ka zewn\u0119trzna, e-mail, push do CRM ani publikacja.</p>
    ${latestWarehouse.length === 0 ? '<p class="dim">Magazyn jest pusty.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Tytu\u0142</th><th>Typ</th><th>Dzia\u0142</th><th>Wynik</th><th>Data</th><th>Podgl\u0105d</th></tr></thead>
      <tbody>
        ${latestWarehouse.map((d) => `<tr>
          <td>${E(d.title)}</td>
          <td>${badge(d.orderId ? statusLabel("client order") : statusLabel("training"), d.orderId ? "warn" : "muted")}</td>
          <td>${badge(departmentLabel(d.department), "info")}</td>
          <td class="mono">${d.qualityScore}</td>
          <td class="dim">${E(d.date)}</td>
          <td class="dim" style="font-size:12px">${E(preview(d.content, 140))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-panel">
    <h2>Strumie\u0144 Zdarze\u0144</h2>
    ${criticalEvents.length === 0 ? '<p class="dim">Brak istotnych zdarze\u0144.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Czas</th><th>Agent</th><th>Zdarzenie</th><th>Szczeg\xF3\u0142y</th></tr></thead>
      <tbody>
        ${criticalEvents.map((e) => `<tr>
          <td class="mono dim">${E(e.timestamp.slice(0, 19).replace("T", " "))}</td>
          <td>${badge(e.agentId, "info")}</td>
          <td>${badge(e.eventType, eventBadgeCls(e.eventType))}</td>
          <td class="dim" style="font-size:12px">${E(e.detail)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-safety">
    <div class="admin-panel danger">
      <h2>Znane Ryzyka / Skrzynka Bezpiecze\u0144stwa</h2>
      <ul>
        <li>JsonStore jest jednoprocesowy; dwa serwery mog\u0105 nadpisa\u0107 sobie zapisy.</li>
        <li>events.json ro\u015Bnie bez ogranicze\u0144 i przy du\u017Cym wolumenie b\u0119dzie wymaga\u0107 rotacji.</li>
        <li>Przed dodaniem asynchronicznych wywo\u0142a\u0144 LLM do cykli wymagany jest mutex.</li>
        <li>Brak wysy\u0142ki zewn\u0119trznej, publikacji, scrapingu, push do CRM, e-maili czy wydatk\xF3w na reklam\u0119.</li>
        <li>Zgoda operatora jest wymagana, zanim jakikolwiek zas\xF3b opu\u015Bci fabryk\u0119.</li>
        <li>Pakiety dostawy s\u0105 artefaktami wewn\u0119trznymi \u2014 operator zawsze jest w\u0142a\u015Bcicielem dostawy.</li>
      </ul>
    </div>
    <div class="admin-panel">
      <h2>Zasady Edycji w Panelu</h2>
      <ul>
        <li>Ka\u017Cdy zapis to jawny przycisk operatora lub wys\u0142anie formularza.</li>
        <li>Zlecenia klient\xF3w u\u017Cywaj\u0105 istniej\u0105cej bia\u0142ej listy dzia\u0142\xF3w.</li>
        <li>Decyzje z przegl\u0105du u\u017Cywaj\u0105 istniej\u0105cych, logowanych zdarzeniami akcji dziennych.</li>
        <li>Brak surowej edycji JSON i brak destrukcyjnych zbiorczych mutacji.</li>
        <li>Bramka zatwierdzenia nie mo\u017Ce zosta\u0107 omini\u0119ta z poziomu tego kokpitu.</li>
      </ul>
    </div>
  </section>
</div>`);
}
function renderDelivery(state, flash) {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const packs = [...state.deliveryPacks].reverse();
  const statusCls = (st) => st === "warehouse_ready" ? "ok" : st === "approved" ? "info" : "warn";
  return layout("Pakiety Dostawy", "/delivery", `
<h1>Pakiety Dostawy</h1>
<p class="sub">Artefakty gotowe dla klienta, przygotowane przez fabryk\u0119. <strong style="color:#f85149">Fabryka nigdy nie wysy\u0142a \u2014 operator kopiuje pakiet i dostarcza go r\u0119cznie.</strong></p>
${flashHtml}
${packs.length === 0 ? '<p class="dim">Brak pakiet\xF3w. Na /admin u\u017Cyj "Zatwierd\u017A -> Pakiet Dostawy" na wyniku klienta.</p>' : packs.map((p) => `
<div class="admin-order" id="pack-${E(p.id)}">
  <div class="daily-header">
    ${badge(statusLabel(p.status), statusCls(p.status))}
    <span class="daily-title">${E(p.serviceName)} \u2014 ${E(p.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(p.id)} \xB7 rev ${p.revisionCount} \xB7 ${E(p.date)}</span>
    <span class="mono dim" style="font-size:11px">\u017Ar\xF3d\u0142o ${E(p.sourceOutputId)} \xB7 zlecenie ${E(p.orderId)}</span>
  </div>
  <div class="offer-pre" style="max-height:340px">${E(renderPackMarkdown(p))}</div>
  <div class="admin-actions" style="margin-top:8px">
    ${p.status === "draft" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="approve">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Zatwierd\u017A Pakiet</button>
    </form>` : ""}
    ${p.status === "approved" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="warehouse">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Zmagazynuj Pakiet + Kart\u0119 Sprawy</button>
    </form>` : ""}
    ${p.status === "warehouse_ready" ? `<span class="dim" style="font-size:12px">gotowe do magazynu \u2014 skopiuj markdown powy\u017Cej i dostarcz przez w\u0142asny kana\u0142.</span>` : ""}
  </div>
</div>`).join("")}

<h2>Karty Spraw (${state.caseRecords.length})</h2>
${state.caseRecords.length === 0 ? '<p class="dim">Brak spraw \u2014 zmagazynowanie zatwierdzonego pakietu tworzy jedn\u0105.</p>' : `
<table>
<thead><tr><th>Sprawa</th><th>Klient</th><th>Us\u0142uga</th><th>Problem</th><th>Pakiet</th><th>Kolejny krok</th><th>Utworzono</th></tr></thead>
<tbody>
${[...state.caseRecords].reverse().map((c) => `<tr>
  <td class="mono">${E(c.id)}</td>
  <td>${E(c.clientName)}</td>
  <td>${E(c.serviceName)}</td>
  <td class="dim" style="font-size:12px">${E(c.problem.slice(0, 90))}</td>
  <td class="mono dim">${E(c.deliveryPackId)}</td>
  <td class="dim" style="font-size:12px">${E(c.followUpSuggestion)}</td>
  <td class="dim">${E(c.createdAt.slice(0, 10))}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderFactoryRun(state, flash) {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const ops = deriveOps(state);
  const latestClientOutput = [...state.dailyDigitals].reverse().find((d) => d.orderId);
  const latestOrder = latestClientOutput?.orderId ? state.orders.find((o) => o.id === latestClientOutput.orderId) : void 0;
  const recentPacks = [...state.deliveryPacks].reverse().slice(0, 5);
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px";
  return layout("Start Dnia", "/factory-run", `
<h1>Start Dnia \u2014 jedna strona do prowadzenia dnia</h1>
<p class="sub">
  ${badge(modeLabel(ops.mode), ops.mode === "IDLE" ? "muted" : "info")}
  ${badge(autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", autopilotEnabled ? "ok" : "bad")}
  ${badge("TRYB BEZPIECZNY \u2014 brak wysy\u0142ki na zewn\u0105trz", "ok")}
</p>
${flashHtml}

<div class="idle-box" style="margin-bottom:14px">
  <div class="kicker">Dlaczego Stoi w Miejscu</div>
  <strong>${E(ops.standingStill)}</strong>
  <div class="dim" style="font-size:12px;margin-top:4px">Nast\u0119pna akcja operatora: ${E(ops.nextActionTitle)} \u2014 ${E(ops.nextActionDetail)}</div>
</div>

<h2>Katalog Us\u0142ug (${SERVICE_CATALOG.length})</h2>
<table>
<thead><tr><th>Us\u0142uga</th><th>Dla kogo</th><th>Obietnica</th><th>Dzia\u0142</th><th>Deliverable</th></tr></thead>
<tbody>
${SERVICE_CATALOG.map((sv) => `<tr>
  <td><strong>${E(sv.name)}</strong><br><span class="mono dim" style="font-size:10.5px">${E(sv.id)}</span></td>
  <td class="dim" style="font-size:12px">${E(sv.targetCustomer)}</td>
  <td class="dim" style="font-size:12px">${E(sv.promise)}</td>
  <td>${badge(departmentLabel(sv.defaultDepartment), "info")}</td>
  <td class="dim" style="font-size:11.5px">${E(sv.expectedDeliverables.join(" \xB7 "))}</td>
</tr>`).join("")}
</tbody>
</table>

<div class="form-card">
  <label>Nowe zlecenie klienta \u2014 wybierz us\u0142ug\u0119, opisz sytuacj\u0119 klienta</label>
  <form method="POST" action="/api/order">
    <input type="hidden" name="returnTo" value="/factory-run">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Nazwa klienta / firmy" required style="flex:1;min-width:170px;${inputStyle}">
      <select name="serviceId" style="${inputStyle}">
        <option value="">\u2014 us\u0142uga: dowolny brief \u2014</option>
        ${SERVICE_CATALOG.map((sv) => `<option value="${E(sv.id)}">${E(sv.name)}</option>`).join("")}
      </select>
      <select name="department" style="${inputStyle}">
        <option value="marketing">Marketing</option>
        <option value="sales">Sprzeda\u017C</option>
        <option value="delivery" selected>Realizacja</option>
        <option value="research">Badania</option>
        <option value="qa">QA</option>
      </select>
      <select name="language" style="${inputStyle}">
        <option value="EN">EN</option>
        <option value="PL">PL</option>
      </select>
      <select name="urgency" style="${inputStyle}">
        <option value="normal">normalny</option>
        <option value="high">wysoki</option>
      </select>
    </div>
    <textarea name="description" placeholder="Brief klienta \u2014 czym si\u0119 zajmuje, co go boli, co ma osi\u0105gn\u0105\u0107 wynik..." required></textarea>
    <input name="operatorNotes" placeholder="Notatki operatora (opcjonalnie)" style="width:100%;margin-top:8px;${inputStyle}">
    <div style="margin-top:8px"><button type="submit">Przyjmij Zlecenie -> Wyprodukuj Teraz</button></div>
  </form>
  <form method="POST" action="/api/demo-order" style="margin-top:10px">
    <input type="hidden" name="returnTo" value="/factory-run">
    <button type="submit">Utw\xF3rz Demo Zlecenie (HVAC TestCo \u2014 Audyt AI Workflow + Mini Demo)</button>
  </form>
</div>

<h2>Kolejka Przegl\u0105du</h2>
<table>
<tbody>
  <tr><th>Wyniki klient\xF3w gotowe do przegl\u0105du</th><td>${ops.waiting.ordersReadyForReview}</td></tr>
  <tr><th>Szkice treningowe czekaj\u0105ce</th><td>${ops.waiting.trainingDrafts}</td></tr>
  <tr><th>Poprawki czekaj\u0105ce na cykl</th><td>${ops.waiting.needsRework}</td></tr>
  <tr><th>Pakiety dostawy (szkic / zatwierdzone)</th><td>${ops.waiting.deliveryPacksDraft} / ${ops.waiting.deliveryPacksApproved}</td></tr>
</tbody>
</table>
<p class="dim" style="font-size:12px">Pe\u0142na kontrola przegl\u0105du jest na <a href="/admin" style="color:#58a6ff">/admin</a> i <a href="/delivery" style="color:#58a6ff">/delivery</a>.</p>

<h2>Najnowszy Wynik Klienta</h2>
${latestClientOutput ? `
<div class="admin-order" id="out-${E(latestClientOutput.id)}">
  <div class="daily-header">
    ${badge(statusLabel(latestClientOutput.status), latestClientOutput.status === "draft_ready" ? "warn" : "ok")}
    <span class="daily-title">${E(latestClientOutput.title)}</span>
    <span class="mono dim" style="font-size:11px">${E(latestClientOutput.id)} \xB7 od ${E(latestClientOutput.createdByAgentId)} \xB7 rev ${latestClientOutput.revisionCount}${latestOrder?.serviceName ? ` \xB7 ${E(latestOrder.serviceName)}` : ""}</span>
  </div>
  <div class="offer-pre" style="max-height:260px">${E(latestClientOutput.content)}</div>
  ${latestClientOutput.status === "draft_ready" ? `
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="create">
      <input type="hidden" name="outputId" value="${E(latestClientOutput.id)}">
      <button class="ok" type="submit">Zatwierd\u017A -> Pakiet Dostawy</button>
    </form>
    <form method="POST" action="/api/daily">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(latestClientOutput.id)}">
      <input name="feedback" placeholder="Notatka do poprawki..." required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Zg\u0142o\u015B Poprawk\u0119</button>
    </form>
  </div>` : ""}
</div>` : '<p class="dim">Brak jeszcze wyniku klienta \u2014 dodaj zlecenie powy\u017Cej lub utw\xF3rz demo zlecenie.</p>'}

<h2>Gotowo\u015B\u0107 Pakiet\xF3w Dostawy</h2>
${recentPacks.length === 0 ? '<p class="dim">Brak pakiet\xF3w.</p>' : `
<table>
<thead><tr><th>Pakiet</th><th>Klient</th><th>Us\u0142uga</th><th>Status</th></tr></thead>
<tbody>
${recentPacks.map((p) => `<tr>
  <td class="mono"><a href="/delivery#pack-${E(p.id)}" style="color:#58a6ff">${E(p.id)}</a></td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
</tr>`).join("")}
</tbody>
</table>`}

<div class="admin-actions" style="margin-top:14px">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="run">
    <button type="submit">Uruchom Cykl Teraz</button>
  </form>
  <form method="POST" action="/api/autopilot">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
    <button type="submit">${autopilotEnabled ? "Wstrzymaj Autopilota" : "Wzn\xF3w Autopilota"}</button>
  </form>
</div>`);
}
function plStatusBadgeCls(st) {
  if (st === "completed") return "ok";
  if (st === "waiting_review") return "warn";
  if (st === "ready_for_operator") return "info";
  if (st === "blocked") return "bad";
  if (st === "queued") return "info";
  return "muted";
}
function renderPlTask(t) {
  return `
<div class="pl-task ${t.status}">
  <div class="daily-header">
    ${badge(statusLabel(t.status), plStatusBadgeCls(t.status))}
    ${badge(t.agentId, "info")}
    ${badge(statusLabel(t.source), t.source === "client" ? "warn" : t.source === "rework" ? "bad" : t.source === "delivery_pack" ? "info" : "muted")}
    <span class="daily-title">${E(t.title)}</span>
    <span class="dim" style="font-size:11px">stacja: ${E(stationIdLabel(t.station))}${t.department ? ` \xB7 ${E(departmentLabel(t.department))}` : ""}${typeof t.revisionCount === "number" ? ` \xB7 rev ${t.revisionCount}` : ""}${typeof t.qualityScore === "number" ? ` \xB7 wynik ${t.qualityScore}` : ""}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Wej\u015Bcie:</strong> ${E(t.inputSummary)}</div>
  <div class="dim" style="font-size:12px;margin-top:2px"><strong>Wyj\u015Bcie:</strong> ${E(t.outputSummary)}</div>
  ${t.outputId ? `<div class="dim mono" style="font-size:11px">output ${E(t.outputId)}${t.orderId ? ` \xB7 zlecenie ${E(t.orderId)}` : ""}${t.packId ? ` \xB7 pakiet ${E(t.packId)}` : ""}</div>` : ""}
  ${t.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:2px">ograniczenia: ${E(t.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim" style="font-size:11.5px;margin-top:3px"><strong>Dalej:</strong> ${E(t.nextOperatorAction)}${t.nextStation ? ` (\u2192 ${E(stationIdLabel(t.nextStation))})` : ""}</div>
</div>`;
}
function renderProductionLine(state, flash) {
  const pl = productionLineFor(state);
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px";
  const lineBlock = (title, tasks, empty) => `
<h2>${E(title)} (${tasks.length})</h2>
${tasks.length === 0 ? `<p class="dim">${E(empty)}</p>` : tasks.map(renderPlTask).join("")}`;
  return layout("Linia Produkcyjna", "/production-line", `
<h1>Linia Produkcyjna Agent\xF3w</h1>
<p class="sub">
  ${badge(modeLabel(pl.mode), pl.mode === "IDLE" ? "muted" : "info")}
  ${badge(pl.autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", pl.autopilotEnabled ? "ok" : "bad")}
  ${badge("TRYB BEZPIECZNY \u2014 brak wysy\u0142ki na zewn\u0105trz", "ok")}
  <span class="dim" style="font-size:12px">uczciwy widok synchroniczny \u2014 brak udawanych \u017Cywych agent\xF3w</span>
</p>
${flashHtml}

<section class="admin-grid" aria-label="Production Summary">
  <div class="admin-card"><div class="v info">${pl.activeClientOrders}</div><div class="l">Aktywne zlecenia klient\xF3w</div></div>
  <div class="admin-card"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Limit treningu</div></div>
  <div class="admin-card"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft}/${pl.deliveryPacks.approved}/${pl.deliveryPacks.warehouseReady}</div><div class="l">Pakiety szkic/zatw./gotowe</div></div>
  <div class="admin-card"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Zadania poprawek</div></div>
</section>

<section class="admin-action">
  <h2>Nast\u0119pna Akcja Operatora</h2>
  <strong>${E(pl.nextOperatorAction)}</strong>
</section>

<h2>Tablica Stacji</h2>
<div class="station-board">
  ${pl.stations.map((st) => `
  <div class="station ${st.status}">
    <div class="sagent">${E(st.agentId)} \xB7 ${E(st.name)}</div>
    <div class="sname">${badge(statusLabel(st.status), plStatusBadgeCls(st.status))} <span class="dim" style="font-size:11px">zada\u0144: ${st.taskCount}</span></div>
    <div class="spurpose">${E(st.purpose)}</div>
    ${st.lastTask ? `
      <div class="sline"><strong>Ostatnie:</strong> ${E(plPreview(st.lastTask.title, 60))}</div>
      <div class="sline dim">${E(st.lastTask.nextOperatorAction)}</div>
    ` : `<div class="sline dim">Brak zadania na tej stacji.</div>`}
  </div>`).join("")}
</div>

<div class="form-card">
  <label>Utw\xF3rz Demo Przebieg Produkcyjny \u2014 jawni, wewn\u0119trzni, wyra\u017Anie fikcyjni klienci</label>
  <form method="POST" action="/api/demo-order">
    <input type="hidden" name="returnTo" value="/production-line">
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <select name="demo" style="${inputStyle}">
        ${DEMO_CLIENTS.map((d) => `<option value="${E(d.key)}">${E(d.clientName)} \u2014 ${E(d.serviceId)}</option>`).join("")}
      </select>
      <button type="submit">Utw\xF3rz Demo Przebieg Produkcyjny</button>
    </div>
  </form>
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/daily"><input type="hidden" name="returnTo" value="/production-line"><input type="hidden" name="action" value="run"><button type="submit">Uruchom Cykl Teraz</button></form>
  </div>
</div>

${lineBlock("Linia Klienta", pl.clientLine, "Brak zlece\u0144 klient\xF3w \u2014 utw\xF3rz demo przebieg produkcyjny powy\u017Cej.")}
${lineBlock("Linia Treningowa", pl.trainingLine, "Brak zada\u0144 treningowych dzi\u015B. Uruchom cykl bez otwartych zlece\u0144 klient\xF3w.")}
${lineBlock("Linia Poprawek", pl.reworkLine, "Nic nie jest oznaczone do poprawki.")}
${lineBlock("Linia Pakiet\xF3w Dostawy", pl.deliveryPackLine, "Brak pakiet\xF3w dostawy \u2014 zatwierd\u017A wynik klienta do pakietu.")}

<h2>Ostatnie Przebiegi</h2>
${state.workRuns.length === 0 ? '<p class="dim">Brak zarejestrowanych przebieg\xF3w produkcyjnych.</p>' : [...state.workRuns].reverse().slice(0, 6).map((run) => `
<details class="run-drill">
  <summary>
    <span class="mono dim">${E(run.id)}</span>
    ${badge(modeLabel(run.mode), run.mode === "IDLE" ? "muted" : "info")}
    ${badge(statusLabel(run.status), run.status === "failed" ? "bad" : "ok")}
    <span class="dim" style="font-size:11.5px">via ${E(run.trigger)} \xB7 ${E(run.startedAt.slice(0, 19).replace("T", " "))} \xB7 krok\xF3w: ${run.steps.length} \xB7 wyj\u015B\u0107: ${run.outputsCreated.length}</span>
  </summary>
  <div class="drill-body">
    <div class="dim" style="font-size:12px">Nast\u0119pna akcja operatora: ${E(run.nextOperatorAction)}</div>
    ${run.steps.map((step) => `<div class="pl-task ${step.status === "completed" ? "completed" : step.status === "failed" ? "blocked" : "skipped"}">
      <div class="daily-header">${badge(step.agentId, "info")} ${badge(statusLabel(step.status), step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")} <span class="daily-title">${E(step.agentName)}</span> <span class="dim" style="font-size:11px">${E(step.jobType)}</span></div>
      <div class="dim" style="font-size:12px"><strong>Wej\u015Bcie:</strong> ${E(step.inputSummary)}</div>
      ${step.outputSummary ? `<div class="dim" style="font-size:12px"><strong>Wyj\u015Bcie:</strong> ${E(step.outputSummary)}</div>` : ""}
      ${step.outputId ? `<div class="dim mono" style="font-size:11px">outputId: ${E(step.outputId)}</div>` : ""}
    </div>`).join("")}
  </div>
</details>`).join("")}`);
}
function leadStatusBadgeCls(st) {
  if (st === "won") return "ok";
  if (st === "lost") return "bad";
  if (st === "qualified" || st === "hot") return "warn";
  if (st === "warm") return "info";
  return "muted";
}
function renderLeadMessage(m) {
  const who = m.author === "lead" ? badge("LEAD", "warn") : m.author === "operator_sent" ? badge("WYS\u0141ANE (Ty)", "ok") : badge(m.kind === "proposal" ? "SZKIC OFERTY (LEA)" : "SZKIC (LEA)", "info");
  const meta = m.author === "lea_draft" ? `<span class="dim" style="font-size:10.5px"> m\xF3zg: ${E(m.draftMode === "anthropic" ? "Claude (live)" : "szablon (offline)")}${m.objective ? ` \xB7 cel: ${E(m.objective)}` : ""}</span>` : "";
  return `
<div class="pl-task ${m.author === "lead" ? "waiting_review" : m.author === "operator_sent" ? "completed" : "ready_for_operator"}">
  <div class="daily-header">${who}<span class="dim mono" style="font-size:10.5px">${E(m.at.slice(0, 16).replace("T", " "))}</span>${meta}</div>
  <div class="daily-content" style="max-height:220px">${E(m.text)}</div>
</div>`;
}
function renderLeadEngine(state, flash) {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const threads = [...state.leadThreads].reverse();
  const active = state.leadThreads.filter((t) => t.status !== "won" && t.status !== "lost");
  const awaiting = state.leadThreads.filter((t) => pendingDraftFor(t) !== void 0);
  const qualified = state.leadThreads.filter((t) => t.status === "qualified" || t.status === "won");
  const mode = leadDrafterMode();
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px";
  const qualChip = (label, value) => value ? `<span class="badge ok" title="${E(value)}">${E(label)} \u2713</span>` : `<span class="badge muted">${E(label)} \u2014</span>`;
  const renderThread = (t) => {
    const draft = pendingDraftFor(t);
    const closed = t.status === "won" || t.status === "lost";
    return `
<div class="admin-order ${t.status === "won" ? "done" : t.status === "lost" ? "bad" : draft ? "ready" : ""}" id="lead-${E(t.id)}">
  <div class="daily-header">
    ${badge(statusLabel(t.status), leadStatusBadgeCls(t.status))}
    <span class="daily-title">${E(t.leadName)}</span>
    ${t.company ? `<span class="dim" style="font-size:12px">${E(t.company)}</span>` : ""}
    ${t.source ? `<span class="dim" style="font-size:11px">\u017Ar\xF3d\u0142o: ${E(t.source)}</span>` : ""}
    <span class="mono dim" style="font-size:11px">${E(t.id)}</span>
    ${t.draftRevision > 0 ? `<span class="dim" style="font-size:11px">rewizja szkicu ${t.draftRevision}</span>` : ""}
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px">
    ${qualChip("Problem", t.qualification.problem)}
    ${qualChip("Bud\u017Cet", t.qualification.budget)}
    ${qualChip("Decydent", t.qualification.decisionMaker)}
  </div>
  ${t.messages.length === 0 ? '<p class="dim" style="font-size:12px">Brak wiadomo\u015Bci \u2014 wklej pierwsz\u0105 wiadomo\u015B\u0107 od leada poni\u017Cej.</p>' : t.messages.map(renderLeadMessage).join("")}
  ${draft ? `<div class="idle-box" style="margin:8px 0">
    <div class="kicker">Szkic czeka na Ciebie</div>
    <strong>Skopiuj powy\u017Cszy szkic, w razie potrzeby popraw i wy\u015Blij W\u0141ASNYM kana\u0142em \u2014 fabryka nie wysy\u0142a niczego.</strong>
  </div>` : ""}
  ${closed ? `<p class="dim" style="font-size:12px">W\u0105tek zamkni\u0119ty (${E(statusLabel(t.status))}).</p>` : `
  <div class="admin-actions">
    <form method="POST" action="/api/lead-engine" style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:240px">
      <input type="hidden" name="action" value="incoming">
      <input type="hidden" name="threadId" value="${E(t.id)}">
      <textarea name="text" placeholder="Wklej now\u0105 wiadomo\u015B\u0107 OD leada..." required style="min-height:56px"></textarea>
      <button class="ok" type="submit" style="align-self:flex-start">Dodaj wiadomo\u015B\u0107 leada \u2192 LEA szkicuje</button>
    </form>
    <form method="POST" action="/api/lead-engine">
      <input type="hidden" name="action" value="redraft">
      <input type="hidden" name="threadId" value="${E(t.id)}">
      <input name="feedback" placeholder="Feedback do szkicu (opcjonalnie)...">
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Przeredaguj szkic</button>
    </form>
    <form method="POST" action="/api/lead-engine">
      <input type="hidden" name="action" value="proposal">
      <input type="hidden" name="threadId" value="${E(t.id)}">
      <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Szkic oferty</button>
    </form>
    <form method="POST" action="/api/lead-engine" style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:240px">
      <input type="hidden" name="action" value="mark-sent">
      <input type="hidden" name="threadId" value="${E(t.id)}">
      <textarea name="text" placeholder="Tre\u015B\u0107, kt\xF3r\u0105 FAKTYCZNIE wys\u0142a\u0142e\u015B (mo\u017Cesz wklei\u0107 poprawion\u0105 wersj\u0119 szkicu)..." required style="min-height:56px"></textarea>
      <button type="submit" style="align-self:flex-start">Oznacz jako wys\u0142ane przeze mnie</button>
    </form>
    <form method="POST" action="/api/lead-engine" style="display:flex;gap:6px;align-items:center">
      <input type="hidden" name="action" value="status">
      <input type="hidden" name="threadId" value="${E(t.id)}">
      <select name="status" required>
        <option value="">status...</option>
        <option value="won">wygrany</option>
        <option value="lost">przegrany</option>
      </select>
      <input name="note" placeholder="notatka (opcjonalnie)" style="min-width:120px">
      <button type="submit">Zamknij w\u0105tek</button>
    </form>
  </div>`}
</div>`;
  };
  return layout("Silnik Lead\xF3w", "/lead-engine", `
<h1>Silnik Lead\xF3w \u2014 LEA (Dyrektor Wzrostu)</h1>
<p class="sub">
  ${badge(mode === "anthropic" ? "M\xD3ZG: Claude (live)" : "M\xD3ZG: szablon (offline)", mode === "anthropic" ? "ok" : "muted")}
  ${badge("TRYB BEZPIECZNY \u2014 brak wysy\u0142ki na zewn\u0105trz", "ok")}
  <span class="dim" style="font-size:12px">LEA kwalifikuje (problem \u2192 bud\u017Cet \u2192 decydent) i redaguje odpowiedzi \u2014 wysy\u0142asz je zawsze Ty, w\u0142asnym kana\u0142em.</span>
</p>
${flashHtml}

<section class="admin-grid" aria-label="Lead Engine Summary">
  <div class="admin-card"><div class="v info">${state.leadThreads.length}</div><div class="l">W\u0105tki razem</div></div>
  <div class="admin-card"><div class="v ${active.length ? "warn" : "ok"}">${active.length}</div><div class="l">Aktywne w\u0105tki</div></div>
  <div class="admin-card"><div class="v ${awaiting.length ? "warn" : "ok"}">${awaiting.length}</div><div class="l">Szkice do wys\u0142ania</div></div>
  <div class="admin-card"><div class="v ok">${qualified.length}</div><div class="l">Zakwalifikowane / wygrane</div></div>
</section>

<div class="form-card">
  <label>Nowy lead \u2014 kto napisa\u0142 i kt\xF3r\u0119dy?</label>
  <form method="POST" action="/api/lead-engine">
    <input type="hidden" name="action" value="create">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="leadName" placeholder="Imi\u0119 i nazwisko / nazwa leada" required style="flex:1;min-width:180px;${inputStyle}">
      <input name="company" placeholder="Firma (opcjonalnie)" style="flex:1;min-width:160px;${inputStyle}">
      <input name="source" placeholder="\u0179r\xF3d\u0142o: LinkedIn / mail / polecenie..." style="min-width:160px;${inputStyle}">
    </div>
    <textarea name="firstMessage" placeholder="Wklej pierwsz\u0105 wiadomo\u015B\u0107 od leada (opcjonalnie \u2014 LEA od razu przygotuje szkic odpowiedzi)"></textarea>
    <div style="margin-top:8px"><button type="submit">Utw\xF3rz w\u0105tek leada</button></div>
  </form>
</div>

<h2>W\u0105tki (${threads.length})</h2>
${threads.length === 0 ? '<p class="dim">Brak w\u0105tk\xF3w. Dodaj pierwszego leada powy\u017Cej.</p>' : threads.map(renderThread).join("")}`);
}
function renderEvents(state) {
  const events = [...state.events].reverse();
  return layout("Zdarzenia", "/events", `
<h1>Dziennik Zdarze\u0144</h1>
<p class="sub">${events.length} zdarze\u0144 \u2014 wszystkie decyzje pipeline'u zarejestrowane</p>
${events.length === 0 ? '<p class="dim">Brak zdarze\u0144.</p>' : `
<table>
<thead><tr><th>Agent</th><th>Zdarzenie</th><th>Sygna\u0142</th><th>Szczeg\xF3\u0142y</th><th>Czas</th></tr></thead>
<tbody>
${events.map((e) => {
    const cls = /fail|disqualified|bad|rejected/.test(e.eventType) ? "bad" : /qualified|passed|approved|warehouse/.test(e.eventType) ? "ok" : /required|revised/.test(e.eventType) ? "warn" : "info";
    return `<tr>
  <td>${badge(e.agentId, "info")}</td>
  <td>${badge(e.eventType, cls)}</td>
  <td class="mono dim">${E(e.signalId ?? "\u2014")}</td>
  <td class="dim" style="font-size:12px">${E(e.detail)}</td>
  <td class="dim mono" style="font-size:11px">${E(e.timestamp.slice(11, 19))}</td>
</tr>`;
  }).join("")}
</tbody>
</table>`}`);
}
async function readBody(req) {
  return new Promise((resolve4) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const params = {};
      if (body.startsWith("{")) {
        try {
          Object.assign(params, JSON.parse(body));
        } catch {
        }
      } else {
        for (const pair of body.split("&")) {
          const [k, v] = pair.split("=");
          if (k) params[decodeURIComponent(k)] = decodeURIComponent((v ?? "").replace(/\+/g, " "));
        }
      }
      resolve4(params);
    });
  });
}
function html(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}
function redirect(res, to) {
  res.writeHead(302, { Location: to });
  res.end();
}
function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
var requestHandler = async (req, res) => {
  const rawUrl = req.url ?? "/";
  const parsed = new URL(rawUrl, "http://internal");
  let url = parsed.pathname;
  if (url === "/api/index") {
    const original = parsed.searchParams.get("__path") ?? "/";
    url = original.startsWith("/") ? original : `/${original}`;
  }
  if (url.length > 1 && url.endsWith("/")) url = url.slice(0, -1);
  const method = req.method ?? "GET";
  const state = store.snapshot();
  try {
    if (method === "GET") {
      if (url === "/" || url === "/factory") {
        return html(res, renderFactory(state));
      }
      if (url === "/leads") return html(res, renderLeads(state));
      if (url === "/warehouse") return html(res, renderWarehouse(state));
      if (url === "/trash") return html(res, renderTrash(state));
      if (url === "/events") return html(res, renderEvents(state));
      if (url === "/daily-review") return html(res, renderDailyReview(state));
      if (url === "/orders") return html(res, renderOrders(state));
      if (url === "/admin" || url === "/operator") return html(res, renderAdmin(state));
      if (url === "/factory-run") return html(res, renderFactoryRun(state));
      if (url === "/delivery") return html(res, renderDelivery(state));
      if (url === "/production-line") return html(res, renderProductionLine(state));
      if (url === "/lead-engine") return html(res, renderLeadEngine(state));
      if (url === "/api/admin/state") {
        const ops = deriveOps(state);
        return json(res, {
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          autopilotEnabled,
          lastCycleSummary,
          mode: ops.mode,
          standingStill: ops.standingStill,
          nextOperatorAction: { title: ops.nextActionTitle, detail: ops.nextActionDetail },
          waiting: ops.waiting,
          integrity: getIntegrityRecords(store),
          leadEngine: {
            drafterMode: leadDrafterMode(),
            threads: state.leadThreads.length,
            active: state.leadThreads.filter((t) => t.status !== "won" && t.status !== "lost").length,
            awaitingSend: state.leadThreads.filter((t) => pendingDraftFor(t) !== void 0).length
          },
          businessLoop: {
            servicesInCatalog: SERVICE_CATALOG.length,
            activeOrders: state.orders.filter((o) => o.status === "new" || o.status === "in_production").length,
            ordersReadyForReview: state.orders.filter((o) => o.status === "ready_for_review").length,
            deliveryPacks: {
              draft: state.deliveryPacks.filter((p) => p.status === "draft").length,
              approved: state.deliveryPacks.filter((p) => p.status === "approved").length,
              warehouseReady: state.deliveryPacks.filter((p) => p.status === "warehouse_ready").length
            },
            caseRecords: state.caseRecords.length,
            trainingToday: `${ops.trainingToday}/5`
          },
          counts: {
            orders: state.orders.length,
            dailyDigitals: state.dailyDigitals.length,
            trainingToday: `${ops.trainingToday}/5`,
            warehouseOffers: state.warehouse.length,
            warehouseAssets: state.dailyDigitals.filter((d) => d.location === "warehouse").length,
            trash: state.trash.length + state.dailyDigitals.filter((d) => d.location === "trash").length,
            events: state.events.length,
            workRuns: state.workRuns.length
          },
          orders: state.orders.map((o) => ({
            id: o.id,
            clientName: o.clientName,
            department: o.department,
            taskType: o.taskType,
            status: o.status,
            deliverableId: o.deliverableId,
            revisionCount: o.revisionCount,
            updatedAt: o.updatedAt
          })),
          latestWorkRun: state.workRuns[state.workRuns.length - 1] ?? null,
          workRunsSummary: [...state.workRuns].reverse().slice(0, 10).map((r) => ({
            id: r.id,
            mode: r.mode,
            status: r.status,
            trigger: r.trigger,
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
            steps: r.steps.length,
            outputsCreated: r.outputsCreated,
            idleReason: r.idleReason,
            nextOperatorAction: r.nextOperatorAction
          }))
        });
      }
      if (url === "/api/work-runs") {
        return json(res, {
          total: state.workRuns.length,
          workRuns: [...state.workRuns].reverse().slice(0, 20)
        });
      }
      if (url === "/api/production-line") {
        return json(res, productionLineFor(state));
      }
      if (url === "/api/delivery-packs") {
        return json(res, {
          total: state.deliveryPacks.length,
          packs: [...state.deliveryPacks].reverse().slice(0, 20),
          caseRecords: [...state.caseRecords].reverse().slice(0, 20)
        });
      }
      if (url === "/api/lead-engine") {
        return json(res, {
          drafterMode: leadDrafterMode(),
          total: state.leadThreads.length,
          awaitingSend: state.leadThreads.filter((t) => pendingDraftFor(t) !== void 0).length,
          threads: [...state.leadThreads].reverse().slice(0, 50)
        });
      }
      return html(res, `<h1>404</h1><p>${E(method)} ${E(url)} (raw: ${E(rawUrl)})</p>`, 404);
    }
    if (method === "POST" && url === "/api/signal") {
      const params = await readBody(req);
      const raw = (params["raw"] ?? "").trim();
      if (!raw) {
        const errState = store.snapshot();
        return html(res, renderFactory(errState, "B\u0142\u0105d: wymagany jest tekst sygna\u0142u"));
      }
      let result;
      try {
        result = await runOfferAcquisitionForSignal(raw, store);
      } catch (err) {
        const errState = store.snapshot();
        return html(res, renderFactory(errState, `B\u0142\u0105d: ${String(err)}`));
      }
      const newState = store.snapshot();
      const flash = result.status === "awaiting_approval" ? `Pipeline zako\u0144czony \u2014 oferta czeka na Twoje zatwierdzenie (${result.approval?.id})` : result.status === "disqualified" ? `Sygna\u0142 zdyskwalifikowany \u2014 nie pasuje do ICP` : `Pipeline nie powi\xF3d\u0142 si\u0119 po ewaluacji`;
      return html(res, renderFactory(newState, flash));
    }
    if (method === "POST" && url === "/api/action") {
      const params = await readBody(req);
      const action = params["action"] ?? "";
      const id = params["id"] ?? "";
      const item = store.getApprovalItem(id);
      const returnToAdmin = params["returnTo"] === "/admin";
      if (action === "approve" && item && item.status === "pending") {
        store.updateApprovalItem(id, { status: "approved", decidedAt: (/* @__PURE__ */ new Date()).toISOString() });
        const updated = store.getApprovalItem(id);
        const warehouseItem = agentI(updated);
        store.addWarehouseItem(warehouseItem);
        store.addEvent({
          id: randomUUID11(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          agentId: "I",
          eventType: "approval.granted",
          signalId: item.signalId,
          detail: `Operator approved ${id} \u2192 warehouse`
        });
      } else if (action === "reject" && item && item.status === "pending") {
        store.updateApprovalItem(id, { status: "rejected", decidedAt: (/* @__PURE__ */ new Date()).toISOString() });
        store.addTrashItem({
          id: `trash-rej-${id}`,
          signalId: item.signalId,
          reason: `Operator rejected offer ${id}`,
          trashedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        store.addEvent({
          id: randomUUID11(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          agentId: "H",
          eventType: "approval.rejected",
          signalId: item.signalId,
          detail: `Operator rejected ${id}`
        });
      }
      const accept = req.headers["accept"] ?? "";
      if (accept.includes("application/json")) {
        return json(res, { ok: true });
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), "Decyzja zatwierdzenia zarejestrowana."));
      }
      return redirect(res, "/");
    }
    if (method === "POST" && url === "/api/daily") {
      const params = await readBody(req);
      const action = params["action"] ?? "";
      const id = params["id"] ?? "";
      const feedback = (params["feedback"] ?? "").trim();
      const date = params["date"] ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const returnToAdmin = params["returnTo"] === "/admin";
      const returnToRun = params["returnTo"] === "/factory-run";
      const returnToPl = params["returnTo"] === "/production-line";
      const digitalBefore = store.getDailyDigital(id);
      const orderId = digitalBefore?.orderId;
      const respond = (flash) => returnToPl ? html(res, renderProductionLine(store.snapshot(), flash)) : returnToRun ? html(res, renderFactoryRun(store.snapshot(), flash)) : returnToAdmin ? html(res, renderAdmin(store.snapshot(), flash)) : orderId ? html(res, renderOrders(store.snapshot(), flash)) : html(res, renderDailyReview(store.snapshot(), flash));
      const syncOrder = (status, fb) => {
        if (!orderId) return;
        store.updateOrder(orderId, {
          status,
          ...fb ? { operatorFeedback: fb } : {},
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      };
      if (action === "run") {
        try {
          const result = await runAutonomousCycle(store, date, "daily_run");
          lastCycleSummary = `${modeLabel(result.mode)}: trening=${result.trainingCreated} zlecenia=${result.ordersProduced.length} poprawki=${result.reworksRegenerated.length}`;
          return respond(`Cykl zako\u0144czony \u2014 ${lastCycleSummary}`);
        } catch (err) {
          return respond(`B\u0142\u0105d: ${String(err)}`);
        }
      }
      if (action === "accept" && id) {
        acceptDigital(store, id);
        syncOrder("approved");
        return respond("Zaakceptowano.");
      }
      if (action === "rework" && id && feedback) {
        reworkDigital(store, id, feedback);
        syncOrder("in_production", feedback);
        return respond("Oznaczono do poprawki \u2014 autopilot odtworzy to z Twoim feedbackiem.");
      }
      if (action === "reject" && id && feedback) {
        rejectDigital(store, id, feedback);
        syncOrder("rejected", feedback);
        return respond("Odrzucono i przeniesiono do kosza.");
      }
      if (action === "warehouse" && id) {
        warehouseDigital(store, id);
        syncOrder("approved");
        return respond("Wys\u0142ano do magazynu.");
      }
      return respond("B\u0142\u0105d: nieznana akcja lub brak id/feedbacku.");
    }
    if (method === "POST" && url === "/api/order") {
      const params = await readBody(req);
      const clientName = (params["clientName"] ?? "").trim();
      const description = (params["description"] ?? "").trim();
      const contact = (params["contact"] ?? "").trim();
      const departmentRaw = (params["department"] ?? "delivery").trim();
      const serviceIdRaw = (params["serviceId"] ?? "").trim();
      const languageRaw = (params["language"] ?? "").trim().toUpperCase();
      const urgencyRaw = (params["urgency"] ?? "").trim();
      const operatorNotes = (params["operatorNotes"] ?? "").trim();
      const returnToAdmin = params["returnTo"] === "/admin";
      const returnToRun = params["returnTo"] === "/factory-run";
      if (serviceIdRaw && !isValidServiceId(serviceIdRaw)) {
        return json(res, { error: "invalid service", received: serviceIdRaw, allowed: SERVICE_CATALOG.map((sv) => sv.id) }, 400);
      }
      if (!VALID_DEPARTMENTS.includes(departmentRaw)) {
        if (returnToAdmin) {
          return html(res, renderAdmin(store.snapshot(), `B\u0142\u0105d: nieprawid\u0142owy dzia\u0142 ${departmentRaw}`), 400);
        }
        return json(res, { error: "invalid department", received: departmentRaw, allowed: VALID_DEPARTMENTS }, 400);
      }
      const department = departmentRaw;
      if (!clientName || !description) {
        if (returnToAdmin) {
          return html(res, renderAdmin(store.snapshot(), "B\u0142\u0105d: wymagana jest nazwa klienta i opis"));
        }
        return html(res, renderOrders(store.snapshot(), "B\u0142\u0105d: wymagana jest nazwa klienta i opis"));
      }
      const order = createOrder(store, {
        clientName,
        description,
        department,
        ...contact ? { contact } : {},
        ...serviceIdRaw ? { serviceId: serviceIdRaw } : {},
        ...languageRaw === "PL" || languageRaw === "EN" ? { language: languageRaw } : {},
        ...urgencyRaw === "high" ? { urgency: "high" } : {},
        ...operatorNotes ? { operatorNotes } : {}
      });
      const result = await runAutonomousCycle(store, void 0, "order_created");
      lastCycleSummary = `${modeLabel(result.mode)}: zlecenia=${result.ordersProduced.length}`;
      if (returnToRun) {
        return html(res, renderFactoryRun(store.snapshot(), `Zlecenie ${order.id} przyj\u0119te i wyprodukowane \u2014 przejrzyj poni\u017Cej lub na /admin.`));
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Zlecenie ${order.id} przyj\u0119te i wyprodukowane \u2014 przejrzyj deliverable poni\u017Cej.`));
      }
      return html(res, renderOrders(store.snapshot(), `Zlecenie ${order.id} przyj\u0119te i wyprodukowane \u2014 przejrzyj deliverable poni\u017Cej.`));
    }
    if (method === "POST" && url === "/api/delivery") {
      const params = await readBody(req);
      const action = params["action"] ?? "";
      const returnToAdmin = params["returnTo"] === "/admin";
      const returnToRun = params["returnTo"] === "/factory-run";
      const respond = (flash) => returnToAdmin ? html(res, renderAdmin(store.snapshot(), flash)) : returnToRun ? html(res, renderFactoryRun(store.snapshot(), flash)) : html(res, renderDelivery(store.snapshot(), flash));
      if (action === "create") {
        const outputId = (params["outputId"] ?? "").trim();
        const digital = store.getDailyDigital(outputId);
        if (!digital?.orderId) return respond("B\u0142\u0105d: wyj\u015Bcie nie znalezione lub nie jest deliverablem zlecenia klienta.");
        if (digital.status === "draft_ready") {
          warehouseDigital(store, outputId);
          store.updateOrder(digital.orderId, { status: "approved", updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
        }
        const pack = createDeliveryPack(store, outputId);
        return respond(pack ? `Pakiet dostawy ${pack.id} utworzony (szkic) \u2014 przejrzyj go na /delivery.` : "B\u0142\u0105d: nie uda\u0142o si\u0119 utworzy\u0107 pakietu.");
      }
      if (action === "approve") {
        const pack = approveDeliveryPack(store, (params["id"] ?? "").trim());
        return respond(pack ? `Pakiet ${pack.id} zatwierdzony \u2014 zmagazynuj go, gdy b\u0119dzie gotowy.` : "B\u0142\u0105d: pakiet nie znaleziony lub nie jest w szkicu.");
      }
      if (action === "warehouse") {
        const record = warehouseDeliveryPack(store, (params["id"] ?? "").trim());
        return respond(record ? `Pakiet zmagazynowany \u2014 sprawa ${record.id} zarejestrowana. Operator dostarcza r\u0119cznie.` : "B\u0142\u0105d: pakiet nie znaleziony lub nie zatwierdzony.");
      }
      return respond("B\u0142\u0105d: nieznana akcja dostawy.");
    }
    if (method === "POST" && url === "/api/demo-order") {
      const params = await readBody(req);
      const returnTo = params["returnTo"] ?? "";
      const demo = DEMO_CLIENTS.find((d) => d.key === (params["demo"] ?? "").trim()) ?? DEMO_CLIENTS[0];
      const respond = (flash) => returnTo === "/admin" ? html(res, renderAdmin(store.snapshot(), flash)) : returnTo === "/production-line" ? html(res, renderProductionLine(store.snapshot(), flash)) : html(res, renderFactoryRun(store.snapshot(), flash));
      const existing = store.snapshot().orders.find(
        (o) => o.clientName === demo.clientName && (o.status === "new" || o.status === "in_production" || o.status === "ready_for_review")
      );
      if (existing) {
        return respond(`Demo zlecenie ${existing.id} dla ${demo.clientName} jest ju\u017C aktywne \u2014 przejrzyj je zamiast duplikowa\u0107.`);
      }
      const order = createOrder(store, {
        clientName: demo.clientName,
        department: "delivery",
        serviceId: demo.serviceId,
        language: demo.language,
        description: demo.description
      });
      const result = await runAutonomousCycle(store, void 0, "order_created");
      lastCycleSummary = `${modeLabel(result.mode)}: zlecenia=${result.ordersProduced.length}`;
      return respond(`Demo przebieg produkcyjny ${order.id} utworzony dla ${demo.clientName} (${demo.serviceId}) \u2014 tylko wewn\u0119trznie, nic nigdzie nie zosta\u0142o wys\u0142ane.`);
    }
    if (method === "POST" && url === "/api/integrity") {
      const params = await readBody(req);
      const agentIdRaw = (params["agentId"] ?? "").trim();
      if (!agentIdRaw) {
        return json(res, { error: "missing agentId" }, 400);
      }
      if (!PRODUCER_AGENTS.includes(agentIdRaw)) {
        return json(res, { error: "invalid agent", received: agentIdRaw, allowed: PRODUCER_AGENTS }, 400);
      }
      if ((params["action"] ?? "") !== "reset") {
        return json(res, { error: "unknown integrity action" }, 400);
      }
      const reasonRaw = (params["reason"] ?? "").trim();
      if (!reasonRaw) {
        return json(res, { error: "missing reason", allowed: INTEGRITY_RESET_REASONS }, 400);
      }
      if (!isValidResetReason(reasonRaw)) {
        return json(res, { error: "invalid reason", received: reasonRaw, allowed: INTEGRITY_RESET_REASONS }, 400);
      }
      const note = (params["note"] ?? "").trim();
      const updated = resetAgentIntegrity(store, agentIdRaw, reasonRaw, note || void 0);
      return html(res, renderAdmin(
        store.snapshot(),
        updated ? `Reset integralno\u015Bci dla ${agentIdRaw} (${reasonRaw}) \u2014 produkcja kliencka ponownie w\u0142\u0105czona (decyzja God Layer).` : `Nic do zresetowania dla ${agentIdRaw} \u2014 nos ju\u017C na 0.`
      ));
    }
    if (method === "POST" && url === "/api/lead-engine") {
      const params = await readBody(req);
      const action = (params["action"] ?? "").trim();
      const respond = (flash) => html(res, renderLeadEngine(store.snapshot(), flash));
      if (action === "create") {
        const leadName = (params["leadName"] ?? "").trim();
        if (!leadName) return json(res, { error: "missing leadName" }, 400);
        const company = (params["company"] ?? "").trim();
        const source = (params["source"] ?? "").trim();
        const firstMessage = (params["firstMessage"] ?? "").trim();
        const thread = createLeadThread(store, {
          leadName,
          ...company ? { company } : {},
          ...source ? { source } : {}
        });
        if (firstMessage) {
          await recordIncomingLeadMessage(store, thread.id, firstMessage);
          return respond(`W\u0105tek ${thread.id} utworzony \u2014 LEA przygotowa\u0142 pierwszy szkic odpowiedzi.`);
        }
        return respond(`W\u0105tek ${thread.id} utworzony dla ${leadName}.`);
      }
      const threadId = (params["threadId"] ?? "").trim();
      if (!threadId) return json(res, { error: "missing threadId" }, 400);
      if (!store.getLeadThread(threadId)) {
        return json(res, { error: "unknown thread", received: threadId }, 400);
      }
      if (action === "incoming") {
        const text = (params["text"] ?? "").trim();
        if (!text) return json(res, { error: "missing text" }, 400);
        await recordIncomingLeadMessage(store, threadId, text);
        return respond("Wiadomo\u015B\u0107 leada zapisana \u2014 LEA przygotowa\u0142 szkic odpowiedzi.");
      }
      if (action === "redraft") {
        const feedback = (params["feedback"] ?? "").trim();
        await redraftLeadReply(store, threadId, feedback || void 0);
        return respond("LEA przeredagowa\u0142 szkic.");
      }
      if (action === "proposal") {
        await draftLeadProposal(store, threadId);
        return respond("LEA przygotowa\u0142 szkic oferty \u2014 przejrzyj i wy\u015Blij samodzielnie.");
      }
      if (action === "mark-sent") {
        const text = (params["text"] ?? "").trim();
        if (!text) return json(res, { error: "missing text" }, 400);
        markLeadReplySent(store, threadId, text);
        return respond("Zapisano: odpowied\u017A wys\u0142ana przez Ciebie w\u0142asnym kana\u0142em.");
      }
      if (action === "status") {
        const statusRaw = (params["status"] ?? "").trim();
        if (!statusRaw) return json(res, { error: "missing status", allowed: LEAD_THREAD_STATUSES }, 400);
        if (!isValidLeadThreadStatus(statusRaw)) {
          return json(res, { error: "invalid status", received: statusRaw, allowed: LEAD_THREAD_STATUSES }, 400);
        }
        const note = (params["note"] ?? "").trim();
        setLeadThreadStatus(store, threadId, statusRaw, note || void 0);
        return respond(`Status w\u0105tku zmieniony na: ${statusLabel(statusRaw)}.`);
      }
      return json(res, { error: "unknown lead-engine action", received: action }, 400);
    }
    if (method === "POST" && url === "/api/autopilot") {
      const params = await readBody(req);
      const returnToAdmin = params["returnTo"] === "/admin";
      autopilotEnabled = params["action"] !== "off";
      store.setAutopilotEnabled(autopilotEnabled);
      store.addEvent({
        id: randomUUID11(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        agentId: "N",
        eventType: autopilotEnabled ? "factory.autopilot_on" : "factory.autopilot_off",
        detail: `Operator turned autopilot ${autopilotEnabled ? "on" : "off"}`
      });
      if (params["returnTo"] === "/factory-run") {
        return html(res, renderFactoryRun(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`));
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`));
      }
      return html(res, renderFactory(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`));
    }
    html(res, `<h1>404</h1><p>${E(method)} ${E(url)} (raw: ${E(rawUrl)})</p>`, 404);
  } catch (err) {
    console.error(err);
    html(res, `<pre>500: ${E(String(err))}</pre>`, 500);
  }
};
var server = createServer(requestHandler);
var seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  try {
    if (store.snapshot().workRuns.length === 0) {
      const r = await runAutonomousCycle(store, void 0, "startup");
      lastCycleSummary = `${modeLabel(r.mode)}: trening=${r.trainingCreated} zlecenia=${r.ordersProduced.length} poprawki=${r.reworksRegenerated.length}`;
    }
  } catch (err) {
    console.error("[seed] failed:", err);
  }
}
async function autopilotTick(trigger = "timer") {
  if (!autopilotEnabled) return;
  try {
    const r = await runAutonomousCycle(store, void 0, trigger);
    lastCycleSummary = `${modeLabel(r.mode)}: trening=${r.trainingCreated} zlecenia=${r.ordersProduced.length} poprawki=${r.reworksRegenerated.length}`;
    if (r.ordersProduced.length + r.reworksRegenerated.length + r.trainingCreated > 0) {
      console.log(`[autopilot] ${lastCycleSummary}`);
    }
  } catch (err) {
    console.error("[autopilot] cycle failed:", err);
  }
}
if (!ON_VERCEL) {
  setInterval(() => void autopilotTick("timer"), 6e4);
  server.listen(PORT, () => {
    console.log(`
Factory Core v0.2 \u2014 http://localhost:${PORT}`);
    console.log("  /admin        \u2014 boss/admin cockpit");
    console.log("  /operator     \u2014 admin cockpit alias");
    console.log("  /api/admin/state \u2014 read-only cockpit state (JSON)");
    console.log("  /api/work-runs   \u2014 read-only recent work runs (JSON)");
    console.log("  /factory-run  \u2014 run the whole business loop from one page");
    console.log("  /delivery     \u2014 delivery packs + case records");
    console.log("  /api/delivery-packs \u2014 read-only packs + cases (JSON)");
    console.log("  /production-line \u2014 agent production floor view");
    console.log("  /api/production-line \u2014 read-only production line (JSON)");
    console.log("  / or /factory  \u2014 pipeline overview + signal form + autopilot toggle");
    console.log("  /orders        \u2014 client orders: intake, production, review");
    console.log("  /leads         \u2014 qualified leads");
    console.log("  /warehouse     \u2014 approved offers + digital assets");
    console.log("  /trash         \u2014 disqualified / failed / rejected");
    console.log("  /events        \u2014 full event log");
    console.log("  /daily-review  \u2014 NO_CLIENT_TRAINING_MODE daily review");
    console.log("\nAutopilot: ON (60s cycle) \u2014 orders \u2192 reworks \u2192 5 random daily training missions.");
    console.log("Press Ctrl+C to stop.\n");
    void autopilotTick("startup");
  });
}

// scripts/vercel-entry.ts
async function handler(req, res) {
  await ensureSeeded();
  await requestHandler(req, res);
}
export {
  handler as default
};
