# Task Queue Control Plane UI

React + TypeScript frontend for the Distributed Task Queue & Job Orchestrator.

## Features

- **Dashboard** - Overview of job counts by status and DLQ depth
- **Jobs List** - Paginated table with filtering by status, job ID, and partition key
- **Job Detail** - Detailed view with payload, result, and cancel functionality
- **Dead Letter Queue** - View of failed jobs that exceeded retry limits
- **Health** - System health status (liveness and readiness probes)

## Tech Stack

- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Vitest + React Testing Library for testing

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd ui
npm install
```

### Run Development Server

```bash
npm run dev
```

The UI will be available at `http://localhost:3000`.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Project Structure

```
ui/
  src/
    api/              # API client layer
    components/       # React components
      common/         # Reusable UI components
      jobs/           # Job-related components
      layout/         # Layout components
      metrics/        # Metrics components
    hooks/            # Custom React hooks
    pages/            # Page components
    router/           # Routing configuration
```

## API Integration

The UI assumes the backend API is available at the same origin (via Nginx proxy). All API calls are made to relative paths:

- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- `/jobs` - List/create jobs
- `/jobs/:id` - Get job details
- `/jobs/:id/cancel` - Cancel job
- `/metrics` - Get metrics

## Styling

The UI uses Tailwind CSS with an Amazon console-inspired neutral color palette. All components follow a consistent design system with:

- Neutral grays for backgrounds and borders
- Clear visual hierarchy
- No animations or decorative elements
- Focus states for keyboard navigation

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

