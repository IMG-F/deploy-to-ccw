import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';

export function encryptSb3(inputBuffer, t) {
    const bytes = Array.from(inputBuffer);

    const plainText = bytes.join(',');

    const n = CryptoJS.enc.Base64.parse('KzdnFCBRvq3' + t);
    n.sigBytes = 32;

    const r = n.clone();
    r.sigBytes = 16;
    r.words.splice(4);

    const encrypted = CryptoJS.AES.encrypt(plainText, n, {
        iv: r,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return Buffer.from(encrypted.toString());
}