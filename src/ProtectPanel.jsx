import { useEffect, useRef, useState } from "react";
import { isKeyboardLockSupported } from "./useProtect.js";

const TOGGLES = [
  { key: "protectFullscreen", label: "Go fullscreen when armed" },
  { key: "protectKeyboardLock", label: "Make Esc need a hold" },
  { key: "protectCloseWarning", label: "Warn before closing the tab" },
  { key: "protectTamperLog", label: "Log if someone touches it" },
];

const CAN = [
  "Locks the stop button and settings behind your PIN",
  "Goes fullscreen so it doesn't look like a closeable tab",
  isKeyboardLockSupported
    ? "Makes Esc need a long hold instead of a tap"
    : "Esc-hold protection (Chrome/Edge only — not this browser)",
  "Warns before the tab gets closed",
  "Logs when someone touches the keyboard or mouse, or switches away",
];

const CANNOT = [
  "Stop Cmd+Tab, Cmd+Q, or someone closing the lid",
  "Stop a force-quit of the browser",
  "Replace your OS lock screen — though that hides this poster, which is the whole trade-off",
];

function ProtectPanel({ settings, onUpdate, protect, onClose }) {
  const cardRef = useRef(null);
  const [pinDraft, setPinDraft] = useState("");
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    function handlePointerDown(e) {
      if (!cardRef.current?.contains(e.target)) onClose();
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const savePin = async () => {
    if (pinDraft.length !== 4) return;
    await protect.setPin(pinDraft);
    setPinDraft("");
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 1500);
  };

  return (
    <div className="settings-backdrop">
      <div className="settings info-modal" ref={cardRef}>
        <div className="settings-header">
          <span>Protect mode</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="field-label">{protect.hasPin ? "Change PIN" : "Set a PIN"}</div>
        <div className="pin-row">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pinDraft}
            onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ""))}
          />
          <button type="button" className="text-btn" onClick={savePin} disabled={pinDraft.length !== 4}>
            {pinSaved ? "Saved" : "Save"}
          </button>
        </div>
        {protect.hasPin && (
          <button type="button" className="text-btn full" onClick={protect.clearPin}>
            Remove PIN
          </button>
        )}

        <div className="field-label">Behaviors</div>
        {TOGGLES.map(({ key, label }) => {
          const unsupported = key === "protectKeyboardLock" && !isKeyboardLockSupported;
          return (
            <label key={key} className={`toggle-row ${unsupported ? "unsupported" : ""}`}>
              <input
                type="checkbox"
                checked={Boolean(settings[key]) && !unsupported}
                disabled={unsupported}
                onChange={(e) => onUpdate({ [key]: e.target.checked })}
              />
              {label}
              {unsupported && <em>Chrome/Edge only</em>}
            </label>
          );
        })}

        <div className="field-label">What it does</div>
        <ul className="info-list can">
          {CAN.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="field-label">What it can&apos;t do</div>
        <ul className="info-list cannot">
          {CANNOT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="info-note">
          It&apos;s a deterrent and a witness — not real security. A web page can&apos;t lock a laptop, so don&apos;t
          leave anything sensitive open trusting it. Forgot the PIN? Clearing this site&apos;s data resets it.
        </p>
      </div>
    </div>
  );
}

export default ProtectPanel;
