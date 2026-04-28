export function getPublicConfig() {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
  const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

  return {
    API_BASE_URL,
    API_KEY,
    isConfigured: Boolean(API_BASE_URL && API_KEY),
  };
}

