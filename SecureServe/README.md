# UniRes Reception Logbook

A comprehensive digital logbook system for university residence reception desks. This application digitizes the traditional paper-based system for tracking item loans to students, providing secure role-based access, audit trails, and reporting capabilities.

## Features

### Core Functionality
- **Digital Loan Management**: Create, track, and return item loans with full audit trails
- **Student Management**: Maintain student records with search and filtering capabilities  
- **Inventory Management**: Track items available for loan with categorization and asset tags
- **Role-Based Access Control**: Three user roles (Admin, Clerk, Auditor) with appropriate permissions
- **Automated Overdue Tracking**: Automatic status updates for loans exceeding policy limits
- **Comprehensive Audit Logging**: Immutable logs of all system activities

### Security Features
- **JWT Authentication**: Short-lived access tokens with secure refresh token rotation
- **Account Lockout**: Automatic lockout after failed login attempts
- **Rate Limiting**: Protection against brute force and DoS attacks
- **Input Validation**: Comprehensive validation using Zod schemas
- **Secure Headers**: Helmet.js security headers including CSP
- **Password Security**: bcrypt hashing with configurable cost factor

### User Experience
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Real-time Updates**: React Query for efficient data synchronization
- **Keyboard Shortcuts**: Quick actions and fuzzy search capabilities
- **Toast Notifications**: User feedback for all actions
- **Accessibility**: WCAG compliant components from shadcn/ui

## Tech Stack

### Backend
- **Node.js** with TypeScript for type safety
- **Express.js** web framework with security middleware
- **PostgreSQL** database with **Prisma ORM**
- **JWT** authentication with refresh token rotation
- **bcrypt** for password hashing
- **Zod** for request validation
- **Pino** for structured JSON logging
- **node-cron** for scheduled tasks

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for accessible components
- **React Query** for server state management
- **React Hook Form** with Zod validation
- **Wouter** for lightweight routing

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd unires-logbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   