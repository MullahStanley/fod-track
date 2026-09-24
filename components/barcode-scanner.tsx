"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Spinner } from "./ui";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose?: () => void;
}

// Short cheerful audio beep feedback on scan
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // AudioContext not allowed or not supported - ignore
  }
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStarting, setIsStarting] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isFileScanning, setIsFileScanning] = useState(false);

  // Supported barcode formats for food retail
  const formatsToSupport = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.QR_CODE,
  ];

  const handleSuccess = (decodedText: string) => {
    // Only accept numeric or clean barcode text
    const clean = decodedText.trim();
    if (!clean) return;

    playBeep();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(150);
    }

    // Stop scanner cleanly before emitting
    stopScanner().then(() => {
      onDetected(clean);
    });
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("[BarcodeScanner] Error stopping scanner:", err);
      }
      setIsRunning(false);
    }
  };

  const startScanner = async (cameraIdOrConfig: string | { facingMode: string }) => {
    setIsStarting(true);
    setErrorMessage(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId.current, {
          formatsToSupport,
          verbose: false,
        });
      } else if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        cameraIdOrConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const width = Math.floor(minEdge * 0.85);
            const height = Math.floor(minEdge * 0.55); // Rectangular barcode format
            return { width, height };
          },
          aspectRatio: 1.333333,
        },
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {
          // Frame failed to detect barcode, normal during scanning
        }
      );

      setIsRunning(true);
      setIsStarting(false);

      // Check for torch capability
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = (scannerRef.current as any).getRunningTrackCameraCapabilities?.();
        if (capabilities && capabilities.torchFeature?.().isSupported()) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      console.error("[BarcodeScanner] Start failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowedError")) {
        setErrorMessage("Camera permission denied. Allow camera access or upload a photo below.");
      } else if (msg.includes("NotFoundError") || msg.includes("Requested device not found")) {
        setErrorMessage("No camera found on this device. You can still upload a barcode photo.");
      } else {
        setErrorMessage("Could not initialize camera. Please try photo upload or enter the code manually.");
      }
      setIsStarting(false);
      setIsRunning(false);
    }
  };

  // Initialize and list cameras
  useEffect(() => {
    let mounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera
          const backIndex = devices.findIndex((d) =>
            /back|rear|environment/i.test(d.label)
          );
          const initialIndex = backIndex >= 0 ? backIndex : 0;
          setCurrentCameraIndex(initialIndex);
          void startScanner(devices[initialIndex].id);
        } else {
          // Fallback to facingMode constraint
          void startScanner({ facingMode: "environment" });
        }
      })
      .catch(() => {
        if (!mounted) return;
        // Fallback to facingMode
        void startScanner({ facingMode: "environment" });
      });

    return () => {
      mounted = false;
      void stopScanner();
    };
  }, []);

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    void startScanner(cameras[nextIndex].id);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch toggle failed:", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileScanning(true);
    setErrorMessage(null);

    try {
      // Pause or stop camera if running
      await stopScanner();

      const html5QrCode = new Html5Qrcode(containerId.current, {
        formatsToSupport,
        verbose: false,
      });

      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      setIsFileScanning(false);
      handleSuccess(decodedText);
    } catch (err) {
      setIsFileScanning(false);
      setErrorMessage(
        "Could not read a barcode in that photo. Make sure the barcode is clear, flat, and well-lit."
      );
      // Restart camera scanner
      if (cameras.length > 0) {
        void startScanner(cameras[currentCameraIndex].id);
      } else {
        void startScanner({ facingMode: "environment" });
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
      {/* Top control bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isRunning ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isRunning ? "bg-emerald-500" : "bg-amber-500"}`} />
          </span>
          <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
            {isRunning ? "Live Scanner" : "Camera Initializing"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                torchOn ? "bg-amber-400 text-slate-950 font-bold" : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
              title="Toggle flashlight"
            >
              {torchOn ? "🔦 On" : "🔦 Flash"}
            </button>
          )}

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={switchCamera}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/20"
              title="Switch camera"
            >
              🔄 Flip
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={() => {
                void stopScanner();
                onClose();
              }}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Viewfinder container */}
      <div className="relative aspect-[4/3] w-full bg-black/60 flex items-center justify-center overflow-hidden">
        {/* html5-qrcode target div */}
        <div id={containerId.current} className="w-full h-full" />

        {/* Viewfinder Reticle Overlay */}
        {isRunning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Guide box */}
            <div className="relative h-44 w-72 rounded-xl border border-white/20 bg-emerald-500/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 h-5 w-5 rounded-tl-lg border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-tr-lg border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-emerald-400" />

              {/* Animated laser beam line */}
              <div className="absolute inset-x-2 top-0 h-0.5 animate-[scanBeam_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399]" />

              <div className="absolute bottom-2 inset-x-0 text-center">
                <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-300 backdrop-blur-sm">
                  Align barcode inside frame
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 backdrop-blur-sm">
            <Spinner className="h-6 w-6 border-emerald-400" />
            <p className="text-xs text-slate-300">Opening camera…</p>
          </div>
        )}

        {/* Photo file processing state */}
        {isFileScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 backdrop-blur-sm">
            <Spinner className="h-6 w-6 border-emerald-400" />
            <p className="text-xs text-slate-300">Reading barcode from image…</p>
          </div>
        )}
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="border-t border-red-500/20 bg-red-950/30 px-4 py-2.5 text-xs text-red-300">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Bottom actions: Photo upload & camera reload */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/[0.02] p-3 text-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
        >
          🖼️ Scan from photo / gallery
        </button>

        {!isRunning && !isStarting && (
          <button
            type="button"
            onClick={() => startScanner({ facingMode: "environment" })}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 font-medium text-emerald-300 hover:bg-emerald-500/30"
          >
            🔄 Restart camera
          </button>
        )}
      </div>
    </div>
  );
}
