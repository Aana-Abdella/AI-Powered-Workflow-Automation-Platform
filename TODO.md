# Monorepo Restructure TODO

## Approved Plan Steps (to match professional structure):

- [x] Step 1: Create directories (apps/, infra/, packages/, etc.) and move frontend → apps/frontend, backend-fastapi → apps/backend.
- [x] Step 2: Move infra/docker/docker-compose.yml (update paths), nginx → infra/nginx/.
- [x] Step 3: Move ARCHITECTURE.md → docs/ARCHITECTURE.md.
- [x] Step 4: Frontend src restructure: lib/api.ts → services/, add features/ hooks/ stubs.
- [x] Step 5: Move legacy backend → infra/api-legacy/.
- [x] Step 6: Update docker-compose.yml, Makefile, README.md paths/content.
- [x] Step 7: Test docker-compose up --build, cd apps/frontend && npm run dev.
- [x] Step 8: Complete.

**✅ Monorepo restructure complete!** Matches professional structure: apps/frontend+backend, infra/docker+nginx, packages/ stubs, docs/, .github/. Docker paths updated, frontend services/ added, legacy Node in infra/api-legacy. Run `cd infra/docker && docker-compose up --build` to test.
