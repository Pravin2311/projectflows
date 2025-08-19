import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  Calendar as CalendarIcon 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@shared/schema";

interface TopNavigationProps {
  title: string;
  subtitle?: string;
  currentProject?: Project;
  viewMode?: "board" | "list" | "timeline";
  onViewModeChange?: (mode: "board" | "list" | "timeline") => void;
}

export function TopNavigation({ 
  title, 
  subtitle, 
  currentProject, 
  viewMode = "board", 
  onViewModeChange 
}: TopNavigationProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const viewModes = [
    { id: "board", label: "Board", icon: LayoutGrid },
    { id: "list", label: "List", icon: List },
    { id: "timeline", label: "Timeline", icon: CalendarIcon },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600" data-testid="text-page-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              All systems operational
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search tasks, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-10 pr-4 border-gray-300 focus:ring-primary focus:border-primary"
              data-testid="input-search"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          {/* View Toggle */}
          {onViewModeChange && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              {viewModes.map((mode) => (
                <Button
                  key={mode.id}
                  variant={viewMode === mode.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange(mode.id as "board" | "list" | "timeline")}
                  className={`px-3 py-1 text-sm ${
                    viewMode === mode.id 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  data-testid={`button-view-${mode.id}`}
                >
                  <mode.icon className="w-4 h-4 mr-2" />
                  {mode.label}
                </Button>
              ))}
            </div>
          )}

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Project breadcrumb */}
      {currentProject && (
        <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
          <span>Project:</span>
          <Badge 
            variant="outline" 
            className="bg-gray-50"
            style={{ 
              borderLeftColor: currentProject.color || '#7C3AED',
              borderLeftWidth: '3px'
            }}
            data-testid="badge-current-project"
          >
            {currentProject.name}
          </Badge>
        </div>
      )}
    </header>
  );
}
