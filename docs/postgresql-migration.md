# PostgreSQL Migration Guide

This document provides instructions for migrating the PriceHawk application from SQLite to PostgreSQL for production deployment.

## Prerequisites

1. **PostgreSQL Installation**
   - Install PostgreSQL on your system or use a cloud-hosted PostgreSQL service
   - Recommended version: PostgreSQL 14 or later
   - Create a database named `pricehawk`

2. **Required Tools**
   - Node.js v20.x or later
   - npm v10.x or later
   - PostgreSQL client tools (psql, pg_dump, pg_restore)

## Migration Steps

### 1. Configure PostgreSQL Connection

Update the `.env` file with your PostgreSQL connection string:

```
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/pricehawk?schema=public"
```

Replace `username`, `password`, `localhost`, and `5432` with your PostgreSQL credentials and host information.

### 2. Update Prisma Schema

The Prisma schema has been updated to use PostgreSQL as the database provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Generate Prisma Client

Generate the Prisma client for PostgreSQL:

```bash
npx prisma generate
```

### 4. Create Database Schema

Create the database schema in PostgreSQL:

```bash
npm run db:migrate
```

This will create all the necessary tables, indexes, and relationships in your PostgreSQL database.

### 5. Migrate Data from SQLite

We've created a migration script to transfer data from SQLite to PostgreSQL:

```bash
npm run db:migrate-postgres
```

This script will:
- Create a backup of your SQLite database
- Extract data from SQLite
- Insert data into PostgreSQL
- Verify the migration was successful

### 6. Optimize PostgreSQL Database

After migration, optimize the PostgreSQL database for performance:

```bash
npm run db:optimize
```

This script will:
- Create indexes for frequently queried fields
- Analyze database performance
- Provide recommendations for further optimization
- Run VACUUM ANALYZE to optimize the database

### 7. Set Up Backup Procedures

Set up regular backups of your PostgreSQL database:

```bash
# Create a backup
npm run db:backup

# Restore from a backup
npm run db:restore

# Schedule daily backups (runs at 3 AM by default)
node scripts/db-backup.js schedule
```

## Connection Pooling

The application has been configured to use connection pooling for better performance with PostgreSQL. The connection pool settings can be adjusted in `lib/db/prisma.ts`:

```typescript
// Configure connection pool settings
// These values can be adjusted based on the expected load
connectionLimit: {
  min: 5,      // Minimum connections in the pool
  max: 10      // Maximum connections in the pool
}
```

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify your PostgreSQL server is running
2. Check your connection string in the `.env` file
3. Ensure your firewall allows connections to the PostgreSQL port
4. Verify the database user has appropriate permissions

### Migration Issues

If data migration fails:

1. Check the error message for specific issues
2. Verify both SQLite and PostgreSQL databases are accessible
3. Ensure you have enough disk space for the migration
4. Try running the migration script with Node.js debugging enabled:
   ```bash
   NODE_DEBUG=* node scripts/migrate-to-postgres.js
   ```

### Performance Issues

If you encounter performance issues after migration:

1. Run the optimization script:
   ```bash
   npm run db:optimize
   ```
2. Consider increasing the connection pool size for higher loads
3. Analyze slow queries and add specific indexes as needed
4. Consider using Prisma Accelerate for improved performance

## Production Deployment Considerations

When deploying to production:

1. Use environment variables for database credentials
2. Set up regular automated backups
3. Configure a monitoring solution to track database performance
4. Implement proper security measures (firewall rules, SSL connections)
5. Consider using a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL)

## Additional Resources

- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Connection Pooling with Prisma](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
