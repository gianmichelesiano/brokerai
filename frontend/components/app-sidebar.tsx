'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Shield, Home, FileText, Building2, Search, BarChart3, History, Settings, User, Tag, Layers, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Tipologie",
    url: "/dashboard/tipologie",
    icon: Tag,
  },
  {
    title: "Sezioni",
    url: "/dashboard/sezioni",
    icon: Layers,
  },
  {
    title: "Garanzie",
    url: "/dashboard/garanzie",
    icon: FileText,
  },
  {
    title: "Compagnie",
    url: "/dashboard/compagnie",
    icon: Building2,
  },
  {
    title: "Mapping",
    url: "/dashboard/mapping",
    icon: Search,
  },
  {
    title: "Confronto Polizze",
    url: "/dashboard/confronto-polizze",
    icon: BarChart3,
  },
  {
    title: "Storico",
    url: "/dashboard/storico",
    icon: History,
  },
]

const settingsItems = [
  {
    title: "Impostazioni",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Profilo",
    url: "/dashboard/profile",
    icon: User,
  },
]

export function AppSidebar() {
  const { user, signOut, loading } = useAuth()

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Utente'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Sidebar className="bg-slate-900 border-slate-700">
      <SidebarHeader className="bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2 px-2 py-2">
          <Shield className="h-6 w-6 text-slate-300" />
          <span className="font-bold text-lg text-white">Broker AI</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">Menu Principale</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-slate-700 data-[active=true]:text-white"
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">Configurazione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-slate-700 data-[active=true]:text-white"
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-slate-900 border-t border-slate-700">
        {user && (
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={signOut}
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
        <div className="px-2 py-2 text-xs text-slate-400 border-t border-slate-700">
          v1.0.0 - Broker AI
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
