import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, AlertCircle, RefreshCw } from "lucide-react";

interface LiveQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}

export const LiveQRScanner: React.FC<LiveQRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "live-qr-reader-element";

  useEffect(() => {
    let isMounted = true;
    const html5QrCode = new Html5Qrcode(scannerId);
    qrCodeInstanceRef.current = html5QrCode;

    const startScanning = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.75;
              return { width: size, height: size };
            },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (isMounted) {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // Quietly ignore reading frame errors
          }
        );

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error("Error starting camera qr scanner:", err);
        if (isMounted) {
          setError(
            err?.message || 
            "Camera access was denied or could not be initialized. Please check permission settings."
          );
          setIsInitializing(false);
        }
      }
    };

    // Delay initialization slightly to let the DOM element mount completely
    const timer = setTimeout(() => {
      startScanning();
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => {
            try {
              html5QrCode.clear();
            } catch (e) {}
          })
          .catch((e) => console.error("Error stopping qr code scanner on unmount:", e));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="space-y-4">
      <div className="relative border-4 border-dashed border-chicken-red rounded-2xl bg-black overflow-hidden aspect-video w-full flex flex-col items-center justify-center min-h-[220px]">
        {/* The target scanning element */}
        <div id={scannerId} className="w-full h-full absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

        {/* Custom HUD overlays for live feedback */}
        {!error && !isInitializing && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 z-10">
            {/* Corner brackets simulating high-tech lens */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-gold rounded-tl"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-gold rounded-tr"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-gold rounded-bl"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-gold rounded-br"></div>

            {/* Laser scanning line animation */}
            <div className="w-4/5 h-1 bg-gradient-to-r from-transparent via-chicken-red to-transparent shadow-[0_0_10px_#ba0c2f] animate-bounce my-auto" />

            <div className="bg-black/80 px-3 py-1.5 rounded-full border border-gold/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                LIVE SCANNER RUNNING
              </span>
            </div>
          </div>
        )}

        {isInitializing && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-3 text-white z-20">
            <RefreshCw className="w-8 h-8 text-gold animate-spin" />
            <p className="text-xs font-black uppercase tracking-wider text-gold">
              Initializing Camera...
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center gap-3 text-white z-20">
            <AlertCircle className="w-10 h-10 text-chicken-red" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase text-chicken-red">Camera Error</p>
              <p className="text-[10px] text-gray-400 font-semibold max-w-xs leading-normal">
                {error}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-xl border border-gold/30 p-3 text-center">
        <p className="text-[10px] text-gray-700 font-semibold uppercase leading-normal">
          Point your device camera at the Pass QR code shown on the client screen. Hold it steady to capture.
        </p>
      </div>
    </div>
  );
};
