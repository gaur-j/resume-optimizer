# Resume Optimizer

AI-powered resume optimizer that tailors your resume to a specific job description by improving ATS compatibility, keyword matching, and bullet point quality.

Upload your resume, paste a job description, and get an ATS-friendly, role-specific version that improves keyword matching, readability, and impact.

[Live Demo](https://ai-resum-optimizer.vercel.app/) · [Troubleshooting](public/troubleshooting/pdf-parse-vercel-fix.md) · [Report Bug](.github/ISSUE_TEMPLATE/bug_report.yml) · [Request Feature](.github/ISSUE_TEMPLATE/feature_request.yml)

---

## Why this project exists

Most resumes are too generic.

That leads to:

- weak ATS matching
- poorly targeted bullet points
- missed recruiter attention
- wasted time rewriting the same resume for every job

Resume Optimizer helps job seekers quickly turn one resume into many role-specific versions without starting from scratch.

---

## What it does

- Parses uploaded resumes
- Analyzes job descriptions
- Suggests keyword and content improvements
- Rewrites weak bullet points into stronger, impact-driven bullets
- Produces a more ATS-friendly version
- Supports export and reuse across applications

---

## Screenshots

### Home

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/public/screenshots/home-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/public/screenshots/home-light.png">
  <img alt="Home screenshot" src="/docs/screenshots/home-light.png">
</picture>

### Upload Page

![Upload_Page](/public/screenshots/upload-page.png)

### Upload Resume

![Upload](/public/screenshots/resume-upload.png)

### Job Description

![Description](/public/screenshots/job-description.png)

### Optimized Result

![Result](/public/screenshots/analyzer.png)

---

## How it works

1. Upload your resume
2. Paste a job description
3. Review optimization suggestions
4. Export the tailored resume
5. Reuse it for that specific application

---

## Core features

- Resume upload
- Job description parsing
- ATS-oriented optimization
- Bullet rewriting
- Keyword matching
- Clear before/after improvements
- Fast, simple UI
- Mobile-friendly layout

---

## Tech stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- Shadcn UI
- Sonner
- PDF Parser
- AI service: Grok, Gemini

---

## Project structure

```bash id="7sbdq"
app/          # Routes and pages
components/   # Reusable UI components
lib/          # Utilities and services
public/       # Static assets
types/        # Shared TypeScript types
```

---

## Getting started

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn

### Install

```bash id="k3waz"
git clone https://github.com/gaur-j/resume-optimizer.git
cd resume-optimizer
npm install
```

### Environment variables

Create a `.env.local` file:

```bash id="k9mde"
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANN_KEY
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_ROLE_KEY
```

### Run locally

```bash id="0kq91"
npm run dev
```

Open `http://localhost:3000`.

---

## Pricing

### Free

- limited resume optimizations
- basic tailoring
- standard export

### Pro

- unlimited optimizations
- stronger AI rewrites
- resume history
- premium export options
- job-specific tailoring

### Team / Career Services

- multi-user access
- shared admin view
- usage analytics
- support for recruiters, bootcamps, or universities

---

# Roadmap

## Phase 1 — MVP

- [x] Resume upload
- [x] Job description input
- [x] AI optimization
- Export flow

## Phase 2 — Product polish

- Resume history
- ATS scoring
- Better UI/UX
- Saved sessions

## Phase 3 — Monetization

- Free tier limits
- Pro subscription
- Payment integration
- Usage analytics

## Phase 4 — Expansion

- Cover letters
- LinkedIn optimization
- Application tracker
- Recruiter tools

---

## FAQ

### Q1 Is my resume data safe?

A: Your resume text is stored only in your account and is never shared, sold, or used to train models beyond generating your own analysis.

### Q2 What ATS systems does this work for?

A: We test against patterns used by the most common platforms Indian companies use, including Workday, Greenhouse, and Naukri's internal parsing.

### Q3 What file types are supported?

A: PDF TYPE

### Q4 Does it help freshers?

A: Yes. It should work for freshers and experienced candidates.

### Q5 Is there really no score cap or hidden fee?

A: Your 3 free scans are genuinely free — no card required. After that, you pay only for the scans you use, with no recurring subscription.

### Q6 How is this different from just using ChatGPT?

A: We combine ATS-specific scoring logic with AI rewriting, so you get a structured score and gap analysis, not just a generic opinion.

---

## Contributing

Contributions are welcome.

See `CONTRIBUTING.md` before opening a pull request.

---

## Security

If you find a security issue, report it privately through `SECURITY.md`.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
