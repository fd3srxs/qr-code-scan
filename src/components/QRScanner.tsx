import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (error: any) => void;
}

const QRScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerId = "reader";

    useEffect(() => {
        // Auto-start the scanner when component mounts
        startScanning();

        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch(console.error);
                    }
                    scannerRef.current.clear();
                } catch (e) {
                    console.error("Cleanup error", e);
                }
            }
        };
    }, []);

    const startScanning = async () => {
        setLoading(true);
        setPermissionError(false);
        setErrorMessage("");
        // CRITICAL: We must render the div and make it visible BEFORE initializing the library
        // The library needs to measure the element dimensions.
        setIsScanning(true);

        // A small delay to ensure React has flushed the DOM update and the div is visible
        await new Promise(r => setTimeout(r, 100));

        try {
            // Must look for cameras
            const devices = await Html5Qrcode.getCameras().catch(err => {
                throw new Error("Could not access camera device. " + err);
            });

            if (devices && devices.length) {
                // Use back camera by default
                const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;

                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(readerId);
                }

                await scannerRef.current.start(
                    cameraId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        handleStop();
                        onScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        if (onScanError) onScanError(errorMessage);
                    }
                );
                setLoading(false);
            } else {
                throw new Error("No camera devices found.");
            }
        } catch (err: any) {
            console.error("Error starting scanner", err);
            setPermissionError(true);
            setErrorMessage(err?.message || err?.toString() || "Unknown error");
            handleStop();
        }
    };

    const handleStop = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
        setIsScanning(false);
        setLoading(false);
    };

    return (
        <div className="scanner-wrapper animate-fade-in">
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', position: 'relative', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {/* Permission Error State */}
                {permissionError && (
                    <div style={{ padding: '40px 20px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
                        <p style={{ color: 'var(--error)', marginBottom: '8px', fontWeight: 'bold' }}>
                            Camera Error
                        </p>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.85rem', wordBreak: 'break-word' }}>
                            {errorMessage}
                        </p>
                        <button onClick={startScanning} className="btn-secondary">
                            Retry Camera
                        </button>
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && !permissionError && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10,
                    }}>
                        <div style={{ color: 'var(--text-secondary)' }}>Initialize Camera...</div>
                    </div>
                )}

                {/* 
            The div where the scanner plays. 
            CRITICAL: 'display' must NOT be none when start() is called.
            We use the isScanning state to toggle it, but startScanning() sets isScanning=true first.
        */}
                <div
                    id={readerId}
                    style={{
                        width: '100%',
                        minHeight: '300px',
                        // We keep it 'block' if we intend to scan (isScanning=true)
                        // If permission error happens, we hide it to show error message cleanly on top? 
                        // We can hide it or keep it.
                        display: isScanning && !permissionError ? 'block' : 'none'
                    }}
                ></div>

                {isScanning && !loading && !permissionError && (
                    <>
                        <div className="scan-line"></div>
                        <button
                            onClick={handleStop}
                            className="btn-secondary"
                            style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 20,
                                border: 'none',
                                color: 'white'
                            }}
                        >
                            Stop Scanning
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
