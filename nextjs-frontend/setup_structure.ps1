$directories = @(
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
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$files = @(
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
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        if ($file -match "page\.tsx$") {
            $name = ($file -replace "app/","" -replace "/page\.tsx","" -replace "\(.*?\)","" -replace "/"," ").Trim().ToUpper()
            if ($name -eq "") { $name = "HOME" }
            Set-Content -Path $file -Value "export default function Page() {`n  return (`n    <div>`n      <h1>$name Page</h1>`n    </div>`n  );`n}"
        } elseif ($file -match "\.tsx$") {
            $name = ($file -replace "components/.*/","" -replace "\.tsx","")
            Set-Content -Path $file -Value "export default function $name() {`n  return (`n    <div>`n      $name Component`n    </div>`n  );`n}"
        } else {
            New-Item -ItemType File -Force -Path $file | Out-Null
        }
    }
}
