# metro-query-view

A small Vite + React + TypeScript app that uses Supabase to run SQL queries and render charts. It's built with shadcn UI and TailwindCSS.

## Features

- Query a Supabase database and visualize results with Recharts
- Client-side Supabase integration using publishable (anon) key
- Example serverless function under `supabase/functions/generate-chart`
- Tailwind + shadcn UI components

---

## Requirements

- Node.js 18+ (or your project's preferred version)
- pnpm, npm, or yarn (package manager of your choice)
- A Supabase project (for the database and API keys)

---

## Local setup

1. Clone the repo

```powershell
git clone <YOUR_REPO_URL>
cd metro-query-view
```

2. Install dependencies

```powershell
npm install
# or pnpm install
# or yarn
```

3. Copy the example env and set your Supabase values

Create a local `.env` file in the project root (this file is ignored by git).

```powershell
# .env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

4. Start the dev server

```powershell
npm run dev
```

Then open http://localhost:5173 (or the Vite URL printed in your terminal).

---

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — produce a production build
- `npm run build:dev` — build with development mode
- `npm run preview` — locally preview the production build
- `npm run lint` — run ESLint

---

## Environment & Secrets

- This project uses a Supabase anon (publishable) key client-side. The anon key is safe for public client usage only when your Supabase Row Level Security (RLS) and policies are correctly configured.
- Never commit service_role keys or other private credentials into the repository.
- `.env` is added to `.gitignore`. If you accidentally pushed secrets, rotate them immediately in the Supabase Dashboard (Project → Settings → API → Rotate keys) and consider purging them from git history.

---

## Deployment

You can deploy any static host that supports Vite builds (Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.). Ensure environment variables are configured in the host's dashboard.

Example (Vercel):
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` in Project Settings → Environment Variables.
- Connect the repo and let Vercel run the build step.

---

## Supabase notes

- If a key was exposed, rotate both anon and service_role keys in the Supabase dashboard.
- For services (server functions) that need elevated access use the `service_role` key on the server only — never in client code.

---

## Contributing

- Open an issue or PR for any bugfixes or features.
- Keep secrets out of PRs. Use environment variables and secrets in CI/CD.

---

## License

This project does not include a license file. Add one if you intend to open-source it.
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8a298cca-5b55-4628-844e-0ac3e3366881

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8a298cca-5b55-4628-844e-0ac3e3366881) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8a298cca-5b55-4628-844e-0ac3e3366881) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
