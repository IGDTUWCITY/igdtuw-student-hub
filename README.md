# IGDTUW Student Hub

A comprehensive student portal for IGDTUW (Indira Gandhi Delhi Technical University for Women) providing centralized access to academics, campus information, opportunities, and more.

## Project Structure

This is a monorepo containing:
- **Frontend** (`/frontend`): React + TypeScript + Vite application
- **Backend** (`/backend`): Node.js + Express API with AI-powered features

## Technologies Used

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Supabase** - Authentication and database
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type-safe backend code
- **Supabase** - PostgreSQL database with RLS
- **Google Gemini AI** - AI-powered opportunity discovery
- **node-cron** - Scheduled tasks for data refresh

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: install via [nvm](https://github.com/nvm-sh/nvm))
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd igdtuw-student-hub
```

2. Install frontend dependencies:
```sh
cd frontend
npm install
```

3. Install backend dependencies:
```sh
cd ../backend
npm install
```

### Environment Setup

1. Create `frontend/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:3001
```

2. Create `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
FRONTEND_URL=http://localhost:8080
```

### Running the Project

1. Start the frontend (from `/frontend`):
```sh
npm run dev
```
Frontend will run on `http://localhost:8080`

2. Start the backend (from `/backend`):
```sh
npm run dev
```
Backend will run on `http://localhost:3001`

## Features

- 🔐 **Authentication** - Secure login/signup with Supabase Auth
- 📚 **Academics** - Course materials, timetables, and resources
- 🏫 **Campus** - Campus information and facilities
- 🎯 **Opportunities** - AI-curated internships, scholarships, and events
- ⚙️ **Settings** - Profile management and preferences
- 📱 **Responsive Design** - Works on all devices
- Available on both dark and light mode as per convenience

## Deployment

### Frontend
Deploy to Vercel, Netlify, or any static hosting:
```sh
cd frontend
npm run build
# Deploy the 'dist' folder
```

### Backend
Deploy to Railway, Render, or any Node.js hosting:
```sh
cd backend
npm run build
# Deploy with 'npm start'
```

## Database Schema

The project uses Supabase (PostgreSQL) with the following main tables:
- `profiles` - User profiles and metadata
- `opportunities` - Internships, scholarships, events (planned)
- `subjects` - Course information (planned)
- `societies` - Student societies and clubs (planned)

## Contributing

This is a student project for IGDTUW. Contributions and suggestions are welcome!

## License

MIT
