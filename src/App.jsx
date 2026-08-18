import { useEffect, useRef, useState } from "react";
import { useWakeLock } from "./useWakeLock.js";
import { useSettings } from "./useSettings.js";
import { useProtect } from "./useProtect.js";
import { hexToRgb } from "./imageUtils.js";
import SettingsPanel from "./SettingsPanel.jsx";
import LockScreen from "./LockScreen.jsx";
import ProtectPanel from "./ProtectPanel.jsx";
import "./App.css";

const TAMPER_LABELS = {
  interaction: "keyboard/mouse activity",
  "left-page": "switched away from the page",
  "exited-fullscreen": "exited fullscreen",
  "wrong-pin": "wrong PIN entered",
  "pin-reset": "PIN was reset from the lock screen",
};

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((n) => String(n).padStart(2, "0")).join(":");
}

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
}

function App() {
  const { isActive, mechanism, startedAt, start, stop } = useWakeLock();
  const { settings, update, reset } = useSettings();
  const protect = useProtect({
    fullscreen: settings.protectFullscreen,
    keyboardLock: settings.protectKeyboardLock,
    closeWarning: settings.protectCloseWarning,
    tamperLog: settings.protectTamperLog,
  });
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const clock = useClock();
  const panelRef = useRef(null);
  const gearRef = useRef(null);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (!showSettings) return;

    function handlePointerDown(e) {
      if (panelRef.current?.contains(e.target) || gearRef.current?.contains(e.target)) return;
      setShowSettings(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setShowSettings(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettings]);

  // While armed, every control routes to the PIN gate instead of acting.
  const guarded = (action) => () => (protect.isArmed ? setShowLock(true) : action());

  const toggle = guarded(() => (isActive ? stop() : start()));
  const openSettings = guarded(() => setShowSettings((v) => !v));
  // Gated too — otherwise a passerby could open this panel and strip the PIN.
  const openProtectPanel = guarded(() => setShowInfo(true));

  const handleProtectClick = () => {
    if (protect.isArmed) setShowLock(true);
    else if (protect.hasPin) protect.arm();
    else setShowInfo(true);
  };

  const titleLines = [settings.titleLine1, settings.titleLine2].filter(Boolean);

  const stageStyle = {
    "--accent": settings.accent,
    "--accent-rgb": hexToRgb(settings.accent),
    "--title-color": settings.titleColor,
    "--subtitle-color": settings.subtitleColor,
    "--session-color": settings.sessionColor,
    "--timer-color": settings.timerColor,
    "--timer-rgb": hexToRgb(settings.timerColor),
    ...(settings.backgroundImage && {
      backgroundImage: `url(${settings.backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }),
  };

  return (
    <div className={`stage ${settings.backgroundImage ? "has-image" : ""}`} style={stageStyle}>
      <div className="grain" />
      <div className="glow" />
      <div className="vignette" />

      <header className="topbar">
        <span className="clock">{clock}</span>
        <span className="pill">
          <span className={`dot ${isActive ? "on" : ""}`} />
          {isActive ? "awake" : "idle"}
        </span>
        <div className="topbar-actions">
          <button
            type="button"
            className={`protect-btn ${protect.isArmed ? "armed" : ""}`}
            onClick={handleProtectClick}
            aria-pressed={protect.isArmed}
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              {protect.isArmed ? (
                <path
                  fill="currentColor"
                  d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"
                />
              ) : (
                <path
                  fill="currentColor"
                  d="M12 2a5 5 0 0 1 5 5h-2a3 3 0 0 0-6 0v3h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5z"
                />
              )}
            </svg>
            Protect mode
          </button>

          <button type="button" className="icon-btn" onClick={openProtectPanel} aria-label="What Protect mode does">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 7zm1.25 10.5h-2.5v-6h2.5v6z"
              />
            </svg>
          </button>

          <button type="button" ref={gearRef} className="icon-btn" onClick={openSettings} aria-label="Customize">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M19.14 12.94a7.14 7.14 0 0 0 .06-.94 7.14 7.14 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.32.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.1.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
            />
            </svg>
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-backdrop">
          <div ref={panelRef}>
            <SettingsPanel settings={settings} onUpdate={update} onReset={reset} onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {showInfo && (
        <ProtectPanel settings={settings} onUpdate={update} protect={protect} onClose={() => setShowInfo(false)} />
      )}

      {showLock && (
        <LockScreen
          onVerify={protect.verifyPin}
          onUnlocked={() => {
            protect.disarm();
            setShowLock(false);
          }}
          onCancel={() => setShowLock(false)}
          onForgot={() => {
            protect.forgotPin();
            setShowLock(false);
          }}
          needsFullscreen={settings.protectFullscreen && !document.fullscreenElement}
          onRestoreFullscreen={protect.restoreFullscreen}
        />
      )}

      {!protect.isArmed && protect.tamperLog.length > 0 && (
        <div className="tamper-banner">
          <strong>
            ⚠️ {protect.tamperLog.length} interruption{protect.tamperLog.length === 1 ? "" : "s"} while you were away
          </strong>
          <ul>
            {protect.tamperLog.slice(-5).map((entry) => (
              <li key={entry.at}>
                {new Date(entry.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} —{" "}
                {TAMPER_LABELS[entry.type] ?? entry.type}
                {entry.count > 1 && ` (×${entry.count})`}
              </li>
            ))}
          </ul>
          <button type="button" className="text-btn full" onClick={protect.clearLog}>
            Dismiss
          </button>
        </div>
      )}

      <main className="hero">
        {isActive && <div className="timer">{formatElapsed(elapsed)}</div>}
        <h1>
          {titleLines.map((line, i) => (
            <span key={`${line}-${i}`}>{line}</span>
          ))}
        </h1>
        <p>{settings.subtitle}</p>
      </main>

      <button type="button" className="dock" onClick={toggle} aria-pressed={isActive}>
        <span className={`bars ${isActive ? "on" : ""}`}>
          <i />
          <i />
          <i />
        </span>
        <span className="dock-text">
          <strong>{settings.sessionName}</strong>
          <em>{isActive ? (mechanism === "fallback" ? "fallback mode" : "keeping screen awake") : "not keeping awake"}</em>
        </span>
        <span className="dock-btn">
          {isActive ? (
            <svg viewBox="0 0 24 24" width="16" height="16">
              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}

export default App;
