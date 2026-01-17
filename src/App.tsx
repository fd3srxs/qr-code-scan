import { useState } from 'react';
import QRScanner from './components/QRScanner';
import { decrypt } from './utils/crypto';

function App() {
  const [result, setResult] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleScan = (decodedText: string) => {
    setRawResult(decodedText);
    const decryptedText = decrypt(decodedText);
    setResult(decryptedText);

    // Logic to extract ID and generate image URL
    // Expected format: "81749,PQM250375" -> ID: "81749"
    try {
      if (decryptedText && decryptedText.includes(',')) {
        const parts = decryptedText.split(',');
        const id = parts[0].trim();
        if (id) {
          setImageUrl(`https://yorkapi.blob.core.windows.net/yorkimages/${id}.jpg`);
        }
      } else {
        // Fallback if no comma found, maybe the whole string is the ID? 
        // For now, let's be strict or lenient. Let's try to use the whole text if it looks like an ID, 
        // but the user spec said "get the first part of the string" implying a split.
        // If simpler format, assume the whole decrypted string might be the ID if it's short/numeric?
        // User example "81749,PQM250375" is specific. I'll stick to split logic but maybe fallback if not found?
        // Actually, let's just use the first part split by comma.
        const cleanId = decryptedText.split(',')[0].trim();
        if (cleanId) {
          setImageUrl(`https://yorkapi.blob.core.windows.net/yorkimages/${cleanId}.jpg`);
        }
      }
    } catch (e) {
      console.error("Error parsing ID for image", e);
    }
  };

  const handleReset = () => {
    setResult(null);
    setRawResult(null);
    setImageUrl(null);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '100%', width: '100%' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1>QR Decryptor</h1>
        <p className="subtitle">Securely scan and decrypt QR codes</p>
      </header>

      <main>
        {!result ? (
          <QRScanner onScanSuccess={handleScan} />
        ) : (
          <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--success)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Scan Complete</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Successfully decrypted</span>
              </div>
            </div>

            {/* Image Display */}
            {imageUrl && (
              <div style={{
                marginBottom: '24px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
              }}>
                <img
                  src={imageUrl}
                  alt="Scanned Item"
                  style={{ maxWidth: '100%', maxHeight: '400px', display: 'block', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    // Optional: show error placeholder or text
                  }}
                />
              </div>
            )}

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '24px',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}>
                Decrypted Content
              </div>
              <div style={{
                fontSize: '1.2rem',
                wordBreak: 'break-word',
                lineHeight: '1.6',
                fontFamily: 'monospace'
              }}>{result}</div>

              {rawResult !== result && (
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Raw: {rawResult}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleReset} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', display: 'flex' }}>
                Scan Again
              </button>
              <button onClick={copyToClipboard} className="btn-primary" style={{ flex: 1 }}>
                Copy Text
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
