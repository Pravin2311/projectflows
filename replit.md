# ProjectFlow - Google Drive Project Management Platform

## Overview

This is a completely free project management platform built with React and Express.js that uses Google Drive for data storage instead of traditional databases. Users provide their own Google API credentials (including Google AI API key) to keep the platform 100% free while maintaining complete control over their data and AI usage. The platform offers comprehensive project management capabilities including kanban boards, task tracking, team collaboration, and AI-powered insights using Google's Gemini AI with user's own API key. All project data is stored securely in the user's own Google Drive, ensuring privacy and zero hosting costs. The platform is forever free - users only pay Google directly for their own API usage.

## Recent Changes (August 20, 2025)

### Universal Email Authentication for Team Members (August 20, 2025) ✅
- **Any Email Provider Supported**: Team members can use Gmail, Yahoo, corporate emails - all supported
- **Gmail Required for Owners**: Project owners must use Gmail for Google API credential setup
- **Zero API Setup for Members**: Team members need no API credentials regardless of email provider
- **Automatic Configuration Inheritance**: Members inherit all Google API settings from Gmail-based project owners
- **Enhanced Security Model**: Only Gmail-based owners handle sensitive API credentials
- **Universal Member Access**: `/api/auth/gmail-login` endpoint works with any email provider for members

### Progressive Google API Setup System Implementation (August 20, 2025) ✅
- **New Architecture**: Users start with minimal API configuration and progressively enable additional services
- **Modular API Selection**: Individual control over Google Docs, Sheets, Gmail, Calendar, Tasks, and Contacts APIs
- **Dynamic OAuth Scopes**: Scopes generated based on user's enabled APIs for better privacy and permissions
- **Enhanced User Experience**: Start with basic project management, expand features as needed
- **Google Workspace Integration**: Full Google Docs API and Sheets API services for document and spreadsheet management
- **Smart Defaults**: Core APIs (Drive, AI) always enabled, optional APIs user-controlled
- **API Components**: New UI components for Google Docs and Sheets with search, creation, and management features

### Zero-Setup Team Member Authentication (August 20, 2025) ✅
- **Revolutionary UX**: Team members enter ONLY their Gmail address - no API setup whatsoever
- **Perfect Security Model**: Project owners control all API credentials, members get inherited secure access
- **Instant Authentication**: `/api/auth/gmail-login` validates email against project invitations
- **Configuration Inheritance**: Members automatically receive project owner's Google API configuration
- **Cost Simplification**: All API usage bills to project owner - no split billing complexity
- **Enhanced User Experience**: True zero-configuration onboarding for invited team members

### Completely Free Model Implementation Complete (August 20, 2025) ✅
- **Architecture Pivot**: Platform now completely free with user-provided Google AI API keys
- **Removed Functionality**: All subscription tiers, Stripe integration, payment processing eliminated
- **Added Features**: Gemini API key configuration in Google settings form
- **Storage Updates**: Updated schemas and interfaces to remove subscription-related fields
- **Backend Cleanup**: Removed payment routes, subscription management, and Stripe dependencies
- **User Benefit**: Zero platform costs - users only pay Google directly for their own API usage
- **Data Ownership**: Complete control over AI costs through user's own Google account

