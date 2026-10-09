# Integrated branch validation

All eight feature branches share the validated develop baseline: compliance, iam, inventory, maintenance, profiles, rentals, shared and subscriptions. Their original commits remain in history; synchronizing branches does not change their authors.

The integrated application connects every context through app.services.js and app.routes.js, provides all API endpoint paths and seeds the mock API collections required by those endpoints. Initial users and profiles remain empty. Test registrations and transactions use a separate database under .test-runtime and never write to server/db.json.

The runtime uses Vue and JavaScript, Pinia, Axios and the MIT release of PrimeVue 4. The responsive layout incorporates the compact logo, text and spacing changes. Registration role selection, regional locale preferences, profile keyboard focus and the public terms page remain available.

Before merging develop into main, run:

```powershell
npm ci
npm test
npm run test:e2e
npm run build
```

Browser validation covers registration, sign-in, profile editing and persistence for both company roles; plan selection; machinery creation and editing with USD preserved; rental and maintenance navigation; and the full request, approval, delivery and return workflow. It also checks for unexpected API failures and JavaScript exceptions. Unit tests cover IAM, profiles, subscriptions, monetary validation, HTTP cancellation and locale preferences.

These checks validate the mock API setup. They do not certify deployment against a production backend or exhaustively cover every maintenance and incident operation.

New commits and PR titles use English Conventional Commits. Previously published messages are preserved because translating them changes shared commit identifiers.

After saving or committing your local work in WebStorm, update your assigned branch:

```powershell
git fetch origin
git merge --ff-only "origin/$(git branch --show-current)"
```

If the merge reports divergent history, stop and review your local commits before merging normally. Do not discard your changes or force push. Future changes go through feature branch PRs into develop; main receives the tested integration through its own PR.
