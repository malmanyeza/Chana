import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('WARNING: Supabase environment variables are missing! Falling back to placeholder keys to prevent startup crash.');
}

// Web storage adapter (uses standard browser localStorage)
const WebStorageAdapter = {
  getItem: (key: string) => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// SecureStore has a hard 2048-byte limit per key.
// Supabase sessions easily exceed this (JWT + refresh token + user metadata).
// This chunking adapter splits large values across multiple keys transparently.
const CHUNK_SIZE = 1900; 

const ChunkedSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const chunkCount = await SecureStore.getItemAsync(`${key}_chunk_count`);
      if (chunkCount !== null) {
        const count = parseInt(chunkCount, 10);
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk === null) return null;
          chunks.push(chunk);
        }
        return chunks.join('');
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        await _deleteChunks(key);
        await SecureStore.setItemAsync(key, value);
      } else {
        await SecureStore.deleteItemAsync(key);
        const chunks: string[] = [];
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
          chunks.push(value.slice(i, i + CHUNK_SIZE));
        }
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
        }
        await SecureStore.setItemAsync(`${key}_chunk_count`, String(chunks.length));
      }
    } catch (e) {
      console.error('SecureStore error:', e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    await _deleteChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};

async function _deleteChunks(key: string): Promise<void> {
  const chunkCount = await SecureStore.getItemAsync(`${key}_chunk_count`);
  if (chunkCount !== null) {
    const count = parseInt(chunkCount, 10);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}_chunk_count`);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? WebStorageAdapter : ChunkedSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
