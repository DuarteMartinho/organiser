# Football Dashboard Setup Guide

## Getting Started

This is a Next.js application with Supabase integration for your football match organizer.

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up the Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `docs/schema.sql` into the SQL Editor
4. Run the SQL to create all the tables

### 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Google OAuth:
   - Toggle "Enable Google provider"
   - Add your Google OAuth credentials
3. Enable GitHub OAuth (optional):
   - Toggle "Enable GitHub provider"  
   - Add your GitHub OAuth credentials
4. Add your site URL to allowed redirect URLs:
   - Add `http://localhost:3000/auth/callback` for development
   - Add your production URL when deploying

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── auth/            # Authentication routes
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # Reusable components
│   ├── auth/           # Authentication components
│   └── ui/             # UI components
├── lib/                # Utility libraries
│   ├── supabase/       # Supabase client configurations
│   └── utils.ts        # Utility functions
└── types/              # TypeScript type definitions
    └── database.types.ts # Database types
```

## Database Schema

Your database includes the following tables:
- `users` - User accounts
- `groups` - Football groups/organizations
- `group_admins` - Group administrators
- `group_members` - Group membership
- `team_players` - Group-specific player profiles
- `matches` - Football matches
- `teams` - Teams within matches
- `match_players` - Players in specific matches
- `match_waiting_list` - Waiting list for full matches
- `player_match_stats` - Match statistics

## Next Steps

1. **Customize the UI**: Modify components in `src/components/`
2. **Add Features**: Implement group management, match creation, etc.
3. **Deploy**: Deploy to Vercel for easy hosting with Supabase

## Useful Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)