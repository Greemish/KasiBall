# Architecture Overview

KasiBall is structured as a Next.js app with a modular domain layout:

- app/ contains route-level pages and API endpoints
- components/ contains reusable UI and feature-specific blocks
- lib/ contains validation, services, and shared utilities
- prisma/ contains the database schema and migration history
- types/ holds shared TypeScript models

This scaffold is designed to be extended into a full football league management system.
