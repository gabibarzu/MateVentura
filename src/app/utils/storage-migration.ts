/** Prefix of every localStorage key the app uses. */
export const STORAGE_PREFIX = 'mateventura:';

/** Prefix used before the app was renamed from "Mate-Aventura" to "MateVentura". */
const OLD_STORAGE_PREFIX = 'mate-aventura:';

/**
 * Moves data saved under the old app name to the new keys (scores, player name, sound setting),
 * so nothing is lost after the rename. Safe to run on every start: it only acts while old keys exist.
 */
export function migrateStorageKeys(): void {
  try {
    const oldKeys = Object.keys(localStorage).filter((key) => key.startsWith(OLD_STORAGE_PREFIX));
    for (const oldKey of oldKeys) {
      const newKey = STORAGE_PREFIX + oldKey.slice(OLD_STORAGE_PREFIX.length);
      const value = localStorage.getItem(oldKey);
      if (value !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, value);
      }
      localStorage.removeItem(oldKey);
    }
  } catch {
    // Storage may be unavailable (e.g. private mode): nothing to migrate.
  }
}
