# Enterprise-Level Pre-Deployment Backup System

This document describes the enterprise-level pre-deployment backup approach for PriceHawk's production environment. This system ensures reliable database backups are created before each deployment, providing a safety net for rollbacks if needed.

## Overview

After encountering connectivity challenges between GitHub Actions and the SiteGround server, we've implemented a local pre-deployment backup approach. This solution addresses several limitations:

1. GitHub Actions runners are unable to establish SSH connections to the SiteGround server due to network constraints
2. Interactive SSH authentication (requiring passphrases) is not supported in GitHub Actions
3. Direct database connections from GitHub Actions are blocked by SiteGround's security measures

The revised solution takes an enterprise approach by:

1. Executing backups directly on the SiteGround server where database access is guaranteed
2. Using a local script to guide developers through the manual backup process
3. Ensuring backups are created before code is pushed to GitHub
4. Maintaining a versioned backup history with proper naming conventions
5. Following best practices for database backup management

## Components

### 1. `remote-backup.sh`

A shell script template that can be executed directly on the SiteGround server. It:

- Creates backups using the local database connection
- Uses proper compression for efficient storage
- Creates standardized backup filenames with timestamps and version tags

### 2. `local-pre-deploy.js`

A local Node.js script that guides developers through the pre-deployment process:

- Checks for uncommitted Git changes
- Provides the SSH command template for creating a database backup
- Confirms the backup was successfully created
- Handles the commit and push to initiate deployment
- Provides clear instructions and verification steps

```javascript
// Key configuration
const backupCommand = 'ssh -o BatchMode=no -o StrictHostKeyChecking=accept-new ${SSH_USER}@${SSH_HOST} "pg_dump -h localhost -U ${DB_USER} -d ${DB_NAME} -F c -f ~/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).dump"';
```

### 3. GitHub Workflow Integration

The GitHub Actions workflow file (`.github/workflows/deploy.yml`) has been updated to:

- Focus solely on the deployment process
- Rely on developers performing the backup manually before pushing
- Use SSH for server operations like restarting the application
- Verify the deployment success with health checks

## Workflow

1. When a developer needs to deploy changes to production:
   - They run `node scripts/local-pre-deploy.js`
   - The script guides them through creating a database backup on the server
   - After confirming the backup's success, the script handles the git commit and push
   - The GitHub workflow deploys the application

2. The pre-deployment backups are stored on the server in a standard location:
   ```
   ~/backups/pre-deploy-20250314-123456.dump
   ```

3. Developers can manage backup retention manually to balance storage requirements

## Advantages of This Approach

1. **Reliability**: Backups are created where database access is guaranteed
2. **Simplicity**: Avoids complex SSH authentication in CI/CD pipelines
3. **Security**: Uses interactive SSH with proper authentication
4. **Control**: Developers have direct oversight of the backup process
5. **Verification**: Developers confirm backup success before deployment
6. **Clarity**: Clear instructions guide developers through the process
7. **Transparency**: Backup steps are explicitly documented and visible

## Manual Backup Instructions

### Creating a Backup Before Deployment

1. Run the local pre-deployment script:
   ```bash
   node scripts/local-pre-deploy.js
   ```

2. When prompted, execute the SSH command in a separate terminal:
   ```bash
   ssh user@siteground.host "pg_dump -h localhost -U username -d database -F c -f ~/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).dump"
   ```

3. Confirm the backup was created successfully when prompted by the script
4. Enter your commit message
5. Confirm deployment to initiate the git push

### Viewing Existing Backups

Connect to the SiteGround server and run:

```bash
ls -la ~/backups/
```

### Restoring from a Backup

To restore from a backup:

```bash
pg_restore -h localhost -U username -d database -c -C ~/backups/pre-deploy-YYYYMMDD-HHMMSS.dump
```

## Security Considerations

1. **Interactive Authentication**: The solution uses standard SSH authentication with interactive password/key confirmation
2. **Limited Permissions**: The backup requires minimal database permissions
3. **No Credential Storage**: Database credentials aren't stored in the scripts or repositories
4. **Developer Verification**: Human verification ensures backups are properly created

## Maintenance Tasks

1. **Backup Rotation**: Periodically clean up old backups to manage disk space
2. **Backup Verification**: Occasionally verify backups can be restored correctly
3. **Documentation Updates**: Keep backup instructions updated as server configurations change

## Future Enhancements

Potential future improvements include:

1. Remote storage synchronization to copy backups to cloud storage
2. Automated backup verification scripts
3. Better backup compression and management
4. Integration with monitoring systems for backup health checks
5. Resolving the GitHub Actions SSH connectivity issues for future automation
