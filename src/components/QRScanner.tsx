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
    const [devices, setDevices] = useState<any[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerId = "reader";

    useEffect(() => {
        // Initial setup
        initScanner();

        return () => {
            cleanup();
        };
    }, []);

    const cleanup = () => {
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

    const initScanner = async () => {
        setLoading(true);
        setPermissionError(false);

        // Ensure container is 'visible' for library measurement, creating the instance early
        setIsScanning(true);
        await new Promise(r => setTimeout(r, 100));

        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(readerId);
            }

            const cameras = await Html5Qrcode.getCameras().catch(err => {
                throw new Error("Could not access camera device. " + err);
            });

            if (cameras && cameras.length > 0) {
                setDevices(cameras);
                // Default to back camera
                const backCamera = cameras.find(d => d.label.toLowerCase().includes('back'));
                const startId = backCamera ? backCamera.id : cameras[0].id;

                await startCamera(startId);
            } else {
                throw new Error("No camera devices found.");
            }
        } catch (err: any) {
            console.error("Init Error", err);
            setPermissionError(true);
            setErrorMessage(err?.message || err?.toString() || "Unknown error");
            setLoading(false);
            setIsScanning(false);
        }
    };

    const startCamera = async (cameraId: string) => {
        if (!scannerRef.current) return;

        setLoading(true);
        setActiveDeviceId(cameraId);

        try {
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
            setIsScanning(true);
        } catch (err: any) {
            console.error("Start Error", err);
            setPermissionError(true);
            setErrorMessage(err?.message || "Failed to start camera");
            setLoading(false);
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

    const switchCamera = async () => {
        if (devices.length < 2 || !activeDeviceId || !scannerRef.current) return;

        const currentIdx = devices.findIndex(d => d.id === activeDeviceId);
        const nextIdx = (currentIdx + 1) % devices.length;
        const nextId = devices[nextIdx].id;

        setLoading(true);
        try {
            await scannerRef.current.stop();
            await startCamera(nextId);
        } catch (err) {
            console.error("Switch Error", err);
            // If switch fails, try to just restart whatever we have or show error
            setLoading(false);
        }
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
                        <button onClick={initScanner} className="btn-secondary">
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
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(2px)'
                    }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                            {activeDeviceId ? 'Starting Camera...' : 'Initializing...'}
                        </div>
                    </div>
                )}

                {/* Scanner Div */}
                <div
                    id={readerId}
                    style={{
                        width: '100%',
                        minHeight: '300px',
                        display: isScanning && !permissionError ? 'block' : 'none'
                    }}
                ></div>

                {/* Controls Overlay */}
                {isScanning && !loading && !permissionError && (
                    <>
                        <div className="scan-line"></div>

                        {/* Switch Camera Button - Top Right */}
                        {devices.length > 1 && (
                            <button
                                onClick={switchCamera}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 20
                                }}
                                title="Switch Camera"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 10c0-6-8-6-8-6s-8 0-8 6h16z"></path>
                                    <path d="M4 14c0 6 8 6 8 6s8 0 8-6H4z"></path>
                                    <path d="M12 12v.01"></path>
                                </svg>
                            </button>
                        )}

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
