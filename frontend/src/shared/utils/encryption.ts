/**
 * Simple data encryption and decryption utility
 * 
 * Note: This encryption method is for basic protection only and not suitable for high security requirements
 * In production environments, server-side storage of API keys or more secure encryption schemes should be used
 */

// Encryption key - in real applications, this should be managed via environment variables or more secure methods
const ENCRYPTION_KEY = 'PremiaLab_Secure_Key_2023';

/**
 * Encrypt data
 * @param data String to be encrypted
 * @returns Encrypted string
 */
export const encryptData = (data: string): string => {
  if (!data) return '';
  
  try {
    // Simple XOR encryption
    const encrypted = Array.from(data).map((char, i) => {
      const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    
    // Convert to base64 for safe storage
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
};

/**
 * Decrypt data
 * @param encryptedData Encrypted string
 * @returns Decrypted original string
 */
export const decryptData = (encryptedData: string): string => {
  if (!encryptedData) return '';
  
  try {
    // Decode from base64
    const decoded = atob(encryptedData);
    
    // Use the same XOR algorithm for decryption
    const decrypted = Array.from(decoded).map((char, i) => {
      const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}; 