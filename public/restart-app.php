<?php
// Basic security - a secret token to prevent unauthorized access
$secret_token = "PrH_7f2c91d83b4e5a6f"; // Randomly generated token - keep this secret

// Check if the provided token matches
if (!isset($_GET['token']) || $_GET['token'] !== $secret_token) {
    die("Unauthorized access");
}

// Execute the commands to restart your application
$output = shell_exec('cd ~/public_html && npm install --production && pm2 restart pricehawk || pm2 start npm --name pricehawk -- start 2>&1');

// Display the output
echo "<pre>";
echo "Executing restart commands...\n\n";
echo htmlspecialchars($output);
echo "</pre>";
?>
