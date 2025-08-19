# ProjectFlow - Google Drive Project Management Platform

## Overview

This is a completely free project management platform built with React and Express.js that uses Google Drive for data storage instead of traditional databases. Users provide their own Google API credentials to keep the platform 100% free while maintaining complete control over their data. The platform offers comprehensive project management capabilities including kanban boards, task tracking, team collaboration, and AI-powered insights using Google's Gemini AI. All project data is stored securely in the user's own Google Drive, ensuring privacy and zero hosting costs.

## Recent Changes (August 19, 2025)

### Authentication Flow Restructure
- **New User Journey**: Home page → Google login → Workspace setup → Dashboard
- **Professional Landing Page**: Created comprehensive marketing page emphasizing free platform and data ownership
- **Post-Authentication Setup**: Google API configuration now happens after login rather than before
- **Enhanced UX**: Clear three-step process with proper call-to-action buttons throughout

### Complete Dashboard Implementation  
- **Project Management**: Full dashboard with project grid, search/filter, and creation dialogs
- **Statistics Cards**: Real-time project stats with Google Drive integration messaging
- **Kanban Board**: Complete project detail page with task management and status updates
- **UI Components**: Added all necessary components (dialogs, textareas, badges, etc.)

### Technical Improvements
- **Error Resolution**: Fixed all TypeScript and routing syntax errors
- **Component Structure**: Properly organized UI components with consistent styling
- **API Integration**: Enhanced server routes for dashboard statistics and project management
- **Authentication State**: Improved auth flow with proper loading and error states

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected routes based on authentication
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query for server state management and data fetching
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **Styling**: Tailwind CSS with custom CSS variables for theming and consistent design

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with authentication middleware and error handling
- **Session Management**: Express sessions stored in PostgreSQL with connect-pg-simple
- **Development**: Hot reloading via Vite integration in development mode
- **Build Process**: esbuild for production bundling with platform-specific optimizations

### Data Storage Layer
- **Storage**: Google Drive API for all project data persistence
- **Data Format**: JSON files stored in user's Google Drive folders
- **Schema Validation**: Zod schemas for type-safe data operations
- **Structure**: Each project gets its own Google Drive folder with project-data.json file
- **Synchronization**: Real-time updates through Google Drive API

### Authentication System
- **Provider**: Google OAuth 2.0 with user-provided API credentials
- **API Requirements**: Users provide their own Google API key, Client ID, and Client Secret
- **Session Storage**: Memory-based sessions for minimal server requirements
- **Security**: Secure session handling with user-controlled API access
- **Data Privacy**: All data remains in user's own Google Drive

### AI Integration
- **Provider**: Google Gemini AI (GoogleGenAI) for intelligent project insights
- **Capabilities**: Project analysis, task optimization suggestions, workload balance recommendations
- **Implementation**: Dedicated AI service with structured prompt engineering for actionable suggestions

## External Dependencies

### Core Technologies
- **Data Storage**: Google Drive API for file storage and management
- **Authentication**: Google OAuth 2.0 (user-provided credentials)
- **AI Services**: Google Gemini AI API for intelligent project recommendations
- **UI Components**: Radix UI primitives for accessible component foundation

### Development Tools
- **Build System**: Vite for development server and build optimization
- **Type Checking**: TypeScript with strict configuration
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Code Quality**: ESLint and TypeScript for code quality and type safety

### Third-party Libraries
- **Data Fetching**: TanStack Query for server state management
- **Form Validation**: Zod schema validation with React Hook Form
- **Date Handling**: date-fns for date manipulation and formatting
- **UI Interactions**: React Beautiful DND for drag-and-drop functionality
- **Icons**: Lucide React for consistent iconography