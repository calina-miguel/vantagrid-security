# Eshme-Commerce

Eshme-Commerce helps aspiring sellers organize the work of launching and operating an online store. It combines sourced niche research, supplier term comparison, product records, channel planning, campaigns, leads, conversations, orders, and subscriber consent in one workspace.

The public site explains the service and its current pricing. Signed-in records are stored per account with Netlify Identity and Netlify Blobs. Store and social integrations are shown as manual workflows until their platform credentials and approvals are configured. Payment processing is inactive; the Payments area records transactions manually.

## Development

Requires Node.js 22.13 or newer. Install dependencies with `npm ci` and start a local server with `npm run dev`. The local server uses a development-only seller account and in-memory records. Build with `npm run build`.

Production hosting uses Netlify. Enable Identity on the Netlify project before inviting sellers; Identity confirms new accounts by email by default. The records API scopes every operation to the authenticated user and stores records in the `seller-records` Blob store. Netlify's free plan has usage limits and may pause access when its monthly allocation is exhausted.

## Current service terms

The first 30 days are free. Subscription pricing is coming soon. Access remains free until billing is enabled, and no payment method is required. External stores, marketing tools, and payment providers may have their own fees.
