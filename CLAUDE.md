# Project snapshot
**Solicitor Brain** – on‑prem, UK‑law AI clerk for small firms.  
Stack: Ubuntu 24.04 LTS · Python 3.11 · FastAPI backend · Next.js 15 frontend · PostgreSQL 15 · optional RX 6600 XT (ROCm 6.x) GPU.

## Purpose & guard‑rails
- Designed to meet 2025 SRA guidance; *never* issues unchecked legal advice.  
- Mandatory banner: *“AI outputs are organisational assistance only – verify before use.”*:contentReference[oaicite:6]{index=6}  
- Hallucination defence: every answer must cite paragraph‑level sources or it is blocked.  
- Sign‑off flow: **Suggested → Accepted / Amended / Rejected**.

## KPI targets
| Metric | Target |
|--------|--------|
| Auto‑file precision | ≥ 95 % |
| Email→case match | ≥ 90 % |
| Fact‑check precision | ≥ 97 % |
| Hallucination events | 0 |

## Coding standards
- **Backend**: *black* + *ruff* (strict, 120‑char lines).  
- **Frontend**: *eslint* + *prettier*, `tsconfig.json` with `"strict": true`.  
- Commits follow **Conventional Commits**.

## Directory map
- `/backend` FastAPI services  
- `/frontend` Next.js (TypeScript) SPA  
- `/scripts` setup, maintenance, cron helpers  
- `/docs` compliance & policy docs  
- `/tests` pytest + red‑team suites:contentReference[oaicite:7]{index=7}  

## Common commands
```bash
./scripts/setup_environment.sh      # install system deps & create venv
./scripts/start_services.sh         # launch backend + frontend
pytest tests/                       # unit tests
python scripts/red_team_test.py     # hallucination red‑team
./scripts/compliance_checker.sh     # SRA compliance run

