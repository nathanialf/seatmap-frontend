/**
 * Runtime configuration helper for API routes
 * Creates config object directly from environment variables without module evaluation
 */

interface Config {
  apiBaseUrl: string;
  apiKey: string;
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export function createConfig(): Config {
  const apiBaseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const environment = process.env.ENVIRONMENT || 'dev';
  
  if (!apiBaseUrl) {
    throw new Error('Missing required environment variable: API_BASE_URL');
  }
  if (!apiKey) {
    throw new Error('Missing required environment variable: API_KEY');
  }
  
  // Validate API base URL format
  try {
    new URL(apiBaseUrl);
  } catch {
    throw new Error(
      `Invalid API_BASE_URL format: ${apiBaseUrl}. ` +
      `Expected a valid URL (e.g., https://api-dev.myseatmap.com)`
    );
  }
  
  // Validate API key is not empty
  if (!apiKey.trim()) {
    throw new Error(
      'API_KEY cannot be empty. Please provide a valid API key from the MySeatMap administrator.'
    );
  }
  
  return {
    apiBaseUrl,
    apiKey,
    environment,
    isDevelopment: environment === 'dev',
    isProduction: environment === 'production'
  };
}