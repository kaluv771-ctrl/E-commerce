# Olive & Oak — Full-stack E-commerce

A React + Express + Supabase shopping application with product browsing, persistent cart, Supabase Auth, Paystack checkout, order tracking, and an admin dashboard.

## Stack
- React + Vite + Tailwind CSS
- Node.js + Express REST API
- Supabase PostgreSQL, Auth, and Storage
- Paystack payments (NGN)
- Railway deployment

## 1. Requirements
- Node.js 20 or newer
- npm
- A Supabase project
- A Paystack account (use test keys during development)

## 2. Install
From the project root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Copy the example environment files:
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```
On Windows PowerShell, use `Copy-Item client/.env.example client/.env` and `Copy-Item server/.env.example server/.env`.

Fill in the Supabase project URL and anon key in `client/.env`. Fill in the Supabase URL, anon key, service-role key, and Paystack test secret in `server/.env`. Never put the Supabase service-role key or Paystack secret in the client environment.

## 3. Set up Supabase
1. Open Supabase Dashboard → SQL Editor.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Run `supabase/seed.sql` to add demo categories and products.
4. In Authentication → URL Configuration, add your local frontend URL (`http://localhost:5173`) to the allowed redirect URLs.
5. Keep the service-role key private. It is only used by the Express server.

To make an administrator, register a normal user first, then run this SQL in the Supabase SQL Editor, replacing the email:
```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```
Never allow public signup to choose its own role.

## 4. Run locally
```bash
npm run dev
```
Frontend: `http://localhost:5173`  
API: `http://localhost:4000`  
Health check: `http://localhost:4000/health`

## 5. Paystack webhook
Set your Paystack webhook URL to:
`https://YOUR-RAILWAY-API-DOMAIN/api/payments/paystack/webhook`

The server verifies the webhook HMAC signature and independently verifies the transaction with Paystack before marking the order paid.

## 6. Railway deployment
Create a GitHub repository and push this project. In Railway, create a project from the repository and add two services:

### API service
- Root directory: `/server`
- Build command: `npm install`
- Start command: `npm start`
- Variables:
  - `NODE_ENV=production`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PAYSTACK_SECRET_KEY`
  - `CLIENT_URL=https://YOUR-FRONTEND-DOMAIN`

### Web service
- Root directory: `/client`
- Build command: `npm install && npm run build`
- Static hosting: serve the `dist` directory using Railway's static deployment option or a static server.
- Variables:
  - `VITE_API_URL=https://YOUR-API-DOMAIN/api`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Vite variables are embedded at build time. Set them before deploying/redeploying the frontend. Configure SPA fallback so unknown paths serve `index.html`.

## 7. Important implementation notes
- The browser stores a local cart for convenience. The checkout endpoint recalculates all prices and stock from Supabase; it never trusts client totals.
- Order creation and inventory reservation use a PostgreSQL function so the operation is atomic.
- The Paystack amount is sent in kobo and verified on the server.
- Customer order endpoints scope queries to the authenticated user.
- Admin routes check the user's profile role on the server.

## 8. Before production
This is a working starter foundation, not a substitute for a full production security review. Before taking real payments:
- Add automated tests for checkout, stock reservation, authentication, and webhook replay/idempotency.
- Add a payment reconciliation process and explicit failed-payment stock release policy.
- Configure email templates and production redirect URLs in Supabase.
- Add shipping rates, delivery provider integration, privacy policy, terms, returns/refunds, and customer support details.
- Review RLS policies and storage upload permissions.
- Add product image upload UI and richer admin product CRUD.
- Add monitoring, backups, and alerting.
- Test Paystack test-mode flows end-to-end before switching to live credentials.

## API overview
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/categories`
- `POST /api/checkout`
- `POST /api/checkout/verify`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders/:id/tracking`
- `GET /api/admin/dashboard`
- `PUT /api/admin/orders/:id/status`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