### Platform-Managed OAuth Implementation Status (August 20, 2025)
- **Technical Implementation**: ✅ OAuth flow working, tokens received, authentication complete
- **Current User Experience**: ❌ Too complex - requires Google Cloud Console configuration
- **User Feedback**: "looks complicated process for first time end user" - requires simplification
- **Root Issue**: OAuth app stuck in "Testing" mode due to mixed HTTP/HTTPS redirect URIs - Google requires HTTPS-only for production
- **Required Fix**: Create HTTPS-only OAuth app with production redirect URIs, then publish to production
- **Technical Blocker**: Mixed protocol URIs (http://localhost + https://replit.dev) prevent production publishing
- **Target Goal**: True 1-click Gmail connection with zero technical configuration for end users

### Gmail API Email Invitations
- **Real Email Sending**: Complete Google Gmail API integration for sending actual email invitations
- **Professional Templates**: Beautiful HTML email templates with project branding and invitation details
- **Smart Authorization**: Automatic Gmail scope detection with one-click reauthorization button
- **Universal Compatibility**: Sends to ANY email address (Gmail, Yahoo, corporate, all providers)
- **Google-First Architecture**: Uses user's Google account to send emails, maintaining free platform approach

### Advanced Time Tracking Implementation
- **Time Tracker Component**: Built comprehensive time tracking with start/stop timer, manual entry, and progress slider
- **Visual Progress Tracking**: Color-coded completion indicators with automatic status-based updates
- **Session Management**: Local storage tracking for work sessions with time logging
- **Time Statistics**: Completion rates, estimated vs actual hours, and visual progress bars
- **Real-time Updates**: Timer functionality with pause/resume that automatically saves logged hours

### Enhanced Comment System
- **Rich Comment Editor**: Advanced commenting with @ mentions, # task links, and file attachments
- **Autocomplete Features**: Smart dropdown suggestions for team members and task references
- **File Management**: Drag-and-drop file attachments with visual indicators
- **Interactive Elements**: Comments display mentions, task links, and attachments with badges

### Team Collaboration Features
- **Invite Team Members**: Added "Invite Team" button in project header for easy member invitations
- **Role-Based Access**: Support for member and admin roles with appropriate permissions
- **Gmail-Powered Invitations**: Real email invitations sent via Google Gmail API with automatic fallback
- **Team Management**: Project member count display and access control

### Google-First Data Architecture
- **Zero Platform Costs**: No payment processing - platform is completely free forever
- **Data Storage**: All project data in user's Google Drive with complete ownership
- **AI Integration**: Google Gemini AI for project insights with user's own API key
- **Authentication**: Google OAuth with user-provided API credentials
- **Cost Control**: Users pay Google directly for their own API usage

### Complete Settings System Implementation (August 20, 2025) ✅
- **Comprehensive User Settings**: Full-featured user preferences with 4-tab interface (Profile, Notifications, Appearance, Privacy)
- **Advanced Project Settings**: Complete project configuration with 4-tab interface (General, Team, Notifications, Automation)
- **Universal Settings Access**: All settings buttons throughout the platform now fully functional
- **Professional Settings UX**: Modern tabbed interfaces with real-time save functionality and comprehensive configuration options

### Settings Features Implemented
1. **Dashboard Header Settings** ✅
   - API Modules button: Complete Google API management with toggles for all services
   - User Settings button: Full user profile, notifications, themes, and privacy controls
   
2. **Project Settings** ✅
   - General tab: Project details, visibility, category, default views
   - Team tab: Member permissions, roles, access controls, invitation settings
   - Notifications tab: Email preferences, digest frequency, integration settings
   - Automation tab: AI features, smart scheduling, auto-transitions, time tracking
   - Danger zone: Archive and delete project functionality

3. **Sidebar Settings** ✅
   - Global settings access via event-driven architecture
   - Seamless integration with dashboard user settings

4. **AI Settings Controls** ✅
   - Refresh suggestions button for regenerating AI analysis
   - User-controlled AI feature preferences in automation settings

### Technical Infrastructure
- **Component Library**: Added slider, time-tracker, rich-comment-editor, user-settings, and project-settings components
- **Type Safety**: Fixed TypeScript errors and improved type definitions
- **Real-time Updates**: Enhanced React Query integration for live data synchronization
- **Error Handling**: Comprehensive error states and user feedback systems

## User Preferences

Preferred communication style: Simple, everyday language.
Business goal: Focus on completely free Google-first architecture where users provide their own Google AI API keys. No premium tiers or subscriptions - keep platform 100% free forever. Users control their own AI costs through Google directly.

**Core APIs (Always Required)**: Google OAuth API (authentication), Google Drive API (data storage), Google Gemini AI API (AI features) - these three APIs form the foundation of the platform and cannot be disabled.

**COMPLETELY FREE FOREVER (August 20, 2025)**: Platform architecture now 100% free with user-provided Google AI API keys. No subscriptions, no premium tiers, no payment processing. Users control their own AI costs directly through Google - platform costs them nothing.

**CRITICAL USER FEEDBACK (August 20, 2025)**: Current OAuth setup is too complicated for end users. Need to simplify to truly zero-configuration approach. Users should never need to touch Google Cloud Console.

**SOLUTION IDENTIFIED**: Google requires HTTPS-only redirect URIs for production OAuth apps. Mixed HTTP/HTTPS URIs prevent publishing to production. Solution: Deploy with Replit custom domain (automatic HTTPS) + create HTTPS-only production OAuth app.

**DEVELOPMENT HTTP FALLBACK IMPLEMENTED (August 20, 2025)**: Environment-based OAuth credential selection now active. Development mode uses HTTP-compatible OAuth (current setup), production mode will use HTTPS-only OAuth credentials when deployed.

**GMAIL SCOPE VERIFICATION FIX (August 20, 2025)**: Fixed Gmail scope check to verify scope string directly instead of API call, eliminating false negatives. OAuth flow and email sending confirmed working in development mode.

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