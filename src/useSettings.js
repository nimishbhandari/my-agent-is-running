import { useCallback, useEffect, useState } from "react";
import defaultBackground from "./assets/onefour.png";

const STORAGE_KEY = "keep-awake-settings";

export const defaultSettings = {
  titleLine1: "Agent is",
  titleLine2: "running",
  subtitle: "Please don't touch this laptop.",
  sessionName: "Coding session",
  accent: "#ff8d46",
  backgroundImage: defaultBackground,
  titleColor: "#f5f2ec",
  subtitleColor: "#a39dbd",
  sessionColor: "#f5f2ec",
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // storage full or unavailable; customization just won't persist
    }
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(defaultSettings), []);

  return { settings, update, reset };
}
