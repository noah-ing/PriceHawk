# PriceHawk Deployment Guide

This guide provides step-by-step instructions for deploying PriceHawk to production at pricehawk.app.

## Prerequisites

Before deploying, ensure you have:

1. **SiteGround Hosting Account**: With SSH access and ability to run Node.js applications
2. **PostgreSQL Database**: Set up and configured for production use
3. **Domain Name**: pricehawk.app configured in DNS to point to your SiteGround hosting
4. **SSL Certificate**: For secure HTTPS connections (available through SiteGround)
5. **SendGrid Account**: For transactional emails
6. **Stripe Account**: For subscription management
7. **GitHub Repository**: With your PriceHawk codebase

## Deployment Process

### 1. Environment Setup

1. Copy the example production environment file:
   ```bash
   cp .env.production.example .env.production
   ```

2. Fill in all required environment variables in `.env.production`:
   - Database connection string with proper credentials
   - Authentication secrets
   - API keys for external services
   - Feature flags and other configuration options

3. Set up GitHub repository secrets for CI/CD:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Secret for NextAuth.js
   - `NEXTAUTH_URL`: https://pricehawk.app
   - `STRIPE_SECRET_KEY`: Stripe API key
   - `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Same as above
   - `STRIPE_WEBHOOK_SECRET`: Secret for Stripe webhooks
   - `SENDGRID_API_KEY`: SendGrid API key
   - `SENDGRID_FROM_EMAIL`: alerts@pricehawk.app
   - `SITEGROUND_FTP_SERVER`: SiteGround FTP server address
   - `SITEGROUND_FTP_USERNAME`: SiteGround FTP username
   - `SITEGROUND_FTP_PASSWORD`: SiteGround FTP password
   - `SITEGROUND_SSH_HOST`: SiteGround SSH host
   - `SITEGROUND_SSH_USERNAME`: SiteGround SSH username
   - `SITEGROUND_SSH_PASSWORD`: SiteGround SSH password

### 2. Database Preparation

1. Run the pre-deployment backup script to backup your existing database:
   ```bash
   node scripts/pre-deployment-backup.js v1.0.0
   ```

2. Verify backup success and note the backup file location for recovery if needed.

3. Run the database optimization script to ensure proper indexes:
   ```bash
   node scripts/optimize-db.js
   ```

### 3. Application Build

1. Install production dependencies:
   ```bash
   npm ci --omit=dev
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Test the build locally to ensure it works:
   ```bash
   npm start
   ```

### 4. Manual Deployment (If not using GitHub Actions)

1. Deploy the built application to SiteGround:
   - Upload the `.next` directory to `public_html/`
   - Upload the `public` directory to `public_html/public/`
   - Upload `package.json`, `package-lock.json`, and `next.config.js` to `public_html/`
   - Upload the `prisma` directory to `public_html/prisma/`
   - Upload your `.env.production` file to `public_html/.env`

2. SSH into your SiteGround server and run:
   ```bash
   cd public_html
   npm ci --production
   npx prisma migrate deploy
   ```

3. Set up PM2 for process management:
   ```bash
   npm install pm2 -g
   pm2 start npm --name "pricehawk" -- start
   pm2 startup
   pm2 save
   ```

### 5. GitHub Actions Deployment (Recommended)

1. Push your code to the main branch with all the deployment configurations:
   ```bash
   git add .
   git commit -m "Production deployment preparation"
   git push origin main
   ```

2. GitHub Actions will automatically:
   - Build the application
   - Create a pre-deployment database backup
   - Run database migrations
   - Deploy to SiteGround
   - Restart the application

3. Monitor the deployment in the GitHub Actions tab of your repository.

### 6. Post-Deployment Verification

1. Access the health check endpoint to verify application status:
   ```
   https://pricehawk.app/api/health
   ```

2. Verify key functionality:
   - User authentication
   - Product tracking
   - Scraping functionality
   - Alert system
   - Subscription management

3. Check for any errors in the logs:
   ```bash
   pm2 logs pricehawk
   ```

### 7. DNS and SSL Configuration

1. Ensure DNS records are properly configured:
   - A record for pricehawk.app pointing to your SiteGround IP
   - CNAME for www.pricehawk.app pointing to pricehawk.app

2. Verify SSL certificate is properly installed and configured in SiteGround cPanel.

3. Test HTTPS access to verify secure connections.

### 8. Monitoring Setup

1. Set up monitoring for the health check endpoint:
   ```
   https://pricehawk.app/api/health
   ```

2. Configure alerts for monitoring failures.

3. Set up regular database backups using the script:
   ```bash
   node scripts/db-backup.js schedule "0 3 * * *"  # Daily at 3 AM
   ```

## Recovery Procedures

### Database Restoration

If you need to restore from a backup:

```bash
node scripts/db-backup.js restore backups/postgres/pre-deployment/pricehawk-pre-deploy-v1.0.0-TIMESTAMP.dump
```

### Application Rollback

To roll back to a previous deployment:

1. Restore the database from a pre-deployment backup.
2. Use GitHub Actions to deploy a previous commit.

## Stripe Webhook Configuration

1. Set up Stripe webhooks to point to:
   ```
   https://pricehawk.app/api/subscriptions/webhook
   ```

2. Configure the following events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

3. Set the webhook secret in your environment variables.

## SendGrid Email Configuration

1. Verify the sender domain in SendGrid (alerts@pricehawk.app).
2. Set up email templates for:
   - Welcome emails
   - Password reset
   - Email verification
   - Price alerts
   - Subscription notifications

## Regular Maintenance

1. Update dependencies regularly:
   ```bash
   npm outdated
   npm update
   ```

2. Monitor and rotate database backups.

3. Check application logs periodically:
   ```bash
   pm2 logs pricehawk
   ```

4. Monitor database performance and optimize as needed.

## Troubleshooting

### Application Not Starting

1. Check logs:
   ```bash
   pm2 logs pricehawk
   ```

2. Verify environment variables are correctly set.

3. Check database connection is working.

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   node scripts/test-postgres-connection.js
   ```

2. Check connection string parameters.

3. Ensure database user has proper permissions.

### Rate Limiting Issues

If legitimate users are being rate limited:

1. Adjust the rate limits in the `lib/middleware/rate-limit.ts` file.
2. Restart the application:
   ```bash
   pm2 restart pricehawk
   ```

## Contacts

For deployment help:

- Noah Johnson - noah@pricehawk.app
