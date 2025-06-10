# Whiteboard

A collaborative whiteboard app built with Next.js, tldraw, neon db, prisma and Clerk authentication.

## Getting Started

1. **Clone and install**
   ```bash
   git clone git@github.com:SoumyadipGhosh23/realtime-whiteboard.git
   cd whiteboard2
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=your_neon_database_url
   NODE_ENV=development
   ```

3. **Set up the database**
   ```bash
   npm run prisma:push
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) and start drawing!

## What you'll need

- A [Clerk](https://clerk.com) account for authentication
- A [Neon](https://neon.tech) database for data storage
