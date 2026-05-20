This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Railway (Recommended)

1. Create a Railway project and add a MongoDB (Atlas) add-on or connect an external MongoDB Atlas cluster.
2. In Railway, set the following environment variables:
	- `DATABASE_URL` (MongoDB Atlas connection string)
	- `JWT_SECRET` (a strong random string)
	- `NODE_ENV=production`
	- `PORT` (optional, Railway sets this automatically but `next start` uses 3000 by default)
4. Set Railway build and start commands:

	- **Build command:** `npm run build`
	- **Start command:** `npm start`

5. Ensure Railway has the environment variable `DATABASE_URL` before the build completes. The install step runs `prisma db push` which requires DB connectivity during build/postinstall. If you prefer to avoid running `prisma db push` during build, remove it from the `postinstall` script and run `npx prisma db push` manually after deployment.

6. Trigger a deploy. Railway will install dependencies, run `postinstall` (which runs `prisma generate && prisma db push`), build the Next.js app, and start it.
3. Connect your GitHub repository to Railway and set the build command to `npm run build` and the start command to `npm start`.
4. Ensure the `postinstall` script runs (`prisma generate`) or run `npx prisma generate` in the build step.

The app should be live once Railway finishes the build and deployment.

## Local development with Postgres (recommended)

This project uses PostgreSQL in production. For local development you can run Postgres using Docker Compose:

```bash
docker compose up -d
```

Then set your environment variables in a `.env` file (copy from `.env.example`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskmanager
JWT_SECRET=something_secure_local
NODE_ENV=development
```

Install dependencies and generate Prisma client:

```bash
npm install
npm run prisma:generate
```

Run migrations (first time):

```bash
npm run prisma:migrate:dev -- --name init
```

Start the dev server:

```bash
npm run dev
```

If you prefer SQLite for quick tests, you can change the `datasource` in `prisma/schema.prisma` back to `sqlite` and set `DATABASE_URL="file:./dev.db"`, then run `npm run prisma:migrate:dev`.
