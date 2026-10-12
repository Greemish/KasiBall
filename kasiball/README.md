# KasiBall

KasiBall is a Next.js football league management application for administration, team management, match operations, and public league views.

## Project structure

- app/ — app router pages and API routes
- components/ — reusable UI and domain components
- lib/ — utilities, validation, auth, and service layers
- prisma/ — Prisma schema and migrations
- types/ — shared TypeScript types
- docs/ — product and technical documentation
- public/ — static assets

## Getting started

1. Install dependencies:
   npm install
2. Copy environment variables:
   cp .env.example .env
3. Run the development server:
   npm run dev

## Scripts

- npm run dev — start the app in development mode
- npm run build — build the app for production
- npm run start — run the production build
- npm run lint — run lint checks

## Notes

This repository is intentionally scaffolded as a starter structure for the KasiBall platform and can be expanded with real business logic, database models, and UI components.
