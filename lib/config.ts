/**
 * Environment configuration for MySeatMap frontend
 * Manages API connection settings and environment variables
 */

interface Config {
  apiBaseUrl: string;
  apiKey: string;
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Please check your .env.local file or environment configuration.`
    );
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Create configuration object with validation
const config: Config = {
  apiBaseUrl: getRequiredEnvVar('API_BASE_URL'),
  apiKey: getRequiredEnvVar('API_KEY'),
  environment: getOptionalEnvVar('ENVIRONMENT', 'development'),
  get isDevelopment() {
    return this.environment === 'development';
  },
  get isProduction() {
    return this.environment === 'production';
  },
};

// Validate API base URL format
try {
  new URL(config.apiBaseUrl);
} catch {
  throw new Error(
    `Invalid API_BASE_URL format: ${config.apiBaseUrl}. ` +
    `Expected a valid URL (e.g., https://api-dev.myseatmap.com)`
  );
}

// Validate API key is not empty
if (!config.apiKey.trim()) {
  throw new Error(
    'API_KEY cannot be empty. Please provide a valid API key from the MySeatMap administrator.'
  );
}

export default config;