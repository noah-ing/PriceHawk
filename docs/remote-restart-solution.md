# Remote Application Restart Solution

## Overview

Since direct SSH access to the SiteGround server is not possible from GitHub Actions or local machines due to firewall restrictions, we implemented a secure PHP-based restart solution.

## How It Works

1. A PHP script (`restart-app.php`) is deployed to the server's public directory
2. The script is protected by a secure token to prevent unauthorized access
3. When accessed with the correct token, it executes server-side commands to restart the Node.js application
4. The GitHub Actions workflow deploys both the Next.js application and this restart script

## Usage

After each deployment, you need to visit the following URL to restart the application:

```
https://your-domain.com/restart-app.php?token=PrH_7f2c91d83b4e5a6f
```

This will:
1. Change to the public_html directory
2. Install production dependencies (npm install --production)
3. Restart the PM2 process (or start it if not running)

## Security Considerations

- The restart script is protected by a token to prevent unauthorized access
- The token should be kept secure and not shared publicly
- Consider periodically changing the token for enhanced security
- The script outputs the commands being executed, which helps with debugging

## Troubleshooting

If the restart script doesn't work:

1. Check if PHP is properly configured on your server
2. Verify that the path to the public_html directory is correct
3. Make sure the application's PM2 process name matches what's in the script
4. Check for any permission issues that might prevent command execution
