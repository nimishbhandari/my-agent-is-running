import { useEffect, useRef, useState } from "react";
import { useWakeLock } from "./useWakeLock.js";
import { useSettings } from "./useSettings.js";
import { hexToRgb } from "./imageUtils.js";
import SettingsPanel from "./SettingsPanel.jsx";
import "./App.css";

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
  const { isActive, mechanism, start, stop } = useWakeLock();
  const { settings, update, reset } = useSettings();
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const clock = useClock();
  const panelRef = useRef(null);
  const gearRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

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

  const toggle = () => (isActive ? stop() : start());
  const titleLines = [settings.titleLine1, settings.titleLine2].filter(Boolean);

  const stageStyle = {
    "--accent": settings.accent,
    "--accent-rgb": hexToRgb(settings.accent),
    "--title-color": settings.titleColor,
    "--subtitle-color": settings.subtitleColor,
    "--session-color": settings.sessionColor,
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
        <button
          type="button"
          ref={gearRef}
          className="icon-btn"
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Customize"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M19.14 12.94a7.14 7.14 0 0 0 .06-.94 7.14 7.14 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.62-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.32.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.1.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
            />
          </svg>
        </button>
      </header>

      {showSettings && (
        <div className="settings-backdrop">
          <div ref={panelRef}>
            <SettingsPanel settings={settings} onUpdate={update} onReset={reset} onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      <main className="hero">
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
          <em>{isActive ? `${formatElapsed(elapsed)}${mechanism === "fallback" ? " · fallback" : ""}` : "not keeping awake"}</em>
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
