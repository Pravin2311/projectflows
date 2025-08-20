import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Calendar,
  Users, 
  BarChart3,
  Clock,
  CheckCircle,
  Activity,
  FolderOpen,
  Cloud,
  Settings,
  LogOut,
  Sliders
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Project } from "@shared/schema";
import { ApiModuleManager } from "@/components/ui/api-module-manager";
import { UserSettings } from "@/components/ui/user-settings";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
}

interface CreateProjectForm {
  name: string;
  description: string;
}

export default function Dashboard() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProjectForm>({
    name: "",
    description: ""
  });

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: CreateProjectForm) => {
      return await apiRequest("POST", "/api/projects", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", description: "" });
      toast({
        title: "Project created",
        description: "Your new project has been saved to Google Drive.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!createForm.name.trim()) {
      toast({
        title: "Error", 
        description: "Project name is required.",
        variant: "destructive"
      });
      return;
    }
    createProjectMutation.mutate(createForm);
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && project.status === "active") ||
                         (filterStatus === "completed" && project.status === "completed");
    
    return matchesSearch && matchesFilter;
  });

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading your projects from Google Drive...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Cloud className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ProjectFlow</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName || user?.email}
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsApiSettingsOpen(true)}
                data-testid="button-api-settings"
              >
                <Sliders className="h-4 w-4 mr-2" />
                API Modules
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsUserSettingsOpen(true)}
                data-testid="button-user-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || "User"}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Your projects are securely stored in your Google Drive. Need more features? Add additional Google services anytime.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-projects">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-active-projects">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-completed-tasks">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-pending-tasks">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                data-testid="input-search-projects"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
            
            <select
              data-testid="select-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "completed")}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="button-new-project"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    data-testid="input-project-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    data-testid="textarea-project-description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="button-create-project"
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                data-testid={`card-project-${project.id}`}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <Link href={`/project/${project.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {project.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(project.createdAt), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {project.memberEmails?.length || 0} members
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FolderOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterStatus !== "all" ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first project. It will be stored in your Google Drive."
              }
            </p>
            {(!searchTerm && filterStatus === "all") && (
              <Button
                data-testid="button-create-first-project"
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-project">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                data-testid="input-project-name"
                placeholder="Enter project name..."
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (Optional)</Label>
              <Textarea
                id="project-description"
                data-testid="textarea-project-description"
                placeholder="Brief project description..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending}
              data-testid="button-confirm-create-project"
            >
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Settings Dialog */}
      <Dialog open={isApiSettingsOpen} onOpenChange={setIsApiSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-api-settings">
          <DialogHeader>
            <DialogTitle>Google API Module Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ApiModuleManager />
          </div>
        </DialogContent>
      </Dialog>

      {/* User Settings Dialog */}
      <Dialog open={isUserSettingsOpen} onOpenChange={setIsUserSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-user-settings">
          <div className="py-4">
            <UserSettings onSave={(settings) => {
              console.log('User settings saved:', settings);
              setIsUserSettingsOpen(false);
            }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}