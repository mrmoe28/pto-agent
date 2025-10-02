# PTO Agent - Permit Office Search Platform

> Find electrical, building, plumbing, mechanical, and zoning permit offices across Georgia with comprehensive contact information, fees, and application requirements.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🎯 About

**PTO Agent** is a comprehensive SaaS platform that helps contractors, homeowners, and developers quickly find local permit offices in Georgia. The platform provides detailed information including:

- 📍 Exact office locations with Google Maps integration
- 📞 Contact information (phone, email, website)
- ⏰ Operating hours and appointment requirements
- 💰 Permit fees by type (building, electrical, plumbing, mechanical, zoning)
- 📋 Application instructions and required documents
- ⚡ Processing times for different permit types
- 🌐 Online portal availability and features

---

## ✨ Key Features

### 🔍 Intelligent Search
- **Google Places Autocomplete** for address suggestions
- **Multi-level search strategy**: Database → Fallback dataset → Web scraping
- **Jurisdiction analysis** (city vs county permits)
- **Distance-based sorting** using Haversine formula
- **Redis caching** (5-minute TTL) for fast results

### 📊 Comprehensive Data
- Complete permit office information (40+ fields)
- Permit fees, processing times, and instructions (JSONB)
- Online services availability (applications, payments, tracking)
- Staff directories and department divisions
- Downloadable application forms

### 💳 Subscription Plans
- **Free**: 1 search total
- **Pro** ($29/month): 40 searches/month + advanced filtering
- **Enterprise** ($99/month): Unlimited searches + exports + favorites

### 📥 Export Functionality
- PDF reports with jsPDF
- Excel spreadsheets with xlsx
- Enterprise plan required

### 🤖 Automated Data Collection
- Background web scraping when data missing
- Respect for robots.txt
- Confidence scoring (0.00-1.00)
- Automatic data updates (daily/weekly/monthly)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.2** with App Router
- **React 19.1.0**
- **TypeScript 5**
- **Tailwind CSS 4**
- **ShadCN UI** components
- **Framer Motion** animations

### Backend
- **NeonDB** (PostgreSQL serverless)
- **Drizzle ORM**
- **Upstash Redis** (caching & rate limiting)
- **Clerk** (authentication)
- **Stripe** (payments)

### APIs & Services
- **Google Places API** (autocomplete)
- **Google Geocoding API** (coordinates)
- **LocationIQ** (geocoding fallback)
- **Cheerio** (web scraping)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.11+ (≤22)
- npm 10+
- PostgreSQL database (NeonDB recommended)
- Clerk account
- Google Cloud Platform account (Maps/Places API)
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pto-agent.git
cd pto-agent
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Google APIs
GOOGLE_PLACES_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# LocationIQ (Fallback)
LOCATIONIQ_ACCESS_TOKEN=pk.xxx...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Run database migrations**
```bash
npm run migrate:db
```

5. **Seed Georgia counties (optional)**
```bash
npm run seed:ga-counties
```

6. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📁 Project Structure

```
pto-agent-main/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── permit-offices/  # Search endpoint
│   │   │   ├── geocode/         # Geocoding service
│   │   │   ├── subscription/    # Usage tracking
│   │   │   └── webhooks/        # Clerk/Stripe webhooks
│   │   ├── dashboard/         # User dashboard
│   │   ├── search/            # Search page
│   │   ├── pricing/           # Pricing plans
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # ShadCN components
│   │   ├── GooglePlacesAutocomplete.tsx
│   │   ├── GeorgiaCountySelector.tsx
│   │   ├── SimplePermitOfficeDisplay.tsx
│   │   └── ...
│   └── lib/                  # Utilities
│       ├── neon.ts           # Database client
│       ├── subscription-utils.ts
│       └── cache.ts
├── database/                  # Database files
│   ├── migrations/           # SQL migrations
│   └── seeds/                # Seed data
├── scripts/                   # Utility scripts
├── public/                    # Static assets
└── package.json
```

---

## 🎨 Key Pages

- **`/`** - Landing page with hero search
- **`/search`** - Advanced permit office search
- **`/dashboard`** - User dashboard (authenticated)
- **`/pricing`** - Subscription plans
- **`/profile`** - User profile management
- **`/admin`** - Admin dashboard

---

## 🔌 API Endpoints

