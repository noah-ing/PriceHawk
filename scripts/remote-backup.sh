#!/bin/bash
# Enterprise-level Remote Backup Script for PriceHawk
# This script is designed to be executed directly on the SiteGround server
# where database access is guaranteed.
#
# It creates versioned database backups before deployment and maintains
# a proper retention policy for previous backups.

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
BACKUP_DIR="$HOME/backups/postgres/pre-deployment"
MAX_BACKUPS=5
VERSION="${1:-unversioned}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pricehawk-pre-deploy-$VERSION-$TIMESTAMP.dump"
LOG_FILE="$BACKUP_DIR/backup-$TIMESTAMP.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "========================================================" | tee -a "$LOG_FILE"
echo "  PRICEHAWK PRE-DEPLOYMENT DATABASE BACKUP              " | tee -a "$LOG_FILE"
echo "========================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Creating backup: $BACKUP_FILE" | tee -a "$LOG_FILE"

# Execute the backup using locally accessible database
# Since this runs directly on SiteGround, we use localhost instead of remote hostname
pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" -F c -Z 9 -f "$BACKUP_FILE" 2>> "$LOG_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup completed successfully: $BACKUP_FILE ($FILE_SIZE)" | tee -a "$LOG_FILE"
  
  # Rotate old backups (keep only MAX_BACKUPS most recent)
  echo "Checking for old backups to rotate..." | tee -a "$LOG_FILE"
  
  # List files by modification time (oldest first), skip the newest MAX_BACKUPS
  OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.dump" -type f -printf '%T@ %p\n' | sort -n | head -n -$MAX_BACKUPS | cut -d' ' -f2-)
  
  # Remove old backups if needed
  if [ -n "$OLD_BACKUPS" ]; then
    echo "Removing old backups:" | tee -a "$LOG_FILE"
    for OLD_FILE in $OLD_BACKUPS; do
      echo "  - $(basename "$OLD_FILE")" | tee -a "$LOG_FILE"
      rm -f "$OLD_FILE"
    done
  else
    echo "No old backups to remove." | tee -a "$LOG_FILE"
  fi
  
  # List remaining backups
  echo "" | tee -a "$LOG_FILE"
  echo "Available pre-deployment backups:" | tee -a "$LOG_FILE"
  find "$BACKUP_DIR" -name "*.dump" -type f -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2- | while read -r file; do
    size=$(du -h "$file" | cut -f1)
    mod_time=$(date -r "$file" "+%Y-%m-%d %H:%M:%S")
    echo "  - $(basename "$file") ($size) - $mod_time" | tee -a "$LOG_FILE"
  done
  
  # Create success marker file for verification
  echo "SUCCESS" > "$BACKUP_DIR/backup-status-$TIMESTAMP.txt"
  
  echo "" | tee -a "$LOG_FILE"
  echo "Backup process completed successfully!" | tee -a "$LOG_FILE"
  exit 0
else
  echo "ERROR: Backup failed!" | tee -a "$LOG_FILE"
  echo "See log for details: $LOG_FILE" | tee -a "$LOG_FILE"
  
  # Create failure marker file for verification
  echo "FAILED" > "$BACKUP_DIR/backup-status-$TIMESTAMP.txt"
  
  exit 1
fi
