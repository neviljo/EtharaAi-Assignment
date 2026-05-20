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

1. Create a Railway project and add a MongoDB add-on or connect an external MongoDB Atlas cluster.
2. In Railway, set the following environment variables:
   - `DATABASE_URL` (MongoDB Atlas connection string)
   - `JWT_SECRET` (a strong random string)
   - `NODE_ENV=production`

3. Set Railway build and start commands:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`

4. Ensure Railway has `DATABASE_URL` available before the build/install step completes. The `postinstall` script runs `prisma db push`, which requires DB connectivity during install.

5. Trigger a deploy. Railway will install dependencies, run `postinstall` (`prisma generate && prisma db push`), build the app, and start it.

The app should be live once Railway finishes deployment.

## Local development with MongoDB

For local development, use a MongoDB Atlas connection string or a local MongoDB instance.

Example `.env` values:

```bash
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority"
JWT_SECRET=something_secure_local
NODE_ENV=development
```

Install dependencies and generate the Prisma client:

```bash
npm install
npm run prisma:generate
```

If you need to push Prisma schema to the database locally:

```bash
npx prisma db push
```

Run the dev server:

```bash
npm run dev
```

If you want a temporary local MongoDB instance instead of Atlas, set:

```bash
DATABASE_URL="mongodb://127.0.0.1:27017/taskmanager"
```

then run `npm install`, `npm run prisma:generate`, and `npm run dev`.

