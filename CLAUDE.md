# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js frontend application for a seat map tracking service called MySeatMap, designed primarily for airline industry workers and travelers who need to monitor flight seat availability. The application allows users to search flights, view real-time seat maps, and set up alerts for seat availability changes.

This frontend service will integrate with a backend API service to provide real-time flight and seat map data.

## Technology Stack

- **Framework**: Next.js 14.2.25 with React 19 and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components (New York style variant)
- **Package Manager**: npm (evidenced by package-lock.json)
- **UI Components**: Comprehensive shadcn/ui implementation with Radix UI primitives
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono
- **Analytics**: Vercel Analytics

## Build Commands

```bash
# Development server
npm run dev

# Production build  
npm run build

# Start production server
npm run start

# Linting (with auto-fix where possible)
npm run lint
```

## Code Quality

### ESLint Configuration
- Extends recommended rules for TypeScript, React, and React Hooks
- Enforces React Hooks rules to prevent common mistakes
- Configured to work with TypeScript and JSX
- Custom rules include:
  - Disabled `react/react-in-jsx-scope` (not needed in React 17+)
  - Strict unused variable checking with underscore prefix exceptions
  - Disabled prop-types (using TypeScript instead)

### Build Process
- TypeScript compilation with Next.js Turbopack
- Static generation for all pages
- Build errors are currently ignored in production (configured in next.config.mjs)
- No type validation during build (skipped for faster builds)

## Project Structure

### Core Directories

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components
- `components/ui/` - shadcn/ui component library
- `lib/` - Utility functions and shared logic
- `hooks/` - Custom React hooks
- `styles/` - Global CSS files
- `public/` - Static assets including professional headshot images

### Key Configuration Files

- `components.json` - shadcn/ui configuration with path aliases
- `next.config.mjs` - Next.js config with TypeScript build error ignoring and image optimization disabled
- `tsconfig.json` - TypeScript configuration with `@/*` path mapping to root
- `postcss.config.mjs` - PostCSS configuration for Tailwind

## Architecture Notes

### Component Organization
- Main layout defined in `app/layout.tsx` with global navigation footer
- Primary homepage logic concentrated in `app/page.tsx` as a comprehensive client component
- Navigation component (`components/navbar.tsx`) handles routing and mobile responsiveness
- UI components follow shadcn/ui patterns with consistent styling and variants

### Key Features Implementation
- **Seat Map Visualization**: Complex grid-based seat rendering with status indicators (available/occupied/blocked/exit)
- **Flight Search**: Multi-step form flow with search parameters and results display  
- **Real-time Updates**: Mock data structure prepared for API integration
- **Registration Modals**: Usage-based modal triggers for user conversion
- **Responsive Design**: Mobile-first approach with touch gesture support

### Data Models
- `SeatData` type defines airline seat information structure compatible with industry standards
- `DeckConfiguration` type manages aircraft layout parameters
- Mock flight data structure prepared for external API integration

### State Management
- React hooks for local component state
- localStorage integration for persistent user data (e.g., seat map view tracking)
- Prepared for external API integration with structured data types

## Development Best Practices

### Task Planning and Approval
- All assigned tasks must be planned and broken down into clear steps before implementation begins
- Task plans should be presented for approval before starting work
- Use TodoWrite tool to track task progress throughout implementation

### Code Quality Requirements
Before any commit is considered ready:
1. **Build** - `npm run build` must succeed without errors
2. **Test** - All tests must pass (when test framework is added)
3. **Lint** - `npm run lint` must pass without errors

These steps must be run sequentially and all must succeed for code to be commit-ready.

### Commit Guidelines
- Commits should not include Claude authoring information
- All code quality checks must pass before committing
- Focus on clear, descriptive commit messages that explain the "why" not just the "what"

## Environment Configuration

### API Integration - IMPLEMENTED ✅
The application is now fully integrated with the MySeatMap backend API.

#### Environment Files
- `.env.example` - Template with variable definitions and setup instructions
- `.env.local` - Local development environment (gitignored, contains actual API credentials)

#### Environment Variables
```bash
API_BASE_URL=<backend_api_endpoint>
API_KEY=<api_gateway_key>
ENVIRONMENT=development
```

#### Getting API Key for Local Development
API key can be retrieved using AWS CLI with appropriate profile:
```bash
# List available API keys
aws apigateway get-api-keys --profile <aws-profile> --region us-west-1

# Get specific API key value
aws apigateway get-api-key --api-key <key-id> --include-value --profile <aws-profile> --region us-west-1 --query 'value' --output text
```

### API Client Usage

#### Core Files
- `lib/config.ts` - Environment configuration with validation
- `lib/api-client.ts` - Complete API client with authentication management

#### Authentication Flow
The application uses a **dual authentication** system:
1. **API Key** (X-API-Key header) - Required for ALL requests
2. **JWT Token** (Authorization header) - Obtained automatically via guest tokens

#### Making API Calls
```typescript
import apiClient from '@/lib/api-client';

// Automatically handles authentication (gets guest token if needed)
const response = await apiClient.authenticatedRequest('/flight-search', {
  method: 'POST',
  body: JSON.stringify({
    departure: 'LAX',
    arrival: 'JFK',
    date: '2024-01-15'
  })
});
```

#### Guest Token System
- **Automatic**: Tokens acquired transparently when needed
- **Storage**: Persisted in localStorage with expiration tracking
- **Renewal**: Expired tokens refreshed automatically before API calls
- **Limits**: Guest users get 2 seat map views (24-hour token validity)

#### Authentication Status
```typescript
// Check current authentication state
const authStatus = apiClient.getAuthStatus();
console.log('Authenticated:', authStatus.isAuthenticated);
console.log('Is guest user:', authStatus.isGuest);

// Force guest token acquisition
await apiClient.getGuestToken();

// Logout (clear stored tokens)
apiClient.logout();
```

#### Token Storage Keys (localStorage)
- `myseatmap_jwt_token` - The JWT token string
- `myseatmap_user_id` - User/guest ID
- `myseatmap_auth_provider` - Either "GUEST" or "USER"
- `myseatmap_token_expires` - Token expiration timestamp

### Jenkins Integration
Environment variables use clean naming (no framework prefixes) for seamless CI/CD pipeline integration. Jenkins will inject production values during deployment.

### Future Infrastructure
- **Terraform**: Infrastructure as code will be added after backend integration
- **Jenkins**: CI/CD pipeline will be implemented to handle deployments and provide environment-specific secrets
- **Testing Framework**: Will be added as application matures

## Development Workflow

### Path Aliases
The project uses TypeScript path mapping configured in both `tsconfig.json` and `components.json`:
- `@/*` maps to the project root
- `@/components` maps to components directory
- `@/lib` maps to lib directory
- `@/hooks` maps to hooks directory

### Styling Guidelines
- Uses Tailwind CSS with custom configuration
- shadcn/ui components with "new-york" style variant
- Consistent color scheme with teal accent colors and neutral base
- Mobile-responsive design patterns throughout

### Image Assets
Professional headshot images are stored in `/public/` for user testimonials and placeholders. Images are optimized but unoptimized setting is enabled in Next.js config.

## Important Notes

- TypeScript build errors are currently ignored in production builds (next.config.mjs)
- The application is set up for Vercel deployment with analytics integration
- No test framework is currently configured
- ESLint is properly configured with TypeScript, React, and React Hooks support
- The project uses client-side rendering extensively with "use client" directives
- All lint issues have been resolved (setState in useEffect, component creation during render, hydration mismatches)
- Git repository initialized with comprehensive .gitignore for React and Terraform projects