### `GET /api/permit-offices`
Search for permit offices by location.

**Query Parameters:**
- `lat`, `lng` - Coordinates (optional)
- `city` - City name
- `county` - County name
- `state` - State abbreviation (required)

**Response:**
```json
{
  "success": true,
  "offices": [...],
  "count": 10,
  "source": "database"
}
```

### `POST /api/geocode`
Convert address to coordinates.

**Body:**
```json
{
  "address": "123 Main St, Atlanta, GA"
}
```

### `GET /api/subscription/check`
Check user's subscription and usage.

### `POST /api/create-checkout-session`
Create Stripe checkout session for subscription upgrade.

---

## 💾 Database Schema

### Main Tables

**`permit_offices`**
- Core fields: `id`, `city`, `county`, `state`, `jurisdiction_type`
- Contact: `address`, `phone`, `email`, `website`
- Hours: `hours_monday` through `hours_sunday`
- Services: `building_permits`, `electrical_permits`, etc.
- Enhanced data (JSONB): `permit_fees`, `processing_times`, `instructions`
- Metadata: `data_source`, `confidence_score`, `last_verified`

**`user_subscriptions`**
- `userId`, `plan`, `searchesUsed`, `searchesLimit`
- `currentPeriodStart`, `currentPeriodEnd`
- `stripeCustomerId`, `stripeSubscriptionId`

**`scrape_jobs`**
- `id`, `status`, `city`, `county`, `state`
- `sourceUrl`, `maxDepth`, `resultCount`

---

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev                    # Start dev server
npm run dev --turbopack        # Dev with Turbopack (faster)

# Build & Production
npm run build                  # Production build
npm run start                  # Start production server

# Code Quality
npm run lint                   # ESLint check
npm run typecheck              # TypeScript check
npm run check                  # Lint + typecheck

# Testing
npm run test:clerk             # Clerk integration tests
npm run test:signin            # Sign-in workflow tests
npm run qa:test                # QA audit tests

# Database
npm run migrate:db             # Run migrations
npm run verify:db              # Verify database connection
npm run seed:ga-counties       # Seed Georgia counties

# Utilities
npm run analyze                # Bundle size analysis
npm run health                 # Database + Clerk health check
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Manual Deployment

```bash
npm run build
npm run start
```

---

## 📊 Subscription Plans

| Feature | Free | Pro ($29/mo) | Enterprise ($99/mo) |
|---------|------|--------------|---------------------|
| **Searches** | 1 total | 40/month | Unlimited |
| **Advanced Filtering** | ❌ | ✅ | ✅ |
| **Distance Sorting** | ❌ | ✅ | ✅ |
| **Save Favorites** | ❌ | ❌ | ✅ |
| **Export (PDF/Excel)** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |

---

## 🔒 Security

- **Authentication**: Clerk secure session management
- **API Protection**: Rate limiting via Upstash Redis
- **Headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- **Environment Variables**: Validated and secured
- **Payment Processing**: PCI-compliant via Stripe

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

---

## 🐛 Known Issues

- Georgia-only coverage (nationwide expansion planned)
- Free plan limited to 1 total search
- Export requires Enterprise plan
- Web scraping may take 1-2 minutes for new locations

---

## 🗺️ Roadmap

### Q1 2025
- [ ] Expand to Florida, Alabama, Tennessee, South Carolina, North Carolina
- [ ] Team collaboration features (Enterprise)
- [ ] Mobile app (iOS/Android)

### Q2 2025
- [ ] Nationwide expansion (all 50 states)
- [ ] API access for third-party integrations
- [ ] Advanced analytics dashboard
- [ ] White-label solutions

### Q3 2025
- [ ] Multi-language support
- [ ] Real-time updates via WebSockets
- [ ] Enhanced ML-based data extraction

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Moe Edward**
- Email: edwardsteel.0@gmail.com
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Hosting platform
- [Clerk](https://clerk.com/) - Authentication
- [Stripe](https://stripe.com/) - Payment processing
- [NeonDB](https://neon.tech/) - Serverless PostgreSQL
- [ShadCN UI](https://ui.shadcn.com/) - Component library
- [Google Maps Platform](https://cloud.google.com/maps-platform) - Geocoding & Places API

---

## 📞 Support

For support, email edwardsteel.0@gmail.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ by the PTO Agent team</p>
