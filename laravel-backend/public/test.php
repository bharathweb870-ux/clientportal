<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$source = 'C:\Users\bharath\.gemini\antigravity\brain\2311a4c8-092a-4b87-bb52-cdb44552e78c\logo_1780656988971.png';
$destination = 'd:\xampp\htdocs\New folder\New folder (2)\webbuilders_full_structure_fixed - Copy\nextjs-frontend\public\logo.png';

echo "<h2>Logo Copying Tool</h2>";
echo "Source: <code>{$source}</code><br>";
echo "Destination: <code>{$destination}</code><br><br>";

if (!file_exists($source)) {
    die("❌ Source file not found!");
}

if (copy($source, $destination)) {
    echo "✅ Success! Logo has been copied and replaced successfully.";
} else {
    echo "❌ Failed to copy file.";
}
