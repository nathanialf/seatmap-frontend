/**
 * Conditional logging utility for MySeatMap frontend
 * Only logs to console when in development environment
 */

interface Logger {
  log: (message?: unknown, ...optionalParams: unknown[]) => void;
  warn: (message?: unknown, ...optionalParams: unknown[]) => void;
  error: (message?: unknown, ...optionalParams: unknown[]) => void;
}

// Check if we're in development environment
// Use NODE_ENV which is automatically set by Next.js and available everywhere
const isDevelopment = process.env.NODE_ENV === 'development';

// Create conditional logger that only logs in development
const logger: Logger = {
  log: (message?: unknown, ...optionalParams: unknown[]) => {
    if (isDevelopment) {
      console.log(message, ...optionalParams);
    }
  },
  warn: (message?: unknown, ...optionalParams: unknown[]) => {
    if (isDevelopment) {
      console.warn(message, ...optionalParams);
    }
  },
  error: (message?: unknown, ...optionalParams: unknown[]) => {
    if (isDevelopment) {
      console.error(message, ...optionalParams);
    }
  },
};

export default logger;