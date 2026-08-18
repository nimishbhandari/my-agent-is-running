import { useCallback, useEffect, useRef, useState } from "react";

const isWakeLockSupported = typeof navigator !== "undefined" && "wakeLock" in navigator;

function createFallbackVideoLock() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const stream = canvas.captureStream(1);

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.style.position = "fixed";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  video.srcObject = stream;
  document.body.appendChild(video);

  return {
    play: () => video.play().catch(() => {}),
    stop: () => {
      video.pause();
      for (const track of stream.getTracks()) track.stop();
      video.remove();
    },
  };
}

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const [mechanism, setMechanism] = useState(null);
  const wantActiveRef = useRef(false);
  const sentinelRef = useRef(null);
  const fallbackRef = useRef(null);

  const start = useCallback(async () => {
    wantActiveRef.current = true;

    if (isWakeLockSupported) {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        sentinelRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          setIsActive(false);
          sentinelRef.current = null;
        });
        setIsActive(true);
        setMechanism("wakelock");
        return;
      } catch {
        // fall through to fallback
      }
    }

    fallbackRef.current = createFallbackVideoLock();
    fallbackRef.current.play();
    setIsActive(true);
    setMechanism("fallback");
  }, []);

  const stop = useCallback(async () => {
    wantActiveRef.current = false;

    if (sentinelRef.current) {
      await sentinelRef.current.release();
      sentinelRef.current = null;
    }
    if (fallbackRef.current) {
      fallbackRef.current.stop();
      fallbackRef.current = null;
    }
    setIsActive(false);
    setMechanism(null);
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && wantActiveRef.current && !sentinelRef.current && isWakeLockSupported) {
        start();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [start]);

  useEffect(
    () => () => {
      sentinelRef.current?.release();
      fallbackRef.current?.stop();
    },
    [],
  );

  return { isActive, mechanism, isSupported: isWakeLockSupported, start, stop };
}
