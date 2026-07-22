# Resume Optimizer

Tailor your resume to a specific job description in minutes.

Upload your resume, paste a job description, and get an ATS-friendly, role-specific version that improves keyword matching, readability, and impact.

[Live Demo](https://ai-resum-optimizer.vercel.app/) · [Documentation](#) · [Report Bug](#) · [Request Feature](#)

---

## Why this project exists

Most resumes are too generic.

That leads to:

* weak ATS matching
* poorly targeted bullet points
* missed recruiter attention
* wasted time rewriting the same resume for every job

Resume Optimizer helps job seekers quickly turn one resume into many role-specific versions without starting from scratch.

---

## What it does

* Parses uploaded resumes
* Analyzes job descriptions
* Suggests keyword and content improvements
* Rewrites weak bullet points into stronger, impact-driven bullets
* Produces a more ATS-friendly version
* Supports export and reuse across applications

---

## Screenshots

Add screenshots before launch.

### Home

![Home](./public/screenshots/home.png)

### Upload Resume

![Upload](./public/screenshots/upload.png)

### Optimized Result

![Result](./public/screenshots/result.png)

---

## How it works

1. Upload your resume
2. Paste a job description
3. Review optimization suggestions
4. Export the tailored resume
5. Reuse it for that specific application

---

## Core features

* Resume upload
* Job description parsing
* ATS-oriented optimization
* Bullet rewriting
* Keyword matching
* Clear before/after improvements
* Fast, simple UI
* Mobile-friendly layout

---

## Tech stack

* Next.js
* TypeScript
* React
* Tailwind CSS
* Node.js
* AI service: Grok, Gemini

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

* Node.js 18+
* npm, pnpm, or yarn

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
```

### Run locally

```bash id="0kq91"
npm run dev
```

Open `http://localhost:3000`.

---

## Pricing

### Free

* limited resume optimizations
* basic tailoring
* standard export

### Pro

* unlimited optimizations
* stronger AI rewrites
* resume history
* premium export options
* job-specific tailoring

### Team / Career Services

* multi-user access
* shared admin view
* usage analytics
* support for recruiters, bootcamps, or universities

---

# Roadmap

## Phase 1 — MVP
- Resume upload
- Job description input
- AI optimization
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

### Is my resume stored?

Document the storage policy here.

### Is this free?

Add your free and paid limits here.

### What file types are supported?

Document supported formats here.

### Does it help freshers?

Yes. It should work for freshers and experienced candidates.

---

## Contributing

Contributions are welcome.

See `CONTRIBUTING.md` before opening a pull request.

---

## Security

If you find a security issue, report it privately through `SECURITY.md`.

---

## License

Add a license before launch.
