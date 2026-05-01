<div align="center">
  <img src="public/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="UntitledCharts Logo" width="120" height="120" />

  # UntitledCharts Frontend
  
  <p>
    <b>A Sonolus Community Chart Server</b>
  </p>

  <p>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
  </p>
</div>

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# (Required) Backend API base URL — no trailing slash
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# (Required) Public URL of this frontend — used for OG images, embeds, share links
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com

# (Required) Sonolus server URL — used for deep-linking into the Sonolus app
NEXT_PUBLIC_SONOLUS_SERVER_URL=https://your-sonolus-server.com
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Base URL of the UntitledCharts backend API |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of the frontend (for OG images & embeds) |
| `NEXT_PUBLIC_SONOLUS_SERVER_URL` | ✅ | Sonolus server URL for deep-linking |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Styling**: Native CSS Modules & Global Styles
- **OG Generation**: `next/og` (Satori)

---
