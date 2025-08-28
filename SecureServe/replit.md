# Overview

UniRes Reception Logbook is a comprehensive digital logbook system designed for university residence reception desks. The application modernizes the traditional paper-based tracking system for item loans to students, providing secure role-based access control, real-time tracking, and automated overdue management. The system supports three user roles (Admin, Clerk, Auditor) with appropriate permissions and includes comprehensive audit logging for all system activities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React 18 with TypeScript, utilizing Vite for fast development and building. The application uses a modern component-based architecture with:

- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS for utility-first styling with a consistent design system
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Routing**: Wouter for lightweight client-side routing
- **Layout**: Responsive design with sidebar navigation and header components

The frontend follows a feature-based folder structure with shared components, hooks, and utilities organized for maintainability.

## Backend Architecture
The backend is a RESTful API built with Node.js and Express, following security-first principles:

- **Framework**: Express.js with TypeScript for type safety
- **Security**: Helmet for security headers, CORS configuration, rate limiting, and comprehensive input validation
- **Authentication**: JWT-based authentication with short-lived access tokens and HTTP-only refresh cookies
- **Validation**: Zod schemas for request validation and type safety
- **Logging**: Pino for structured JSON logging
- **Scheduled Tasks**: Node-cron for automated overdue loan detection

The API follows RESTful conventions with proper HTTP status codes and error handling.

## Database Layer
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:

- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema**: Well-defined relationships between Users, Students, Items, Loans, and AuditLogs
- **Indexing**: Strategic indexes on frequently queried fields for performance
- **Migrations**: Drizzle Kit for database schema migrations

## Role-Based Access Control (RBAC)
Three distinct user roles with hierarchical permissions:

- **ADMIN**: Full system access including user management, reports, and system configuration
- **CLERK**: Standard reception operations including loan creation/return and student management
- **AUDITOR**: Read-only access to records and audit logs for compliance

Middleware enforces role-based permissions at the API level with proper error handling.

## Security Architecture
Multi-layered security approach:

- **Authentication**: JWT access tokens (10-minute expiry) with secure refresh token rotation
- **Password Security**: bcrypt hashing with configurable cost factor
- **Rate Limiting**: Different limits for authentication, general API, and mutation endpoints
- **Account Protection**: Automatic lockout after failed login attempts
- **Request Validation**: Comprehensive Zod validation for all inputs
- **Headers**: Security headers via Helmet including CSP

## Data Validation and Type Safety
End-to-end type safety using shared schemas:

- **Shared Types**: Common Zod schemas used across frontend and backend
- **Runtime Validation**: All API requests validated against Zod schemas
- **TypeScript**: Full TypeScript coverage for compile-time type checking
- **Database Types**: Generated types from Drizzle schema definitions

## Audit and Compliance
Comprehensive audit logging system:

- **Immutable Logs**: All system activities logged to dedicated audit table
- **User Actions**: Track login attempts, CRUD operations, and system changes
- **Data Retention**: Configurable retention policies for audit data
- **Reporting**: Audit trail accessible to authorized users for compliance

## Automated Task Management
Scheduled job system for maintenance tasks:

- **Overdue Detection**: Automatic marking of loans exceeding policy limits
- **Cleanup Tasks**: Configurable maintenance and cleanup operations
- **System Health**: Monitoring and alerting capabilities

# External Dependencies

## Database Services
- **Neon**: Serverless PostgreSQL database hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

## Authentication and Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and verification
- **helmet**: Security headers middleware
- **express-rate-limit**: API rate limiting protection

## Frontend Libraries
- **Radix UI**: Accessible component primitives for the design system
- **shadcn/ui**: Pre-built accessible components built on Radix
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Wouter**: Lightweight routing solution

## Development and Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Zod**: Runtime type validation and schema definition

## Monitoring and Logging
- **Pino**: High-performance JSON logging
- **node-cron**: Scheduled task execution

## Validation and Forms
- **Zod**: Schema validation library used across the stack
- **@hookform/resolvers**: Integration between React Hook Form and Zod

The system is designed for easy deployment on platforms like Replit with minimal configuration required, using environment variables for database connections and security keys.