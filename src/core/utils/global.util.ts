import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID
 * @returns {string} UUID
 * @example
 * generateUUID();
 * // => 'f8b4e8e0-5b6f-4b0e-8e1c-8c8c8c8c8c8c'
 */
export const generateUUID = () => {
  return uuidv4();
};
