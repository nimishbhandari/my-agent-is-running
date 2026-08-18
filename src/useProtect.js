import { useCallback, useEffect, useState } from "react";

const PIN_KEY = "keep-awake-protect-pin";
const ARMED_KEY = "keep-awake-protect-armed";
const LOG_KEY = "keep-awake-protect-log";

// Events closer together than this are folded into one entry with a count, so a
// single mouse-jiggle doesn't produce hundreds of rows.
const BURST_WINDOW_MS = 30_000;
const MAX_ENTRIES = 20;
const MOVE_THROTTLE_MS = 1000;

export const isKeyboardLockSupported =
  typeof navigator !== "undefined" && typeof navigator.keyboard?.lock === "function";

async function hashPin(pin) {
  const data = new TextEncoder().encode(`keep-awake:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useProtect({ fullscreen, keyboardLock, closeWarning, tamperLog: logEnabled }) {
  const [pinHash, setPinHash] = useState(() => localStorage.getItem(PIN_KEY));
  const [isArmed, setIsArmed] = useState(() => localStorage.getItem(ARMED_KEY) === "true");
  const [tamperLog, setTamperLog] = useState(loadLog);

  useEffect(() => {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(tamperLog));
    } catch {
      // storage unavailable; the log just won't survive a reload
    }
  }, [tamperLog]);

  const logEvent = useCallback((type) => {
    setTamperLog((prev) => {
      const now = Date.now();
      const last = prev[prev.length - 1];
      if (last && last.type === type && now - last.at < BURST_WINDOW_MS) {
        return [...prev.slice(0, -1), { ...last, at: now, count: last.count + 1 }];
      }
      return [...prev, { type, at: now, count: 1 }].slice(-MAX_ENTRIES);
    });
  }, []);

  const clearLog = useCallback(() => setTamperLog([]), []);

  const arm = useCallback(async () => {
    localStorage.setItem(ARMED_KEY, "true");
    setIsArmed(true);
    setTamperLog([]);

    if (fullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // rejected (no user gesture / unsupported); the PIN gate still applies
      }
    }
    if (keyboardLock && isKeyboardLockSupported) {
      try {
        await navigator.keyboard.lock(["Escape"]);
      } catch {
        // Chromium-only; harmless elsewhere
      }
    }
  }, [fullscreen, keyboardLock]);

  const disarm = useCallback(async () => {
    localStorage.setItem(ARMED_KEY, "false");
    setIsArmed(false);

    if (isKeyboardLockSupported) {
      try {
        navigator.keyboard.unlock();
      } catch {
        // ignore
      }
    }
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
  }, []);

  const setPin = useCallback(async (pin) => {
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_KEY, hash);
    setPinHash(hash);
  }, []);

  // Clearing the PIN must also disarm. Otherwise the page stays armed with no
  // hash to compare against, every entered PIN fails, and the only way back in
  // is wiping localStorage — a worse lockout than the one it's meant to escape.
  const clearPin = useCallback(() => {
    localStorage.removeItem(PIN_KEY);
    setPinHash(null);
    disarm();
  }, [disarm]);

  // Recovery from the lock screen. Logged first so the reset survives into the
  // tamper banner — you always find out if someone else used this door.
  const forgotPin = useCallback(() => {
    logEvent("pin-reset");
    clearPin();
  }, [logEvent, clearPin]);

  const verifyPin = useCallback(
    async (pin) => {
      const hash = await hashPin(pin);
      if (hash === pinHash) return true;
      logEvent("wrong-pin");
      return false;
    },
    [pinHash, logEvent],
  );

  const restoreFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      if (isKeyboardLockSupported) await navigator.keyboard.lock(["Escape"]);
    } catch {
      // ignore
    }
  }, []);

  // Presence + direct-interaction watchers. Only the *fact* of a keypress is
  // recorded — never which key — so this stays tamper-evidence, not a keylogger.
  useEffect(() => {
    if (!isArmed || !logEnabled) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") logEvent("left-page");
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) logEvent("exited-fullscreen");
    };
    const onInteract = () => logEvent("interaction");

    let lastMove = 0;
    const onMove = () => {
      const now = Date.now();
      if (now - lastMove < MOVE_THROTTLE_MS) return;
      lastMove = now;
      logEvent("interaction");
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    window.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("mousemove", onMove);
    };
  }, [isArmed, logEnabled, logEvent]);

  useEffect(() => {
    if (!isArmed || !closeWarning) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isArmed, closeWarning]);

  return {
    hasPin: Boolean(pinHash),
    isArmed,
    tamperLog,
    setPin,
    clearPin,
    forgotPin,
    verifyPin,
    arm,
    disarm,
    clearLog,
    restoreFullscreen,
  };
}
