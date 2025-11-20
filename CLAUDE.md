# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js frontend application for a seat map tracking service called MySeatMap, designed primarily for airline industry workers and travelers who need to monitor flight seat availability. The application allows users to search flights, view real-time seat maps, and set up alerts for seat availability changes.

## Technology Stack

- **Framework**: Next.js 14.2.25 with React 19 and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components (New York style variant)
- **Package Manager**: pnpm (evidenced by pnpm-lock.yaml)
- **UI Components**: Comprehensive shadcn/ui implementation with Radix UI primitives
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono
- **Analytics**: Vercel Analytics

## Build Commands

```bash
# Development server
pnpm dev

# Production build  
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

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
- ESLint is configured but no specific rules file was found
- The project uses client-side rendering extensively with "use client" directives