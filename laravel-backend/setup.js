const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

const directories = [
    "app/Http/Controllers/Auth",
    "app/Http/Middleware",
    "app/Http/Resources",
    "app/Models",
    "app/Services",
    "app/Jobs",
    "database/migrations",
    "routes"
];

directories.forEach(dir => {
    fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
});

const files = {
    // Controllers
    "app/Http/Controllers/Auth/AuthController.php": `<?php\n\nnamespace App\\Http\\Controllers\\Auth;\n\nuse App\\Http\\Controllers\\Controller;\nuse Illuminate\\Http\\Request;\n\nclass AuthController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/ClientController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass ClientController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/AgentController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass AgentController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/ProjectController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass ProjectController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/PaymentController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass PaymentController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/InvoiceController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass InvoiceController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/PayHereController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass PayHereController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/WebhookController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass WebhookController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/CalendarController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass CalendarController extends Controller\n{\n    //\n}`,
    "app/Http/Controllers/CommissionController.php": `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass CommissionController extends Controller\n{\n    //\n}`,

    // Middleware
    "app/Http/Middleware/RoleMiddleware.php": `<?php\n\nnamespace App\\Http\\Middleware;\n\nuse Closure;\nuse Illuminate\\Http\\Request;\n\nclass RoleMiddleware\n{\n    public function handle(Request $request, Closure $next, ...$roles)\n    {\n        return $next($request);\n    }\n}`,
    "app/Http/Middleware/SanctumMiddleware.php": `<?php\n\nnamespace App\\Http\\Middleware;\n\nuse Closure;\nuse Illuminate\\Http\\Request;\n\nclass SanctumMiddleware\n{\n    public function handle(Request $request, Closure $next)\n    {\n        return $next($request);\n    }\n}`,

    // Resources
    "app/Http/Resources/ClientResource.php": `<?php\n\nnamespace App\\Http\\Resources;\n\nuse Illuminate\\Http\\Resources\\Json\\JsonResource;\n\nclass ClientResource extends JsonResource\n{\n    public function toArray($request)\n    {\n        return parent::toArray($request);\n    }\n}`,
    "app/Http/Resources/InvoiceResource.php": `<?php\n\nnamespace App\\Http\\Resources;\n\nuse Illuminate\\Http\\Resources\\Json\\JsonResource;\n\nclass InvoiceResource extends JsonResource\n{\n    public function toArray($request)\n    {\n        return parent::toArray($request);\n    }\n}`,
    "app/Http/Resources/PaymentResource.php": `<?php\n\nnamespace App\\Http\\Resources;\n\nuse Illuminate\\Http\\Resources\\Json\\JsonResource;\n\nclass PaymentResource extends JsonResource\n{\n    public function toArray($request)\n    {\n        return parent::toArray($request);\n    }\n}`,

    // Services
    "app/Services/PayHereService.php": `<?php\n\nnamespace App\\Services;\n\nclass PayHereService\n{\n    //\n}`,
    "app/Services/InvoiceService.php": `<?php\n\nnamespace App\\Services;\n\nclass InvoiceService\n{\n    //\n}`,
    "app/Services/CommissionService.php": `<?php\n\nnamespace App\\Services;\n\nclass CommissionService\n{\n    //\n}`,
    "app/Services/NotificationService.php": `<?php\n\nnamespace App\\Services;\n\nclass NotificationService\n{\n    //\n}`,

    // Jobs
    "app/Jobs/SendPaymentReminder.php": `<?php\n\nnamespace App\\Jobs;\n\nuse Illuminate\\Bus\\Queueable;\nuse Illuminate\\Contracts\\Queue\\ShouldQueue;\nuse Illuminate\\Foundation\\Bus\\Dispatchable;\nuse Illuminate\\Queue\\InteractsWithQueue;\nuse Illuminate\\Queue\\SerializesModels;\n\nclass SendPaymentReminder implements ShouldQueue\n{\n    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;\n\n    public function handle()\n    {\n        //\n    }\n}`,
    "app/Jobs/SendRenewalAlert.php": `<?php\n\nnamespace App\\Jobs;\n\nuse Illuminate\\Bus\\Queueable;\nuse Illuminate\\Contracts\\Queue\\ShouldQueue;\nuse Illuminate\\Foundation\\Bus\\Dispatchable;\nuse Illuminate\\Queue\\InteractsWithQueue;\nuse Illuminate\\Queue\\SerializesModels;\n\nclass SendRenewalAlert implements ShouldQueue\n{\n    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;\n\n    public function handle()\n    {\n        //\n    }\n}`,
    "app/Jobs/SyncPayHereStatus.php": `<?php\n\nnamespace App\\Jobs;\n\nuse Illuminate\\Bus\\Queueable;\nuse Illuminate\\Contracts\\Queue\\ShouldQueue;\nuse Illuminate\\Foundation\\Bus\\Dispatchable;\nuse Illuminate\\Queue\\InteractsWithQueue;\nuse Illuminate\\Queue\\SerializesModels;\n\nclass SyncPayHereStatus implements ShouldQueue\n{\n    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;\n\n    public function handle()\n    {\n        //\n    }\n}`,

    // Routes
    "routes/api.php": `<?php\n\nuse Illuminate\\Http\\Request;\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::get('/user', function (Request $request) {\n    return $request->user();\n});\n`
};

const models = [
    "User", "Agent", "Client", 
    "Service", "Package", "Subscription", 
    "Invoice", "Payment", "Transaction", 
    "Commission", "Project", 
    "Domain", "HostingAccount", 
    "SupportTicket", "Notification", "WebhookLog"
];

models.forEach(model => {
    files[`app/Models/${model}.php`] = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class ${model} extends Model
{
    use HasFactory;
    
    protected $guarded = [];
}`;
});

// Write all files
for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(baseDir, filePath);
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content);
    }
}

// Generate basic migration stubs
const createMigrationStub = (tableName) => {
    const className = tableName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Table';
    return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('${tableName}', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('${tableName}');
    }
};`;
};

const tables = [
    "users", "agents", "clients", 
    "services", "packages", "subscriptions", 
    "invoices", "payments", "transactions", 
    "commissions", "projects", 
    "domains", "hosting_accounts", 
    "support_tickets", "notifications", "webhook_logs"
];

const datePrefix = new Date().toISOString().replace(/T/, ' ').replace(/\\..+/, '').replace(/[:-]/g, '').replace(' ', '_');
tables.forEach((table, index) => {
    // Add a slight increment to the timestamp so migrations run in order
    const migrationTime = parseInt(datePrefix) + index;
    const migrationFile = `database/migrations/${migrationTime}_create_${table}_table.php`;
    const fullPath = path.join(baseDir, migrationFile);
    
    // Only create if we don't already have a migration for this table
    const existingMigrations = fs.readdirSync(path.join(baseDir, 'database/migrations'));
    const exists = existingMigrations.some(f => f.includes(`create_${table}_table`));
    
    if (!exists) {
        fs.writeFileSync(fullPath, createMigrationStub(table));
    }
});

console.log("Laravel backend setup complete!");
