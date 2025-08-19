import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { TopNavigation } from "@/components/ui/top-navigation";
import { KanbanBoard } from "@/components/ui/kanban-board";
import { StatsCards } from "@/components/ui/stats-cards";
import { AiSuggestions } from "@/components/ui/ai-suggestions";
import { TeamMembers } from "@/components/ui/team-members";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Plus, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  if (authLoading || projectsLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-100 animate-pulse"></div>
        <div className="flex-1 p-6 space-y-6">
          <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-screen">
        <Sidebar projects={projects} />
        <div className="flex-1 flex flex-col">
          <TopNavigation title="Dashboard" subtitle="Welcome to ProjectFlow" />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Your First Project</h3>
                  <p className="text-gray-600 mt-2">
                    Get started by creating a project to organize your tasks and collaborate with your team.
                  </p>
                </div>
                <Link href="/projects">
                  <Button className="w-full" data-testid="button-create-first-project">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return null; // Loading or no project selected
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar projects={projects} currentProject={selectedProject} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation 
          title="Project Dashboard" 
          subtitle={`Overview of ${selectedProject.name}`}
          currentProject={selectedProject}
        />
        
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* AI Insights Banner */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">AI Recommendations</h3>
                  <p className="text-teal-100">
                    Based on your team's patterns, consider prioritizing API tasks to avoid blocking other work.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                data-testid="button-view-ai-recommendations"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards projectId={selectedProject.id} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Project Overview - takes 2 columns */}
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Project Overview</h2>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderLeftColor: selectedProject.color || '#7C3AED',
                          borderLeftWidth: '3px'
                        }}
                      >
                        {selectedProject.name}
                      </Badge>
                      <Link href={`/project/${selectedProject.id}`}>
                        <Button variant="outline" size="sm" data-testid="button-view-full-project">
                          View Full Board
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Quick task preview */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">5</div>
                        <div className="text-sm text-gray-600">To Do</div>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700">3</div>
                        <div className="text-sm text-gray-600">In Progress</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">12</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Project Progress</span>
                        <span className="font-medium">60% Complete</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <AiSuggestions projectId={selectedProject.id} />
              <TeamMembers projectId={selectedProject.id} />
              <ActivityFeed projectId={selectedProject.id} limit={5} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
