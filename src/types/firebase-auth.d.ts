import type { Persistence } from 'firebase/auth';

/**
 * `firebase/auth` resolves to its React Native build under Metro, but the published
 * typings only describe the web entry point. Augment the module with the RN-only
 * export so the AsyncStorage-backed persistence is type-safe.
 */
declare module 'firebase/auth' {
  export interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
