import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderOpen, 
  Users, 
  Calendar, 
  Bot, 
  BarChart3, 
  Settings, 
  HelpCircle,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@shared/schema";

interface SidebarProps {
  projects?: Project[];
  currentProject?: Project;
}

export function Sidebar({ projects = [], currentProject }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: location === "/dashboard"
    },
    {
      title: "My Tasks",
      icon: CheckSquare,
      href: "/tasks",
      badge: "8",
      active: location === "/tasks"
    },
    {
      title: "Projects",
      icon: FolderOpen,
      href: "/projects",
      active: location === "/projects" || location.startsWith("/project/")
    },
    {
      title: "Team",
      icon: Users,
      href: "/team",
      active: location === "/team"
    },
    {
      title: "Calendar",
      icon: Calendar,
      href: "/calendar",
      active: location === "/calendar"
    },
    {
      title: "AI Insights",
      icon: Bot,
      href: "/ai-insights",
      badge: "NEW",
      badgeVariant: "ai" as const,
      active: location === "/ai-insights"
    },
    {
      title: "Reports",
      icon: BarChart3,
      href: "/reports",
      active: location === "/reports"
    }
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <FolderOpen className="text-white text-sm" />
          </div>
          <span className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
            ProjectFlow
          </span>
        </Link>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" data-testid="text-user-name">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate" data-testid="text-user-role">
                Project Manager
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={item.active ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 px-3 sidebar-item ${
                item.active 
                  ? "bg-primary/10 text-primary border-r-2 border-primary" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant="outline" 
                  className={`ml-auto text-xs ${
                    item.badgeVariant === "ai" 
                      ? "bg-teal-50 text-teal-700 border-teal-200 ai-pulse" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Current Project Info */}
      {currentProject && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Current Project</p>
            <p className="text-sm font-medium text-gray-900 truncate" data-testid="text-current-project">
              {currentProject.name}
            </p>
            <div className="flex items-center mt-2">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: currentProject.color || '#7C3AED' }}
              ></div>
              <span className="text-xs text-gray-500">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900"
          onClick={() => window.dispatchEvent(new CustomEvent('open-user-settings'))}
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900"
          data-testid="button-help"
        >
          <HelpCircle className="w-5 h-5 mr-3" />
          Help
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-gray-600 hover:text-gray-900"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
