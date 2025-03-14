# Enterprise-Level Pre-Deployment Backup System

This document describes the enterprise-level backup system implemented for PriceHawk's production environment. This system ensures reliable database backups are created before each deployment, providing a safety net for rollbacks if needed.

## Overview

The backup system addresses a critical issue with the previous approach: attempting to create database backups from GitHub Actions runners, which couldn't resolve the SiteGround database hostname (`pg.siteground.biz`).

The new solution takes an enterprise approach by:

1. Executing backups directly on the SiteGround server where database access is guaranteed
2. Using SSH for secure remote execution
3. Splitting the deployment process into separate backup and deploy stages
4. Implementing proper backup verification and detailed logging
5. Maintaining a versioned backup history with automatic rotation

## Components

### 1. `remote-backup.sh`

A shell script designed to run directly on the SiteGround server. It:

- Creates the backup directories if they don't exist
- Executes `pg_dump` against the local database connection
- Verifies the backup was created successfully
- Implements backup rotation to maintain a reasonable number of backups
- Provides detailed logging
- Creates status files to indicate success/failure

```bash
# Key configuration settings
BACKUP_DIR="$HOME/backups/postgres/pre-deployment"
MAX_BACKUPS=5
```

### 2. `execute-remote-backup.js`

A Node.js script that runs in the GitHub Actions workflow to:

- Upload the `remote-backup.sh` script to the SiteGround server
- Make the script executable
- Execute the backup script on the server with necessary environment variables
- Capture and display the output from the remote execution
- Verify the success of the backup operation
- Return appropriate exit codes to signal success/failure to the GitHub workflow

```javascript
// Key configuration settings
const remoteScriptPath = "~/remote-backup.sh";
```

### 3. GitHub Workflow Integration

The GitHub Actions workflow file (`.github/workflows/deploy.yml`) has been updated to:

- Split the deployment into separate `backup` and `deploy` jobs
- Add the backup job as a prerequisite for the deployment job
- Configure SSH access with the private key from GitHub Secrets
- Execute the remote backup before proceeding with deployment
- Use key-based authentication instead of password authentication for SSH operations

## Workflow

1. When a deployment is triggered (via push to master or manual workflow dispatch):
   - The `backup` job checks out the code and sets up the environment
   - SSH keys are configured for secure access to the SiteGround server
   - The `execute-remote-backup.js` script uploads and executes the backup script
   - The backup script creates a versioned backup directly on the server
   - If successful, the `deploy` job proceeds; if not, the workflow fails

2. The server creates backups in `~/backups/postgres/pre-deployment/` with clear naming:
   ```
   pricehawk-pre-deploy-v1.0.0-20250314-123456.dump
   ```

3. Backups are automatically rotated, keeping only the most recent 5 (configurable)

## Advantages Over Previous Solution

1. **Reliability**: Backups are created where database access is guaranteed
2. **Security**: Uses SSH key authentication rather than passwords
3. **Performance**: Faster execution since the backup is created locally on the server
4. **Maintainability**: Detailed logs and status indicators
5. **Safety**: Clear separation between backup and deployment phases
6. **Flexibility**: Version tagging for important releases
7. **Durability**: Automatic rotation of backups to prevent disk space issues

## Troubleshooting

### Common Issues and Solutions

1. **SSH Connection Failures**:
   - Verify SSH key is properly configured in GitHub Secrets
   - Check SiteGround SSH host and username are correct
   - Ensure firewall isn't blocking SSH connections

2. **Database Access Issues**:
   - Verify DB_USER and DB_NAME environment variables pass correctly
   - Check database user has proper permissions for backup
   - Review logs at `~/backups/postgres/pre-deployment/backup-*.log`

3. **Script Upload Failures**:
   - Check SSH user has write permissions to home directory
   - Verify script path and permissions
   - Check for disk space issues on the server

### Viewing Backup History

Connect to the SiteGround server and run:

```bash
ls -la ~/backups/postgres/pre-deployment/
```

### Manual Backup Execution

To manually execute a backup:

```bash
ssh user@host "DB_USER='username' DB_NAME='database' ~/remote-backup.sh manual-backup"
```

### Restoring from Backup

To restore from a backup:

```bash
pg_restore -h localhost -U username -d database -c -C ~/backups/postgres/pre-deployment/backup-file.dump
```

## Security Considerations

1. **SSH Keys**: The solution uses SSH key authentication, which is more secure than password authentication
2. **Limited Permissions**: The script requires minimal permissions on the server
3. **No Credential Storage**: Database credentials aren't stored in the scripts, only passed as environment variables
4. **Audit Trail**: Each backup creates detailed logs, providing an audit trail of backup operations

## Maintenance Tasks

1. **Review Backups Periodically**: Check the backups directory occasionally to ensure rotation is working
2. **Update MAX_BACKUPS**: Adjust the number of backups kept based on available disk space
3. **Verify Backup Files**: Occasionally verify backups can be restored correctly

## Future Enhancements

Potential future improvements include:

1. Remote storage of backups (e.g., S3 or cloud storage)
2. Automated backup verification through test restoration
3. Notification system for backup failures
4. Compression and encryption of backup files
5. Integration with monitoring systems for better observability
