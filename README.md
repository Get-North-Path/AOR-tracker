# 🍁 AORTrack

![AORTrack   banner](public/Mountain.png)

> **Real PR timelines from the community   not only IRCC’s generic estimate.**

**Free, open-source Canadian PR processing tracker**   built for applicants, by applicants (and maintained with care by [GetNorthPath](https://www.getnorthpath.com)). AORTrack turns crowd-sourced milestones into timelines you can compare by **AOR date, stream, and province**, so you see where you sit relative to people on a similar path.

[![Live app](https://img.shields.io/badge/Live-track.getnorthpath.com-blue?style=flat-square)](https://track.getnorthpath.com)
[![GitHub](https://img.shields.io/badge/GitHub-Get--North--Path%2FAOR--tracker-181717?style=flat-square&logo=github)](https://github.com/Get-North-Path/AOR-tracker)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](https://github.com/Get-North-Path/AOR-tracker/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Community-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/aortrack)

<p align="center">
  <img src="public/Logo-text.png" alt="AORTrack wordmark" width="300" />
</p>

---

## 🚀 What we do

AORTrack is a **community-powered** companion for **Canadian permanent residency** processing: you (and others) share milestone dates, and the app aggregates patterns so everyone gets **clearer expectations** than a one-size-fits-all IRCC bar.

We do **not** replace IRCC, lawyers, or consultants   we **surface what the community is actually experiencing**, including delays, stream differences, and outliers worth knowing about.

![AORTrack   from AOR onward](public/animation-text.png)

---

## ✨ Key features

| Feature | Description |
| --- | --- |
| 📅 **AOR-based cohorts** | Compare timelines with people who share your **AOR window**, stream, and province |
| 📈 **Processing stats** | Aggregate views of how milestones cluster over time across the community |
| 🧭 **Milestone tracking** | Follow the journey from AOR through stages the community reports (e.g. biometrics, medicals, PPR) |
| 🔗 **Shareable timelines** | Generate a link others can view   useful for friends, forums, or your own records |
| 🧑‍🤝‍🧑 **Community hub** | Connect with others on similar timelines; live updates via **Socket.io** |
| 🗺️ **Public roadmap** | Vote and follow what ships next   development happens in the open |
| 📜 **Changelog** | Release history in [Keep a Changelog](https://keepachangelog.com/) style |
| 🛡️ **Privacy-minded** | **No ads**, no paywall for core tracking; open source so you can audit behavior |

---

## ⚡ How it works

```
1. Open AORTrack          →  No signup required to explore
2. Enter your context     →  AOR date, stream, province (and milestones if you share)
3. See community patterns →  Timelines & stats from real applicants
4. (Optional) Share       →  A read-only link for your PR timeline
5. Stay in the loop       →  Discord, GitHub issues, and roadmap for what’s next
```

---

## 🛠️ Tech stack

Built to stay fast and transparent at the edge of a messy, real-world dataset:

- **[Next.js](https://nextjs.org) 16**   App Router, server components where it fits
- **[React](https://react.dev) 19** + **[Tailwind CSS](https://tailwindcss.com) 4**   UI
- **[MongoDB](https://www.mongodb.com/)**   Application data and aggregates
- **[Socket.io](https://socket.io/)**   Realtime community updates (custom `server.mjs` in dev/prod)
- **TypeScript**   End-to-end typing

---

## 🗺️ Who it’s for

- **PR applicants in Canada or abroad** who want **signal from peers**, not only official averages  
- **Forum & community moderators** who need a **neutral, linkable stats layer** for discussions  
- **Developers** who want to **fork, extend, or self-host** a transparent tracker  

> *“Not affiliated with IRCC. Data is crowd-sourced from community members and not official government data.”*  
>   See also the in-app disclaimer on [track.getnorthpath.com](https://track.getnorthpath.com)

---

## 🔗 Links

### AORTrack (this app)

- 🌐 **Live tracker:** [track.getnorthpath.com](https://track.getnorthpath.com)
- ▶️ **Start tracking:** [track.getnorthpath.com/track](https://track.getnorthpath.com/track)
- 📊 **Dashboard:** [track.getnorthpath.com/dashboard](https://track.getnorthpath.com/dashboard)
- 🧑‍🤝‍🧑 **Community:** [track.getnorthpath.com/community](https://track.getnorthpath.com/community)
- 🗺️ **Roadmap:** [track.getnorthpath.com/roadmap](https://track.getnorthpath.com/roadmap)
- 📜 **Changelog:** [track.getnorthpath.com/changelog](https://track.getnorthpath.com/changelog)
- 💬 **Discord:** [discord.gg/aortrack](https://discord.gg/aortrack)
- ⭐ **Star on GitHub:** [github.com/Get-North-Path/AOR-tracker](https://github.com/Get-North-Path/AOR-tracker)

### GetNorthPath (parent org)

- 🏠 **Website:** [getnorthpath.com](https://www.getnorthpath.com)
- 🛤️ **Pathways:** [getnorthpath.com/pathways](https://www.getnorthpath.com/pathways)
- 📖 **Blog:** [getnorthpath.com/blog](https://www.getnorthpath.com/blog)
- 📞 **Contact:** [getnorthpath.com/contact?utm_source=aortrack](https://www.getnorthpath.com/contact?utm_source=aortrack)

### Legal (GetNorthPath policies)

- 🔏 **Privacy:** [getnorthpath.com/privacy](https://www.getnorthpath.com/privacy)
- 📄 **Terms:** [getnorthpath.com/terms](https://www.getnorthpath.com/terms)
- 🍪 **Cookies:** [getnorthpath.com/cookies](https://www.getnorthpath.com/cookies)

---

## 💻 Local development

**Requirements:** Node.js 20+ and MongoDB (local or Atlas).

```bash
git clone https://github.com/Get-North-Path/AOR-tracker.git
cd AOR-tracker
npm install
```

Environment (minimum):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Optional database name (default: `aor-tracker-dev`) |
| `NEXT_PUBLIC_SITE_URL` | Optional   canonical origin for sitemap / metadata (e.g. `https://track.getnorthpath.com`; defaults to production URL or `VERCEL_URL`) |
| `CRON_SECRET` | Protects cron routes in production |
| `DISCORD_WEBHOOK_URL` | Optional   profile/milestone activity plus **ops** alert when a new `cohort_stats` placeholder row is created (run cohort sync to fill medians) |

```bash
npm run dev          # Next.js + Socket.io (server.mjs)
npm run dev:next     # Next.js only
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📦 Releasing

Version tags trigger a **draft** GitHub Release via CI (Keep a Changelog notes from merged PRs since the previous tag).

```bash
git tag v0.1.8
git push origin v0.1.8
```

1. GitHub Actions creates a draft release for that tag.
2. Open **GitHub → Releases**, review or edit the notes.
3. Click **Publish release** — `/changelog` and `/roadmap` pick it up on the next cache refresh.

Preview notes locally:

```bash
TAG=v0.1.8 node scripts/draft-release-from-tag.mjs --dry-run
```

---

## 🤝 Contributing

We welcome **issues, PRs, and design feedback** on GitHub.

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — how to open issues, branch naming, commit format, and PR rules
- **[Open an issue yourself](https://github.com/Get-North-Path/AOR-tracker/issues/new/choose)** before opening a PR (required)
- **[SECURITY.md](SECURITY.md)** — report vulnerabilities to info@getnorthpath.com (not public issues)
- **[Discord](https://discord.gg/aortrack)** — informal discussion and release chatter

---

## 📄 License

**MIT License**   see [`LICENSE`](LICENSE) in this repository when present.

© GetNorthPath Inc. · AORTrack is free and open source. Not affiliated with IRCC. Community data only; processing times are **estimates** from crowd-sourced reports, not official government figures.

---

<p align="center">
  <strong>Clearer timelines for everyone on the path north. 🍁</strong>
</p>
