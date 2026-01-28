# Baseball Swing Analyzer

## Overview

This is a baseball swing analysis web application that processes video uploads to provide coaching feedback on swing mechanics. The app analyzes swing timing (hip vs. hand movement), classifies swing patterns, and generates AI-powered coaching explanations. It calculates game readiness scores and contact speed estimates to help players understand what breaks down in their swing under game speed.

**Core value proposition:** "This app explains why a swing breaks down under game speed and what to fix first."

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript
- **Build Tool:** Vite with custom plugins for meta images and Replit integration
- **Styling:** Tailwind CSS v4 with shadcn/ui component library (New York style)
- **State Management:** TanStack Query for server state, React hooks for local state
- **Routing:** Wouter for lightweight client-side routing
- **Animation:** Framer Motion for UI animations

### Backend Architecture
- **Runtime:** Node.js with Express + Python for video analysis
- **Language:** TypeScript with ES modules (Node), Python 3.11 (video processing)
- **API Pattern:** RESTful endpoints under `/api/*`
- **File Uploads:** Multer for handling video file uploads
- **Video Analysis:** MediaPipe Pose + OpenCV for real pose estimation
- **AI Integration:** OpenAI API (user's own key) for generating coaching explanations

### Video Analysis Pipeline
- **Library:** MediaPipe Pose (Google's free, open-source pose estimation)
- **Process:** Python script (`server/swing_analyzer.py`) analyzes uploaded videos frame-by-frame
- **Detection:** Tracks hip and wrist landmarks to detect movement start times
- **Integration:** Node.js spawns Python process, parses JSON results
- **Timeout:** 60-second limit per video analysis

### Data Storage
- **Database:** PostgreSQL with Drizzle ORM
- **Schema Location:** `shared/schema.ts` defines all tables
- **Key Tables:**
  - `swing_analyses` - Stores analysis results linked to users
  - `pro_swing_examples` - Reference data for professional swing patterns
  - `users` / `sessions` - Replit Auth integration tables

### Authentication
- **Method:** Replit Auth (OpenID Connect)
- **Session Storage:** PostgreSQL via connect-pg-simple
- **Implementation:** Passport.js with custom Replit strategy

### Key Design Decisions

1. **Shared Schema Pattern:** Database schema and types are defined in `shared/` directory, accessible to both client and server for type safety.

2. **Swing Classification Logic:** The system uses frame-by-frame analysis to detect hip vs. hand movement timing, then classifies swings as:
   - Connected (hips first, small gap)
   - Early commit (hips first, large gap)
   - Arm-dominant swing (hands first)
   - Simultaneous start (no separation)

3. **Game Readiness Scoring:** Deterministic scoring starting at 100, with penalties for specific issues (early commit -30, arm-dominant -25, head drift -20, etc.)

4. **AI Explanation Layer:** After mechanical analysis, results are sent to OpenAI to generate coach-friendly explanations. AI explains, it doesn't decide.

5. **Build Configuration:** Custom ESBuild script bundles server dependencies to reduce cold start times. Specific packages are allowlisted for bundling.

## External Dependencies

### Third-Party Services
- **OpenAI API:** GPT-4o-mini for generating coaching explanations from analysis data
- **Replit Auth:** User authentication via OpenID Connect

### Database
- **PostgreSQL:** Required for all data persistence
- **Connection:** Via `DATABASE_URL` environment variable

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` - For AI explanations

### Replit Integrations
The app includes pre-built integration modules in `server/replit_integrations/`:
- **auth/** - Replit Auth setup and user management
- **audio/** - Voice chat utilities (available but not actively used)
- **chat/** - Conversation storage for AI chat features
- **image/** - Image generation utilities
- **batch/** - Batch processing with rate limiting

### Key npm Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `openai` - AI API client
- `multer` - File upload handling
- `passport` / `express-session` - Authentication
- `@tanstack/react-query` - Data fetching
- `framer-motion` - Animations