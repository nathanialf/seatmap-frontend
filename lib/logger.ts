/**
 * Conditional logging utility for MySeatMap frontend
 * Only logs to console when in development environment
 */

interface Logger {
  log: (message?: any, ...optionalParams: any[]) => void;
  warn: (message?: any, ...optionalParams: any[]) => void;
  error: (message?: any, ...optionalParams: any[]) => void;
}

// Check if we're in development environment
// Use NODE_ENV which is automatically set by Next.js and available everywhere
const isDevelopment = process.env.NODE_ENV === 'development';

// Create conditional logger that only logs in development
const logger: Logger = {
  log: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.log(message, ...optionalParams);
    }
  },
  warn: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...optionalParams);
    }
  },
  error: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.error(message, ...optionalParams);
    }
  },
};

export default logger;