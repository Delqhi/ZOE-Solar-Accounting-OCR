import type { Email, Money } from '../types/branded';

export class ValidationService {
  static sanitizeHTML(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  static validateIBAN(iban: string): boolean {
    const cleaned = iban.replace(/\s/g, '');
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(cleaned)) {
      return false;
    }

    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    const numeric = rearranged
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : char;
      })
      .join('');

    let remainder = 0;
    for (let i = 0; i < numeric.length; i += 7) {
      const chunk = remainder + numeric.slice(i, i + 7);
      remainder = parseInt(chunk, 10) % 97;
    }

    return remainder === 1;
  }

  static validateEmail(email: Email): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validateMoney(amount: Money): boolean {
    return amount >= 0 && amount <= 1000000 && Number.isFinite(amount);
  }

  static validateSteuernummer(steuernummer: string): boolean {
    return /^\d{11,13}$/.test(steuernummer.replace(/\s/g, ''));
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
}
