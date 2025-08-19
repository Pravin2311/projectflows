import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { TopNavigation } from "@/components/ui/top-navigation";
import { KanbanBoard } from "@/components/ui/kanban-board";
import { AiSuggestions } from "@/components/ui/ai-suggestions";
import { TeamMembers } from "@/components/ui/team-members";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, User, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Project, Task, User as UserType } from "@shared/schema";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreateTaskData = z.infer<typeof createTaskSchema>;

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"board" | "list" | "timeline">("board");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<string>("todo");

  // Check authentication
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && !!user,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "tasks"],
    enabled: !!projectId && !!user,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/projects", projectId, "members"],
    enabled: !!projectId && !!user,
  });

  const form = useForm<CreateTaskData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assigneeId: "",
      dueDate: "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskData & { status: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/tasks`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "stats"] });
      setIsCreateTaskOpen(false);
      form.reset();
      toast({
        title: "Task Created",
        description: "Your task has been created successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "activities"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = (status: string) => {
    setCreateTaskStatus(status);
    setIsCreateTaskOpen(true);
  };

  const onSubmitTask = (data: CreateTaskData) => {
    const taskData = {
      ...data,
      status: createTaskStatus,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    };
    createTaskMutation.mutate(taskData);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ taskId, updates });
  };

  if (authLoading || projectLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-100 animate-pulse"></div>
        <div className="flex-1 p-6 space-y-6">
          <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen">
        <Sidebar projects={projects} />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project Not Found</h3>
                <p className="text-gray-600 mt-2">
                  The project you're looking for doesn't exist or you don't have access to it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar projects={projects} currentProject={project} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation 
          title={project.name} 
          subtitle={project.description || "Project workspace"}
          currentProject={project}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Main Kanban Board - 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Task Board</h2>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderLeftColor: project.color || '#7C3AED',
                      borderLeftWidth: '3px'
                    }}
                  >
                    {tasks.length} tasks
                  </Badge>
                </div>

                {tasksLoading ? (
                  <div className="grid grid-cols-3 gap-4 h-96">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-4">
                        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                        {[1, 2].map((j) => (
                          <div key={j} className="h-32 bg-gray-100 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <KanbanBoard
                    tasks={tasks}
                    onTaskUpdate={handleTaskUpdate}
                    onCreateTask={handleCreateTask}
                  />
                )}
              </div>
            </div>

            {/* Right Sidebar - 1 column */}
            <div className="space-y-6">
              <AiSuggestions projectId={project.id} />
              <TeamMembers projectId={project.id} />
              <ActivityFeed projectId={project.id} limit={8} />
            </div>
          </div>
        </main>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitTask)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter task title..." 
                        {...field} 
                        data-testid="input-task-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the task..." 
                        rows={3}
                        {...field} 
                        data-testid="textarea-task-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-assignee">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {members.map((member: any) => (
                            <SelectItem key={member.user.id} value={member.user.id}>
                              {member.user.firstName} {member.user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-task-due-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createTaskMutation.isPending}
                  data-testid="button-create-task"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateTaskOpen(false)}
                  data-testid="button-cancel-task"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
