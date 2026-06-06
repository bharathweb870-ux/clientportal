const fs = require('fs');
const path = require('path');

const directories = [
    "app/(auth)/login",
    "app/(dashboard)/admin/clients",
    "app/(dashboard)/admin/agents",
    "app/(dashboard)/admin/projects",
    "app/(dashboard)/admin/payments",
    "app/(dashboard)/admin/calendar",
    "app/(dashboard)/agent/clients",
    "app/(dashboard)/agent/commissions",
    "app/(dashboard)/client/invoices",
    "app/(dashboard)/client/services",
    "app/payment/checkout",
    "app/payment/success",
    "app/payment/cancel",
    "components/ui",
    "components/dashboard",
    "components/payments",
    "components/calendar",
    "lib"
];

directories.forEach(dir => {
    fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

const files = [
    "app/(auth)/login/page.tsx",
    "app/(dashboard)/admin/page.tsx",
    "app/(dashboard)/admin/clients/page.tsx",
    "app/(dashboard)/admin/agents/page.tsx",
    "app/(dashboard)/admin/projects/page.tsx",
    "app/(dashboard)/admin/payments/page.tsx",
    "app/(dashboard)/admin/calendar/page.tsx",
    "app/(dashboard)/agent/page.tsx",
    "app/(dashboard)/agent/clients/page.tsx",
    "app/(dashboard)/agent/commissions/page.tsx",
    "app/(dashboard)/client/page.tsx",
    "app/(dashboard)/client/invoices/page.tsx",
    "app/(dashboard)/client/services/page.tsx",
    "app/payment/checkout/page.tsx",
    "app/payment/success/page.tsx",
    "app/payment/cancel/page.tsx",
    "components/dashboard/Sidebar.tsx",
    "components/dashboard/TopBar.tsx",
    "components/dashboard/StatCard.tsx",
    "components/payments/PayHereCheckout.tsx",
    "components/payments/InvoiceCard.tsx",
    "components/payments/PaymentSuccess.tsx",
    "components/calendar/FullCalendarWrapper.tsx",
    "lib/api.ts",
    "lib/auth.ts",
    "lib/payhere.ts",
    "middleware.ts"
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        let content = '';
        if (file.endsWith('page.tsx')) {
            const name = file.replace('app/', '').replace('/page.tsx', '').replace(/\(.*?\)/g, '').replace(/\//g, ' ').trim().toUpperCase() || 'HOME';
            content = `export default function Page() {\n  return (\n    <div>\n      <h1>${name} Page</h1>\n    </div>\n  );\n}`;
        } else if (file.endsWith('.tsx')) {
            const name = path.basename(file, '.tsx');
            content = `export default function ${name}() {\n  return (\n    <div>\n      ${name} Component\n    </div>\n  );\n}`;
        }
        fs.writeFileSync(fullPath, content);
    }
});

console.log("Setup complete!");
