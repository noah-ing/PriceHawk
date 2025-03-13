# PriceHawk

PriceHawk is a price tracking application that allows users to monitor product prices across multiple retailers, set price alerts, and receive notifications when prices drop.

## Features

- **URL-Based Product Tracking**: Add products by pasting URLs from supported retailers
- **Real-Time Price Extraction**: Instantly extract current prices when adding products
- **Price History Tracking**: View price changes over time with visual charts
- **Price Alerts**: Set custom price thresholds and receive notifications when prices drop
- **Multi-Retailer Support**: Track products from Amazon, Walmart, Best Buy, and more
- **User Authentication**: Sign in with Google OAuth or email/password
- **Email Verification**: Secure account creation with mandatory email verification
- **Subscription Tiers**: Free, Basic, Premium, and Professional plans with different features
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: NextAuth.js with multiple providers
- **Payment Processing**: Stripe for subscription management
- **Email Service**: SendGrid for transactional emails
- **Scraping**: Playwright for JavaScript-heavy sites, Cheerio for simpler sites
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js v20.x or later
- npm v10.x or later
- PostgreSQL (for production) or SQLite (for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pricehawk.git
   cd pricehawk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the environment variables with your own values

4. Set up the database:
   - For development with SQLite:
     ```bash
     npm run db:migrate
     npm run db:seed
     ```
   - For production with PostgreSQL:
     ```bash
     # Update DATABASE_URL in .env to point to your PostgreSQL database
     npm run db:generate-migration
     ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## PostgreSQL Migration

PriceHawk uses PostgreSQL for production. To migrate from SQLite to PostgreSQL:

1. Update the `.env` file with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/pricehawk?schema=public"
   ```

2. Test the PostgreSQL connection:
   ```bash
   npm run db:test-connection
   ```

3. Generate and apply migrations:
   ```bash
   npm run db:generate-migration
   ```

4. Migrate data from SQLite to PostgreSQL:
   ```bash
   npm run db:migrate-postgres
   ```

5. Optimize the PostgreSQL database:
   ```bash
   npm run db:optimize
   ```

For detailed instructions, see [PostgreSQL Migration Guide](docs/postgresql-migration.md).

## Database Management

PriceHawk includes several scripts for database management:

- **Migrations**: `npm run db:migrate` - Create and apply database migrations
- **Prisma Studio**: `npm run db:studio` - Open Prisma Studio to view and edit data
- **Database Seed**: `npm run db:seed` - Seed the database with sample data
- **PostgreSQL Migration**: `npm run db:migrate-postgres` - Migrate data from SQLite to PostgreSQL
- **Database Backup**: `npm run db:backup` - Create a backup of the PostgreSQL database
- **Database Restore**: `npm run db:restore` - Restore from a backup
- **Database Optimization**: `npm run db:optimize` - Optimize the PostgreSQL database
- **Connection Test**: `npm run db:test-connection` - Test the PostgreSQL connection

## Project Structure

```
pricehawk/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── products/         # Product pages
│   ├── alerts/           # Alert pages
│   ├── settings/         # Settings pages
│   └── ...
├── components/           # React components
│   ├── ui/               # UI components
│   └── ...
├── lib/                  # Library code
│   ├── db/               # Database code
│   │   ├── repositories/ # Repository pattern implementations
│   │   └── prisma.ts     # Prisma client configuration
│   ├── scrapers/         # Web scraping code
│   ├── services/         # Service layer
│   └── ...
├── prisma/               # Prisma schema and migrations
├── scripts/              # Utility scripts
├── public/               # Static assets
└── ...
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Database Scripts

- `npm run db:migrate` - Create and apply database migrations
- `npm run db:push` - Push schema changes to the database
- `npm run db:studio` - Open Prisma Studio to view and edit data
- `npm run db:seed` - Seed the database with sample data
- `npm run db:migrate-postgres` - Migrate data from SQLite to PostgreSQL
- `npm run db:backup` - Create a backup of the PostgreSQL database
- `npm run db:restore` - Restore from a backup
- `npm run db:optimize` - Optimize the PostgreSQL database
- `npm run db:generate-migration` - Generate a new migration for PostgreSQL
- `npm run db:test-connection` - Test the PostgreSQL connection

## Production Deployment

PriceHawk includes complete production deployment support with several tools and scripts to ensure reliability:

### Production Readiness

1. **Verify production readiness**:
   ```bash
   npm run pre-deploy-check
   ```
   This command verifies that all required components are in place for production deployment.

2. **Create a pre-deployment backup**:
   ```bash
   npm run pre-deploy
   ```
   This creates a special, clearly labeled backup for easy rollback.

3. **Verify database indexes**:
   ```bash
   npm run db:verify-indexes
   ```
   This checks that all required indexes are present for optimal performance.

### Deployment Options

#### GitHub Actions (Recommended)

PriceHawk includes a GitHub Actions workflow for automated deployment:
1. Configure GitHub repository secrets (see docs/deployment-guide.md)
2. Push to the main branch to trigger deployment
3. The workflow will handle building, backing up, and deploying

#### Manual Deployment

For manual deployment to SiteGround or similar hosting:
1. Build the application: `npm run deploy`
2. Upload the built files to your hosting provider
3. Set up environment variables on your hosting provider
4. Start the application with PM2: `npm run start:pm2`

For detailed instructions, see [Deployment Guide](docs/deployment-guide.md).

### Post-Deployment Verification

After deployment, verify the application health:
```bash
curl https://pricehawk.app/api/health
```

### Production Scripts

- `npm run pre-deploy-check` - Check production readiness
- `npm run pre-deploy` - Create a pre-deployment backup
- `npm run db:verify-indexes` - Verify database indexes
- `npm run deploy` - Run full deployment preparation
- `npm run production:start` - Start the application in production mode
- `npm run start:pm2` - Start with PM2 process manager
- `npm run health-check` - Check application health
- `npm run migrate:prod` - Run database migrations for production

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
