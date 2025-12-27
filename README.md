# Moment Project

A tutorial/demo project for learning and exploring the **Cloudflare stack** with Next.js.

## About This Project

This project serves as a hands-on demonstration of integrating various Cloudflare services into a Next.js application. It's designed for developers who want to learn how to leverage Cloudflare's platform for building modern web applications.

### Cloudflare Services Used

- **D1** - Cloudflare's serverless SQL database
- **R2** - Object storage compatible with S3
- **Turnstile** - Bot protection and CAPTCHA alternative

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Cloudflare Wrangler

This project uses Cloudflare Wrangler for deployment and D1 database management.

### Upgrade Wrangler

To upgrade Wrangler to the latest version:

```bash
yarn upgrade wrangler --latest
```

Verify the installation:

```bash
yarn wrangler --version
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare

This project is designed to be deployed on Cloudflare Pages with Workers integration.

To learn more about deploying Next.js on Cloudflare:

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

## Learn More About Cloudflare

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
