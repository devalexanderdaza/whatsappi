import { v4 as uuidv4 } from 'uuid';

import getUuid from 'uuid-by-string';

/**
 * Generate a UUID
 * @returns {string} UUID
 * @example
 * generateUUID();
 * // => 'f8b4e8e0-5b6f-4b0e-8e1c-8c8c8c8c8c8c'
 */
export const generateUUID = (): string => {
  return uuidv4();
};

// Generate a UUID from a string
// @param {string} str
// @returns {string} UUID
// @example
// generateUUIDFromString('test');
// // => 'f8b4e8e0-5b6f-4b0e-8e1c-8c8c8c8c8c8c'
export const generateUUIDFromString = (str: string): string => {
  return getUuid(str);
};

/**
 * Check if a string is a valid UUID
 * @param {string} uuid
 * @returns {boolean} true if valid, false if not
 * @example
 * isUUID('f8b4e8e0-5b6f-4b0e-8e1c-8c8c8c8c8c8c');
 * // => true
 */
export const isUUID = (uuid: string): boolean => {
  const pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return pattern.test(uuid);
};

/**
 * Check if a string is a valid URL
 * @param {string} url
 * @returns {boolean} true if valid, false if not
 * @example
 * isURL('https://google.com');
 * // => true
 * isURL('google.com');
 * // => false
 * isURL('google');
 * // => false
 */
export const isURL = (url: string): boolean => {
  const pattern =
    /^((http|https):\/\/)(www\.)?([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)([a-zA-Z0-9\-\._\?\,\'\/\\\+&%\$#\=~])*$/;
  return pattern.test(url);
};
