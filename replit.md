# Student Attendance and Grading System

## Overview

This is a full-stack web application designed for managing student attendance and grades in educational settings. The system provides comprehensive functionality for student registration, QR code-based attendance tracking, session management, grade entry, and reporting. Built with a modern tech stack, it offers both web interface capabilities and preparation for potential desktop deployment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI primitives with shadcn/ui components for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API architecture with structured route handling
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **File Handling**: Multer middleware for file upload processing
- **Development**: Vite integration for hot module replacement and development server

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle with Neon Database serverless support
- **Schema Management**: Centralized schema definitions in shared directory for frontend/backend consistency
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Session Storage**: Connect-pg-simple for PostgreSQL-based session storage

### Key Features and Components

#### Student Management
- Student registration with automatic unique 3-digit code generation
- QR code generation for each student using external QR code libraries
- Student profile management with guardian contact information
- Bulk import/export capabilities for student data

#### Attendance Tracking
- QR code scanning for attendance using HTML5 QR code scanner
- Manual code entry as fallback option
- Real-time attendance recording with session association
- Attendance history and reporting

#### Session Management
- Class session creation and scheduling
- Active session tracking for attendance
- Session status management (scheduled, active, completed)

#### Grading System
- Grade entry and management per student
- Multiple assessment types support
- Grade calculation and reporting
- Performance analytics

#### Reporting and Analytics
- Attendance rate calculations
- Grade distribution analysis
- Export functionality for reports
- Student performance tracking

### Authentication and Authorization
The current implementation uses a session-based approach with PostgreSQL storage, though specific authentication mechanisms are prepared for future implementation.

### External Dependencies

#### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library based on Radix UI

#### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking for improved development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

#### Database and ORM
- **Drizzle ORM**: Type-safe ORM for PostgreSQL operations
- **Neon Database**: Serverless PostgreSQL database service
- **Drizzle Kit**: Schema management and migration tools

#### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation library for runtime type checking
- **@hookform/resolvers**: Integration between React Hook Form and Zod

#### QR Code Functionality
- **External QR Libraries**: Browser-based QR code generation and scanning
- **HTML5 QR Code Scanner**: Camera-based QR code reading capabilities

#### State Management and API
- **TanStack Query**: Server state management with caching and synchronization
- **React Router**: Navigation and routing capabilities

#### Session and Storage
- **Express Session**: Session management middleware
- **Connect-pg-simple**: PostgreSQL session store for persistent sessions

The application is designed with scalability in mind, featuring a modular component structure, shared type definitions, and a clear separation between client and server code. The architecture supports both development and production deployments with Vite's development server and Express.js production serving.