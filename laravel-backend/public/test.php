<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ── Secret key protection ──────────────────────────────────────────────────
$secret = 'wb-setup-2026';
if (($_GET['key'] ?? '') !== $secret) {
    die('<h2 style="color:red;font-family:monospace">403 — Add ?key=wb-setup-2026 to URL</h2>');
}

// ── Auto-detect Laravel base path ─────────────────────────────────────────
$possibleBases = [
    dirname(__DIR__),                          // test.php is in public/
    __DIR__ . '/laravel-backend',              // test.php is in domain root
    dirname(__DIR__) . '/laravel-backend',     // one level up
    '/home/crmwebbuilders/api.crm.webbuilders.lk/laravel-backend', // absolute
];

$base = null;
foreach ($possibleBases as $path) {
    if (file_exists($path . '/vendor/autoload.php')) {
        $base = $path;
        break;
    }
}

if (!$base) {
    echo "<pre style='color:red;background:#1e1e1e;padding:20px'>";
    echo "❌ Cannot find Laravel vendor folder.\n\nSearched:\n";
    foreach ($possibleBases as $p) echo "  - $p/vendor/autoload.php\n";
    echo "\nPlease upload test.php inside the 'public' folder of your Laravel app.";
    echo "</pre>";
    exit;
}

echo "<!-- Laravel base: $base -->";
require $base . '/vendor/autoload.php';
$app    = require_once $base . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function artisan(string $cmd): string {
    $output = new Symfony\Component\Console\Output\BufferedOutput();
    app(Illuminate\Contracts\Console\Kernel::class)->call($cmd, [], $output);
    return trim($output->fetch()) ?: '(no output)';
}

function box(string $title, string $body, string $color = '#22c55e'): void {
    echo "<div style='margin:10px 0;padding:14px 18px;background:#1e293b;border-left:4px solid $color;border-radius:6px;font-family:monospace'>";
    echo "<div style='color:$color;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px'>$title</div>";
    echo "<pre style='color:#e2e8f0;margin:0;white-space:pre-wrap;font-size:13px'>" . htmlspecialchars($body) . "</pre></div>";
}

$action = $_GET['action'] ?? '';
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>WB CRM — Runner</title>
<style>
body{background:#0f172a;color:#e2e8f0;font-family:monospace;padding:30px 20px}
h1{color:#f97316;font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:3px;margin-bottom:4px}
.sub{color:#475569;font-size:10px;font-weight:700;letter-spacing:2px;margin-bottom:20px}
.warn{background:#7f1d1d;border:1px solid #dc2626;padding:10px 16px;border-radius:6px;color:#fca5a5;font-size:11px;font-weight:700;margin-bottom:20px}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
a.b{display:inline-block;padding:9px 18px;border-radius:6px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;text-decoration:none}
.g{background:#166534;color:#86efac}
.bl{background:#1e3a5f;color:#93c5fd}
.o{background:#7c2d12;color:#fdba74}
.r{background:#7f1d1d;color:#fca5a5}
</style>
</head>
<body>
<h1>⚡ WB CRM Runner</h1>
<p class="sub">api.crm.webbuilders.lk — Remote Artisan</p>
<div class="warn">⚠️ Delete test.php from cPanel after use!</div>

<div class="btns">
  <a class="b g"  href="?key=<?=$secret?>&action=migrate">▶ Run Migrate</a>
  <a class="b g"  href="?key=<?=$secret?>&action=fix_commissions">🔧 Fix Commissions</a>
  <a class="b bl" href="?key=<?=$secret?>&action=status">📋 Migrate Status</a>
  <a class="b bl" href="?key=<?=$secret?>&action=test_db">🔌 Test DB</a>
  <a class="b bl" href="?key=<?=$secret?>&action=config_clear">🗑 Config Clear</a>
  <a class="b bl" href="?key=<?=$secret?>&action=cache_clear">🗑 Cache Clear</a>
  <a class="b o"  href="?key=<?=$secret?>&action=routes">🛣 API Routes</a>
  <a class="b r"  href="?key=<?=$secret?>&action=fresh">⚠️ Migrate:Fresh</a>
</div>

<?php
try {
    switch ($action) {

        case 'fix_commissions':
            $commissions = \App\Models\Commission::with('invoice')->get();
            $updated = 0;
            $logs = [];
            foreach ($commissions as $comm) {
                if (!$comm->invoice) {
                    $logs[] = "Commission #{$comm->id} has no linked invoice - skipped";
                    continue;
                }
                $invoice = $comm->invoice;
                
                $percentage = floatval($comm->percentage);
                if ($percentage <= 0) {
                    $agent = \App\Models\Agent::find($comm->agent_id);
                    $percentage = $agent ? floatval($agent->commission_rate ?? 25) : 25;
                }

                $baseAmount = floatval($invoice->amount) - floatval($invoice->vat ?? 0) - floatval($invoice->tax ?? 0);
                $newAmount = $baseAmount * ($percentage / 100);

                if (abs(floatval($comm->amount) - $newAmount) > 0.01 || floatval($comm->percentage) != $percentage) {
                    $oldAmount = $comm->amount;
                    $comm->update([
                        'amount' => $newAmount,
                        'percentage' => $percentage
                    ]);
                    $logs[] = "Updated Commission #{$comm->id} (Client ID: {$comm->client_id}, Invoice: {$invoice->invoice_number}): Amount LKR {$oldAmount} ➜ LKR {$newAmount} (Rate: {$percentage}%)";
                    $updated++;
                }
            }
            box("🔧 Fixed {$updated} Commissions", empty($logs) ? "All commissions are already correct." : implode("\n", $logs));
            break;

        case 'migrate':
            box('▶ Migrate', artisan('migrate --force'));
            break;

        case 'fresh':
            if (!isset($_GET['confirm'])) {
                box('⚠️ Confirm', 'This drops ALL tables! Click: <a href="?key='.$secret.'&action=fresh&confirm=1" style="color:#fca5a5">CONFIRM DROP ALL</a>', '#dc2626');
            } else {
                box('⚠️ Migrate Fresh', artisan('migrate:fresh --force --seed'), '#dc2626');
            }
            break;

        case 'status':
            box('📋 Status', artisan('migrate:status'));
            break;

        case 'test_db':
            try {
                $tables = DB::select('SHOW TABLES');
                $names  = [];
                foreach ($tables as $t) {
                    $arr = array_values((array)$t);
                    $names[] = '• ' . $arr[0];
                }
                box('✅ DB Connected', "Tables (" . count($names) . "):\n\n" . implode("\n", $names));
            } catch (Exception $e) {
                box('❌ DB Failed', $e->getMessage(), '#dc2626');
            }
            break;

        case 'config_clear':
            $out = artisan('config:clear');
            // Also manually delete cached config
            $f = dirname(__DIR__) . '/bootstrap/cache/config.php';
            if (file_exists($f)) { unlink($f); $out .= "\nDeleted bootstrap/cache/config.php ✓"; }
            box('🗑 Config Cleared', $out);
            break;

        case 'cache_clear':
            box('🗑 Cache Cleared', artisan('cache:clear'));
            break;

        case 'routes':
            box('🛣 API Routes', artisan('route:list --path=api'));
            break;

        default:
            box('ℹ️ Ready', 'Select an action above.');
    }
} catch (Throwable $e) {
    box('❌ Error', $e->getMessage() . "\n\n" . $e->getFile() . ':' . $e->getLine(), '#dc2626');
}
?>
</body>
</html>
