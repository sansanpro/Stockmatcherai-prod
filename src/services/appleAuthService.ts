import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a cryptographically random nonce string.
 */
const generateNonce = (length = 32): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map(v => charset[v % charset.length]).join('');
};

/**
 * SHA-256 hashes a string using the Web Crypto API.
 * Apple requires the hashed nonce in the authorization request,
 * while Supabase needs the raw (unhashed) nonce for verification.
 */
const sha256 = async (plain: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Sign in with Apple on native iOS using the Capacitor plugin.
 * Returns the Supabase session on success, throws on failure.
 */
export const signInWithAppleNative = async () => {
  const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

  const rawNonce = generateNonce();
  const hashedNonce = await sha256(rawNonce);

  const result = await SignInWithApple.authorize({
    clientId: 'com.hassanomar.stockmatcherai',
    scopes: 'email name',
    nonce: hashedNonce,
  });

  if (!result?.response?.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: result.response.identityToken,
    nonce: rawNonce,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in with Apple on web via Supabase OAuth redirect.
 */
export const signInWithAppleWeb = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/app`,
    },
  });

  if (error) throw error;
};

/**
 * Unified Apple Sign-In — uses native flow on iOS, web OAuth on web.
 */
export const signInWithApple = async () => {
  if (Capacitor.isNativePlatform()) {
    return signInWithAppleNative();
  }
  return signInWithAppleWeb();
};
