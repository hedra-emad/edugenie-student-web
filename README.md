# EduGenie — Student Web App

The student-facing frontend for **EduGenie**, an AI-powered e-learning platform. Built with **Next.js** and **TypeScript** across **28 routes and 160+ components**, it delivers course discovery, the learning experience, and an AI study coach.

**Live:** https://edugenie-student-web.vercel.app
**Related:** [API](https://github.com/hedra-emad/edugenie-api) · [Admin dashboard](https://github.com/hedra-emad/edugenie-dashboard)

---

## Features

- **Course discovery** — browse courses, categories and instructors
- **Learning experience** — lesson player, progress tracking, notes, quizzes
- **AI study coach** — live chat, personalized learning roadmaps, practice and remediation
- **Onboarding & placement** — placement tests that tailor the roadmap to the learner
- **Authentication** — email/password, Google OAuth, email verification, password reset
- **Real-time notifications** over WebSockets
- **Checkout** — cart and Stripe-powered enrollment
- Fully responsive across mobile, tablet and desktop

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Data fetching | TanStack Query |
| Forms & validation | React Hook Form + Zod |
| Real-time | Socket.IO client |
| Animation | Framer Motion |
| Markdown | react-markdown |
| Icons | Lucide |
| Deployment | Vercel |

---

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

### Environment variables

```bash
NEXT_PUBLIC_API_URL=https://edugenie-api.vercel.app
NEXT_PUBLIC_SOCKET_URL=
```

### Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # lint
npm run test     # tests
```

---

## Project Structure

```
src/app/
├── (auth)/          # login, register, verify, reset password
├── (main)/          # authenticated shell
├── courses/         # catalog and course detail
├── learn/           # lesson player and progress
├── coach/           # AI study coach
├── roadmap/         # generated learning roadmaps
├── onboarding/      # placement flow
├── categories/  instructors/  about/
└── providers/       # query client, auth, socket providers
```

---

## Team

Built by a 5-developer team for the **ITI Intensive Code Camp — Full-Stack Web & Generative AI Development using MERN**.

Maintainer: [Hedra Emad](https://github.com/hedra-emad) — Team Leader
