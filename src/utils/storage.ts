import { CharacterFormData } from "../contexts/CharacterWizardContext";

// Define a version for the storage schema. Increment this when the structure changes.
const STORAGE_VERSION = 1;
const VERSION_KEY = "storageVersion";
const CHARACTER_SHEET_PREFIX_KEY = "characterSheet_"; // Reuse from types if defined elsewhere

/**
 * Checks the stored version and performs migrations if necessary.
 * Currently, this is a placeholder and does not perform actual migrations.
 */
const checkAndMigrateStorage = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const currentVersion = parseInt(storedVersion || "0", 10);

  if (currentVersion < STORAGE_VERSION) {
    console.log(`Storage version mismatch. Found ${currentVersion}, expected ${STORAGE_VERSION}. Migrating...`);
    // --- Migration Logic --- 
    // Example: If migrating from version 0 to 1
    // if (currentVersion === 0) {
    //   // Perform migration steps for v0 to v1
    //   // e.g., rename keys, transform data structures
    //   console.log("Migrating storage from v0 to v1...");
    //   // Example: Iterate through all character sheets and update structure
    //   Object.keys(localStorage).forEach(key => {
    //      if (key.startsWith(CHARACTER_SHEET_PREFIX_KEY)) {
    //          try {
    //              let charData = JSON.parse(localStorage.getItem(key)!);
    //              // Modify charData according to v1 schema
    //              // charData.newField = defaultValue;
    //              // delete charData.oldField;
    //              localStorage.setItem(key, JSON.stringify(charData));
    //          } catch (e) {
    //              console.error(`Failed to migrate character ${key}:`, e);
    //          }
    //      }
    //   });
    // }
    
    // Add more migration steps for other version increments here
    // if (currentVersion < 2) { ... }

    // After all migrations for the current version are done:
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION.toString());
    console.log(`Storage migration to v${STORAGE_VERSION} complete.`);
  } else if (currentVersion > STORAGE_VERSION) {
    console.warn(`Stored data version (${currentVersion}) is newer than application version (${STORAGE_VERSION}). Data might be incompatible.`);
  } else {
    // console.log(`Storage version (${STORAGE_VERSION}) is up to date.`);
  }
};

// Run migration check on module load
checkAndMigrateStorage();

/**
 * Saves character data to localStorage.
 * @param characterId - The ID of the character.
 * @param data - The character data to save.
 */
export const saveCharacterToStorage = (characterId: string, data: CharacterFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const key = `${CHARACTER_SHEET_PREFIX_KEY}${characterId}`;
      localStorage.setItem(key, JSON.stringify(data));
      // Update last modified in summary list as well (logic might be elsewhere)
      resolve();
    } catch (error) {
      console.error("Failed to save character to localStorage:", error);
      reject(error);
    }
  });
};

/**
 * Loads character data from localStorage.
 * @param characterId - The ID of the character to load.
 * @returns The loaded character data or null if not found or error occurs.
 */
export const loadCharacterFromStorage = (characterId: string): Promise<CharacterFormData | null> => {
  return new Promise((resolve) => {
    try {
      const key = `${CHARACTER_SHEET_PREFIX_KEY}${characterId}`;
      const dataString = localStorage.getItem(key);
      if (dataString) {
        const data = JSON.parse(dataString);
        // TODO: Add validation (e.g., using Zod) before returning?
        resolve(data as CharacterFormData);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error("Failed to load character from localStorage:", error);
      resolve(null); // Return null on error
    }
  });
};

/**
 * Deletes a character from localStorage.
 * @param characterId - The ID of the character to delete.
 */
export const deleteCharacterFromStorage = (characterId: string): Promise<void> => {
   return new Promise((resolve) => {
     try {
       const key = `${CHARACTER_SHEET_PREFIX_KEY}${characterId}`;
       localStorage.removeItem(key);
       // Remove from summary list as well (logic might be elsewhere)
       resolve();
     } catch (error) {
       console.error("Failed to delete character from localStorage:", error);
       // Decide if deletion failure should reject the promise
       resolve(); // Resolve anyway for now
     }
   });
};

/**
 * Loads the list of character summaries from localStorage.
 */
export const loadCharacterListFromStorage = (): Promise<any[]> => { // Replace 'any' with CharacterSummary type
    return new Promise((resolve) => {
        try {
            const listKey = "characterGalleryList"; // Reuse from types if defined elsewhere
            const listString = localStorage.getItem(listKey);
            resolve(listString ? JSON.parse(listString) : []);
        } catch (error) {
            console.error("Failed to load character list:", error);
            resolve([]);
        }
    });
};

/**
 * Saves the list of character summaries to localStorage.
 */
export const saveCharacterListToStorage = (list: any[]): Promise<void> => { // Replace 'any' with CharacterSummary type
    return new Promise((resolve, reject) => {
        try {
            const listKey = "characterGalleryList"; // Reuse from types if defined elsewhere
            localStorage.setItem(listKey, JSON.stringify(list));
            resolve();
        } catch (error) {
            console.error("Failed to save character list:", error);
            reject(error);
        }
    });
};

// Note: Dexie implementation would be more complex, involving database setup, schemas, and async operations.
// This localStorage version provides the basic requested abstraction.

