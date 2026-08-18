import { useCallback, useEffect, useState } from "react";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

function LockScreen({ onVerify, onUnlocked, onCancel, onForgot, needsFullscreen, onRestoreFullscreen }) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const submit = useCallback(
    async (pin) => {
      setChecking(true);
      const ok = await onVerify(pin);
      setChecking(false);
      if (ok) {
        onUnlocked();
        return;
      }
      setError(true);
      setDigits("");
      setTimeout(() => setError(false), 600);
    },
    [onVerify, onUnlocked],
  );

  const push = useCallback(
    (key) => {
      if (checking) return;
      if (key === "⌫") {
        setDigits((d) => d.slice(0, -1));
        return;
      }
      setDigits((d) => (d.length >= PIN_LENGTH ? d : d + key));
    },
    [checking],
  );

  // Submit from an effect rather than inside the state updater — updaters must
  // stay pure, and StrictMode double-invokes them (which double-logged attempts).
  useEffect(() => {
    if (digits.length === PIN_LENGTH && !checking) submit(digits);
  }, [digits, checking, submit]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (/^[0-9]$/.test(e.key)) push(e.key);
      else if (e.key === "Backspace") push("⌫");
      else if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [push, onCancel]);

  return (
    <div className="lock-screen">
      <div className={`lock-card ${error ? "shake" : ""}`}>
        <svg viewBox="0 0 24 24" width="26" height="26" className="lock-glyph">
          <path
            fill="currentColor"
            d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"
          />
        </svg>

        <div className="lock-title">{error ? "Wrong PIN" : "Enter PIN to unlock"}</div>

        <div className="pin-dots">
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span key={i} className={`pin-dot ${i < digits.length ? "filled" : ""}`} />
          ))}
        </div>

        <div className="keypad">
          {KEYS.map((key, i) =>
            key === "" ? (
              <span key={i} />
            ) : (
              <button key={i} type="button" className="key" onClick={() => push(key)}>
                {key}
              </button>
            ),
          )}
        </div>

        {needsFullscreen && !confirmingReset && (
          <button type="button" className="text-btn full" onClick={onRestoreFullscreen}>
            Restore fullscreen
          </button>
        )}

        {confirmingReset ? (
          <div className="lock-reset">
            <p>Clear the PIN and unlock? This gets recorded in the activity log.</p>
            <div className="lock-reset-actions">
              <button type="button" className="text-btn" onClick={() => setConfirmingReset(false)}>
                Cancel
              </button>
              <button type="button" className="text-btn danger" onClick={onForgot}>
                Reset PIN
              </button>
            </div>
          </div>
        ) : (
          <div className="lock-links">
            <button type="button" className="lock-cancel" onClick={() => setConfirmingReset(true)}>
              Forgot PIN?
            </button>
            <button type="button" className="lock-cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LockScreen;
