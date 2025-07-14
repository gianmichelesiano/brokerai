import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-slate-800 px-4">
          <SidebarTrigger className="-ml-1 text-white hover:bg-slate-700" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">Dashboard Broker AI</h1>
          </div>
        </header>
        <main className="flex-1 p-6 bg-slate-50">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
