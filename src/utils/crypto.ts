import CryptoJS from 'crypto-js';

export function decrypt(encryptString: string): string {
  try {
    const key = CryptoJS.enc.Utf8.parse('Y0rkn0v3lty!@#$%');
    const iv = CryptoJS.lib.WordArray.create([0x00, 0x00, 0x00, 0x00]);
    const decrypted = CryptoJS.AES.decrypt(encryptString, key, { iv: iv });

    return decrypted.toString(CryptoJS.enc.Utf8) || encryptString; // Fallback to original if empty (often happens with wrong key/padding)
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptString;
  }
}
