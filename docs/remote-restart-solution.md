# Remote Application Restart Solution

## Overview

Since direct SSH access to the SiteGround server is not possible from GitHub Actions, and PHP execution of shell commands is restricted, we've implemented an automated cron-based restart system.

## How It Works

1. A cron job runs on the SiteGround server every few minutes
2. The cron job checks for a `.deployment-marker` file in the `/public_html` directory
3. When the marker is found, it:
   - Removes the marker file (to prevent repeated restarts)
   - Installs production dependencies
   - Restarts the Node.js application with PM2
4. The GitHub Actions workflow deploys both the Next.js application and creates this marker file

## Usage

After the GitHub Actions workflow completes:
1. The deployment marker file is automatically created in the `/public_html` directory
2. Within a few minutes, the cron job detects the marker and restarts the application
3. No manual intervention is required

## Cron Job Setup

The following cron job should be configured on SiteGround:

```
*/5 * * * * cd ~/public_html && [ -f .deployment-marker ] && (rm .deployment-marker && npm install --production && pm2 restart pricehawk || pm2 start npm --name pricehawk -- start)
```

This runs every 5 minutes and:
1. Changes to the public_html directory
2. Checks if the deployment marker file exists
3. If found, removes it and executes the restart commands
4. If not found, does nothing

## Security Considerations

- This approach is more secure than PHP execution of shell commands
- No exposed web endpoints that could be targeted
- No need for tokens or authentication in URLs
- Cron job runs with the same user permissions as your application

## Troubleshooting

If the application isn't restarting after deployment:

1. Check if the cron job is properly configured on SiteGround
2. Verify that the deployment marker file is being uploaded correctly
3. Check the cron job logs for any errors
4. Ensure PM2 is installed and configured correctly on the server
5. Verify that the application's PM2 process name matches what's in the cron job (pricehawk)
