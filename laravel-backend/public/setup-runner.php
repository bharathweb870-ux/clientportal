<?php
/**
 * WebBuilders CRM — Remote Setup & Migration Runner
 * ─────────────────────────────────────────────────
 * SECURITY: Delete this file immediately after use!
 * Access: https://api.crm.webbuilders.lk/setup-runner.php
 */

// ── Secret key protection ──────────────────────────────────────────────────
define('SECRET_KEY', 'wb-setup-2026');
$provided = $_GET['key'] ?? '';
if ($provided !== SECRET_KEY) {
    http_response_code(403);
    die('<h2 style="color:red;font-family:monospace">403 Forbidden — Provide ?key=wb-setup-2026</h2>');
}

// ── Bootstrap Laravel ──────────────────────────────────────────────────────
$base = dirname(__DIR__);
require $base . '/vendor/autoload.php';
$app = require_once $base . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// ── Helper ─────────────────────────────────────────────────────────────────
function run(string $cmd): string {
    $kernel = app(Illuminate\Contracts\Console\Kernel::class);
    $output = new Symfony\Component\Console\Output\BufferedOutput();
    $kernel->call($cmd, [], $output);
    return trim($output->fetch());
}

function box(string $title, string $content, string $color = '#22c55e'): void {
    echo "<div style='margin:12px 0;padding:16px 20px;background:#1e293b;border-left:4px solid $color;border-radius:8px;font-family:monospace'>";
    echo "<div style='color:$color;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px'>$title</div>";
    echo "<pre style='color:#e2e8f0;margin:0;white-space:pre-wrap;font-size:13px'>$content</pre>";
    echo "</div>";
}

$action = $_GET['action'] ?? 'status';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>WB CRM — Setup Runner</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #e2e8f0; font-family: monospace; padding: 40px 20px; }
  h1 { color: #f97316; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 6px; }
  .sub { color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; }
  .warning { background: #7f1d1d; border: 1px solid #dc2626; padding: 12px 20px; border-radius: 8px; color: #fca5a5; font-size: 12px; font-weight: 700; margin-bottom: 24px; }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px; }
  a.btn { display: inline-block; padding: 10px 20px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; transition: opacity .2s; }
  a.btn:hover { opacity: .8; }
  .green  { background: #166534; color: #86efac; }
  .blue   { background: #1e3a5f; color: #93c5fd; }
  .orange { background: #7c2d12; color: #fdba74; }
  .red    { background: #7f1d1d; color: #fca5a5; }
  .gray   { background: #1e293b; color: #94a3b8; }
</style>
</head>
<body>
<h1>⚡ WB CRM Setup Runner</h1>
<p class="sub">api.crm.webbuilders.lk — Remote Artisan Interface</p>
<div class="warning">⚠️ SECURITY WARNING: Delete this file immediately after use!</div>

<div class="actions">
  <a class="btn green"  href="?key=<?= SECRET_KEY ?>&action=migrate">▶ Run Migrations</a>
  <a class="btn green"  href="?key=<?= SECRET_KEY ?>&action=migrate_fresh">⚠️ Migrate Fresh (DROPS ALL)</a>
  <a class="btn blue"   href="?key=<?= SECRET_KEY ?>&action=status">📋 Migration Status</a>
  <a class="btn blue"   href="?key=<?= SECRET_KEY ?>&action=cache_clear">🗑 Clear Cache</a>
  <a class="btn blue"   href="?key=<?= SECRET_KEY ?>&action=config_clear">🗑 Clear Config</a>
  <a class="btn orange" href="?key=<?= SECRET_KEY ?>&action=route_list">🛣 Route List</a>
  <a class="btn orange" href="?key=<?= SECRET_KEY ?>&action=test_db">🔌 Test DB</a>
  <a class="btn gray"   href="?key=<?= SECRET_KEY ?>&action=phpinfo">🐘 PHP Info</a>
</div>

<?php
try {
    switch ($action) {

        case 'migrate':
            $out = run('migrate --force');
            box('✅ Migration Result', $out ?: 'No new migrations to run.');
            break;

        case 'migrate_fresh':
            if (!isset($_GET['confirm'])) {
                box('⚠️ Confirm Required', 
                    'This will DROP ALL TABLES. Click to confirm:' . "\n\n" .
                    '<a href="?key=' . SECRET_KEY . '&action=migrate_fresh&confirm=yes" style="color:#fca5a5;font-weight:900">YES, DROP EVERYTHING & MIGRATE FRESH</a>',
                    '#dc2626');
            } else {
                $out = run('migrate:fresh --force');
                box('⚠️ Migrate Fresh Result', $out, '#dc2626');
            }
            break;

        case 'status':
            $out = run('migrate:status');
            box('📋 Migration Status', $out ?: 'Could not retrieve status.');
            break;

        case 'cache_clear':
            $out = run('cache:clear');
            box('🗑 Cache Cleared', $out);
            break;

        case 'config_clear':
            $out = run('config:clear');
            box('🗑 Config Cache Cleared', $out);
            // Also try to delete bootstrap/cache/config.php directly
            $cacheFile = dirname(__DIR__) . '/bootstrap/cache/config.php';
            if (file_exists($cacheFile)) {
                unlink($cacheFile);
                box('🗑 bootstrap/cache/config.php', 'Deleted manually ✓');
            }
            break;

        case 'route_list':
            $out = run('route:list --path=api');
            box('🛣 API Routes', $out);
            break;

        case 'test_db':
            try {
                $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
                $list = implode("\n", array_map(function($t) {
                    $arr = array_values((array)$t);
                    return '• ' . $arr[0];
                }, $tables));
                box('✅ Database Connected', "Tables found:\n\n" . $list);
            } catch (\Exception $e) {
                box('❌ DB Connection Failed', $e->getMessage(), '#dc2626');
            }
            break;

        case 'phpinfo':
            box('🐘 PHP Info', 'PHP Version: ' . PHP_VERSION . "\nOS: " . PHP_OS . "\nMax Execution Time: " . ini_get('max_execution_time') . "s\nMemory Limit: " . ini_get('memory_limit'));
            break;

        default:
            box('ℹ️ Ready', 'Select an action above to get started.');
    }
} catch (\Throwable $e) {
    box('❌ Error', $e->getMessage() . "\n\nFile: " . $e->getFile() . ':' . $e->getLine(), '#dc2626');
}
?>

<div style="margin-top:40px;padding:16px;background:#1e293b;border-radius:8px;font-size:11px;color:#475569">
  <strong style="color:#f97316">SECURITY REMINDER:</strong> 
  Delete <code style="color:#fbbf24">public/setup-runner.php</code> from cPanel immediately after you finish setup!
</div>
</body>
</html>
