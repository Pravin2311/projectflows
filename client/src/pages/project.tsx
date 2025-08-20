import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimeTracker } from "@/components/ui/time-tracker";
import { GanttChart } from "@/components/ui/gantt-chart";
import { SprintManager } from "@/components/ui/sprint-manager";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  ArrowLeft,
  Calendar,
  Users, 
  Settings,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  Cloud,
  Brain,
  Timer,
  BarChart3,
  Flag,
  FileText,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Project, Task } from "@shared/schema";

interface TaskForm {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags: string[];
  sprintId?: string;
}

const statusConfig = {
  "todo": { label: "To Do", color: "bg-gray-500", icon: Clock },
  "in_progress": { label: "In Progress", color: "bg-blue-500", icon: AlertCircle },
  "done": { label: "Done", color: "bg-green-500", icon: CheckCircle }
};

const priorityConfig = {
  "low": { label: "Low", color: "text-green-600 bg-green-50 border-green-200" },
  "medium": { label: "Medium", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  "high": { label: "High", color: "text-orange-600 bg-orange-50 border-orange-200" },
  "critical": { label: "Critical", color: "text-red-600 bg-red-50 border-red-200" }
};

export default function ProjectPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    tags: [],
    sprintId: ""
  });

  const [currentView, setCurrentView] = useState<"kanban" | "gantt" | "sprints">("kanban");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch project tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskForm) => {
      return await apiRequest("POST", `/api/projects/${projectId}/tasks`, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      setIsCreateTaskOpen(false);
      setTaskForm({ title: "", description: "", status: "todo", priority: "medium", tags: [], sprintId: "" });
      toast({
        title: "Task created",
        description: "Your new task has been added to the project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      console.log("Updating task:", taskId, "with updates:", updates);
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
      return response;
    },
    onSuccess: (updatedTask) => {
      console.log("Task update successful:", updatedTask);
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      toast({
        title: "Task updated",
        description: "Task status changed successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Task update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!taskForm.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required.",
        variant: "destructive"
      });
      return;
    }
    createTaskMutation.mutate(taskForm);
  };

  const handleUpdateTaskStatus = async (taskId: string, status: "todo" | "in_progress" | "done") => {
    console.log("Status update clicked:", taskId, "->", status);
    
    // Optimistically update the UI first
    const currentTasks = queryClient.getQueryData<Task[]>([`/api/projects/${projectId}/tasks`]) || [];
    const updatedTasks = currentTasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    );
    queryClient.setQueryData([`/api/projects/${projectId}/tasks`], updatedTasks);
    
    // Then update the server
    updateTaskMutation.mutate({ taskId, updates: { status } });
  };

  const tasksByStatus = {
    "todo": tasks.filter(task => task.status === "todo"),
    "in_progress": tasks.filter(task => task.status === "in_progress"),
    "done": tasks.filter(task => task.status === "done")
  };

  if (projectLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading project from Google Drive...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Project Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Cloud className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h1>
                <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                  {project.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-task" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Task Title</Label>
                      <Input
                        id="task-title"
                        data-testid="input-task-title"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        data-testid="textarea-task-description"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the task"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task-status">Status</Label>
                        <select
                          id="task-status"
                          data-testid="select-task-status"
                          value={taskForm.status}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value as "todo" | "in_progress" | "done" }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="task-priority">Priority</Label>
                        <select
                          id="task-priority"
                          data-testid="select-task-priority"
                          value={taskForm.priority}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as "low" | "medium" | "high" }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        data-testid="button-create-task"
                        onClick={handleCreateTask}
                        disabled={createTaskMutation.isPending}
                      >
                        {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Info */}
        <div className="mb-6">
          {project.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
          )}
          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Created {format(new Date(project.createdAt), "MMM d, yyyy")}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {project.memberEmails?.length || 0} members
            </div>
            <div className="flex items-center">
              <Cloud className="h-4 w-4 mr-1" />
              Stored in Google Drive
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <Button
            variant={currentView === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentView("kanban")}
            data-testid="button-view-kanban"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={currentView === "gantt" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentView("gantt")}
            data-testid="button-view-gantt"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button
            variant={currentView === "sprints" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentView("sprints")}
            data-testid="button-view-sprints"
          >
            <Flag className="h-4 w-4 mr-2" />
            Sprints
          </Button>
        </div>

        {/* Main Content Area */}
        {currentView === "kanban" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
            const config = statusConfig[status];
            const statusTasks = tasksByStatus[status];
            
            return (
              <div key={status} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{config.label}</h3>
                      <Badge variant="secondary">{statusTasks.length}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4 min-h-[400px]">
                  {statusTasks.map((task) => (
                    <Card 
                      key={task.id} 
                      data-testid={`task-card-${task.id}`}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {task.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${priorityConfig[task.priority].color}`}
                          >
                            {priorityConfig[task.priority].label}
                          </Badge>
                          <div className="flex space-x-1">
                            {status !== "todo" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateTaskStatus(task.id, "todo")}
                                className="h-6 px-2 text-xs"
                              >
                                ← To Do
                              </Button>
                            )}
                            {status !== "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                                className="h-6 px-2 text-xs"
                              >
                                {status === "todo" ? "Start →" : "← In Progress"}
                              </Button>
                            )}
                            {status !== "done" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateTaskStatus(task.id, "done")}
                                className="h-6 px-2 text-xs"
                              >
                                Done →
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <config.icon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No {config.label.toLowerCase()} tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* AI Suggestions Section - Only show in Kanban view */}
        {currentView === "kanban" && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  AI suggestions will appear here based on your project progress and team activity. 
                  This feature uses Google's Gemini AI to provide intelligent recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gantt Chart View */}
        {currentView === "gantt" && (
          <div className="space-y-6">
            <GanttChart tasks={tasks} title="Project Timeline" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Timer className="h-5 w-5" />
                    <span>Time Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Select a task to track time and view details</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Comments & Updates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Comments feature coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Sprint Management View */}
        {currentView === "sprints" && (
          <SprintManager projectId={projectId!} tasks={tasks} />
        )}
      </div>
    </div>
  );
}