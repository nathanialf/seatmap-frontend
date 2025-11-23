# MySeatMap Frontend

A Next.js frontend application for real-time airline seat map tracking and flight search, designed for airline industry workers and travelers who need to monitor flight seat availability.

## Features

- **Real-time Seat Maps**: Visualize aircraft seat layouts with live availability status
- **Flight Search**: Multi-step search flow with comprehensive filtering options
- **Seat Availability Alerts**: Set up notifications for seat status changes
- **Mobile Responsive**: Touch-optimized interface for all device sizes
- **Guest Access**: Limited functionality available without registration

## Technology Stack

- **Framework**: Next.js 14.2.25 with React 19 and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components (New York variant)
- **Package Manager**: npm
- **UI Components**: Radix UI primitives via shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono

## Quick Start

### Prerequisites

- Node.js (version compatible with Next.js 14.2.25)
- npm
- API credentials (see Environment Setup)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd seatmap-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```bash
API_BASE_URL=<backend_api_endpoint>
API_KEY=<api_gateway_key>
ENVIRONMENT=development
```

### Getting API Key

If you have AWS CLI access, retrieve the API key:

```bash
# List available API keys
aws apigateway get-api-keys --profile <aws-profile> --region us-west-1

# Get specific API key value
aws apigateway get-api-key --api-key <key-id> --include-value --profile <aws-profile> --region us-west-1 --query 'value' --output text
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting (with auto-fix)
npm run lint
```

### Code Quality Checklist

Before committing changes, ensure all steps pass:

1. **Build**: `npm run build` - must succeed without errors
2. **Lint**: `npm run lint` - must pass without errors

### Project Structure

```
app/                    # Next.js App Router pages and layouts
components/            # Reusable React components
  ui/                  # shadcn/ui component library
lib/                   # Utility functions and API client
hooks/                 # Custom React hooks
styles/                # Global CSS files
public/                # Static assets
```

### Path Aliases

The project uses TypeScript path mapping:

- `@/*` → project root
- `@/components` → components directory
- `@/lib` → lib directory
- `@/hooks` → hooks directory

## API Integration

### Authentication

The application uses dual authentication:

1. **API Key** (X-API-Key header) - Required for all requests
2. **JWT Token** (Authorization header) - Acquired automatically

### Making API Calls

```typescript
import apiClient from '@/lib/api-client';

const response = await apiClient.authenticatedRequest('/flight-search', {
  method: 'POST',
  body: JSON.stringify({
    departure: 'LAX',
    arrival: 'JFK', 
    date: '2024-01-15'
  })
});
```

### Guest Access

- Automatic guest token acquisition
- 30-day token validity
- Limited to 2 seat map views per month
- Tokens stored in localStorage with automatic renewal

## Key Features

### Seat Map Visualization

- Grid-based seat rendering with status indicators
- Support for multiple aircraft configurations
- Real-time availability updates
- Touch-optimized mobile interface

### Flight Search

- Multi-step form flow
- Search parameter persistence
- Results filtering and sorting
- Mobile-responsive design

## Contributing

### Development Workflow

1. Plan tasks and break down into clear steps
2. Implement changes following existing code patterns
3. Run quality checks (`npm run build`, `npm run lint`)
4. Test functionality across device sizes
5. Commit with descriptive messages

### Code Standards

- Follow existing TypeScript and React patterns
- Use shadcn/ui components for UI consistency
- Maintain mobile-first responsive design
- Follow ESLint configuration rules

## Deployment

The application is configured for Vercel deployment with:

- Static generation optimization
- Vercel Analytics integration
- Environment variable injection via CI/CD

## License

[Add appropriate license information]