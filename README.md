# UtopiaHire

An AI-powered hiring platform that connects job seekers with employers through intelligent matching, AI-assisted resume building, and automated candidate analysis.

## 🚀 Features

### For Job Seekers
- **AI-Powered Resume Builder**: Create professional resumes with AI assistance
- **Profile Feedback**: Get personalized AI insights on your profile strength
- **Smart Job Matching**: Discover jobs that match your skills and preferences
- **AI Interview Practice**: Prepare for interviews with AI-generated questions
- **Application Tracking**: Monitor all your job applications in one place

### For Recruiters
- **Organization Management**: Create and manage multiple organizations
- **Job Posting**: Easily post and manage job openings
- **AI Candidate Analysis**: Get detailed AI insights on each candidate
  - Experience & skills matching
  - Strength analysis
  - Interview question suggestions
  - Hiring recommendations
- **Application Management**: Track and update candidate statuses

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, Server Components)
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **File Storage**: Supabase Storage

## 📋 Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Google Gemini API key

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_KEY=your_gemini_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/seif2003/utopiahire.git
cd utopiahire

# Install dependencies
npm install
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in the `supabase/migrations` folder
3. Set up your environment variables

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
utopiahire/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── auth/                 # Authentication pages
│   ├── main/                 # Main application pages
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── ui/                   # UI components (shadcn)
│   └── resume-steps/         # Resume builder steps
├── lib/                      # Utility functions
│   ├── client.ts             # Supabase client
│   ├── server.ts             # Supabase server
│   └── gemini.ts             # Gemini AI integration
├── types/                    # TypeScript type definitions
├── supabase/                 # Supabase configuration
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

## 🔑 Key Features Implementation

### AI Candidate Analysis
Each job application can be analyzed individually with AI to provide:
- Quick summary of candidate fit
- Experience and skills matching analysis
- Top strengths identification
- Potential concerns
- Suggested interview questions
- Hiring recommendation

### Resume Generation
- Step-by-step resume builder
- AI-powered content suggestions
- LaTeX resume compilation
- PDF export

### Profile Management
- Comprehensive profile with experiences, education, skills
- Projects and certifications
- Language proficiency
- Work preferences and values
- AI feedback on profile completeness

## 🔒 Authentication

The app uses Supabase Authentication with:
- Email/Password sign up and login
- Password reset functionality
- Onboarding flow for new users
- Protected routes with middleware

## 🗄️ Database Schema

Main tables:
- `profiles` - User profiles
- `experiences` - Work experience
- `education` - Educational background
- `skills` - User skills
- `projects` - Portfolio projects
- `certifications` - Professional certifications
- `languages` - Language proficiency
- `values_and_preferences` - Job preferences
- `organizations` - Employer organizations
- `job_offers` - Job postings
- `job_applications` - Applications submitted

## 🔄 n8n Workflows

The `n8n/` folder contains automated workflow definitions for n8n (workflow automation tool):

- **Add Job.json** - Workflow for automated job posting
- **Delete old resume.json** - Cleanup workflow for outdated resumes
- **Get jobs.json** - Job fetching and synchronization workflow
- **Resume creator.json** - Automated resume generation workflow
- **Resume reader.json** - Resume parsing and data extraction workflow
- **resume update.json** - Resume update automation
- **Summarize.json** - Content summarization workflow

These workflows can be imported into your n8n instance to automate various platform tasks and integrations.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [n8n Workflow Automation](https://n8n.io)

---

Built with ❤️ using Next.js and Supabase