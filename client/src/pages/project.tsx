import { useState, useEffect } from "react";
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
  MessageSquare,
  AtSign,
  Link2,
  Paperclip,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Project, Task } from "@shared/schema";
import { RichCommentEditor } from "@/components/ui/rich-comment-editor";
import { TeamMembers } from "@/components/ui/team-members";
import { ProjectSettings } from "@/components/ui/project-settings";

interface TaskForm {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assignee: string;
  startDate?: string;
  dueDate: string;
  estimatedHours: number;
  tags: string[];
  sprintId: string;
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

  // Redirect to dashboard if no project ID or if it's undefined
  useEffect(() => {
    if (!projectId || projectId === 'undefined') {
      console.log('Invalid project ID detected, redirecting to dashboard:', projectId);
      window.location.href = '/dashboard';
      return;
    }
  }, [projectId]);

  // Early return if no valid project ID
  if (!projectId || projectId === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Redirecting...</h2>
          <p className="text-gray-600 mt-2">Taking you back to the dashboard</p>
        </div>
      </div>
    );
  }
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    tags: [],
    sprintId: "",
    assignee: "",
    dueDate: "",
    estimatedHours: 0
  });

  const [currentView, setCurrentView] = useState<"kanban" | "gantt" | "sprints">("kanban");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [newComment, setNewComment] = useState("");

  // Fetch auth status for Gmail capability
  const { data: authStatus } = useQuery({
    queryKey: ['/api/auth/status'],
  });

  // Gmail reauthorization using popup-based OAuth (works on any domain)
  const reauthorizeGmailMutation = useMutation({
    mutationFn: async () => {
      // Get Google config from session
      const response = await apiRequest("GET", "/api/auth/status");
      const authStatus = await response.json();
      
      if (!authStatus.hasGoogleConfig) {
        throw new Error('Google configuration not found');
      }
      
      // Use dynamic import to load Google auth
      const { createGoogleAuth } = await import('@/lib/googleAuth');
      const googleAuth = createGoogleAuth();
      
      // Try to get existing token first
      let googleUser = await googleAuth.getExistingToken();
      
      // If no existing token or missing scopes, do popup sign-in
      if (!googleUser) {
        googleUser = await googleAuth.signInWithPopup();
      }
      
      // Send the token to the server to update user session
      const tokenResponse = await apiRequest("POST", "/api/auth/update-google-token", {
        accessToken: googleUser.access_token,
        refreshToken: googleUser.refresh_token,
        scope: googleUser.scope,
        expiresIn: googleUser.expires_in
      });
      
      return await tokenResponse.json();
    },
    onSuccess: (data: any) => {
      console.log('Gmail authorization complete:', data);
      toast({
        title: "Gmail connected successfully!",
        description: "You can now send email invitations to team members.",
      });
      // Refresh auth status to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
    },
    onError: (error: Error) => {
      console.error('Gmail authorization error:', error);
      
      // Don't show error toast if user simply cancelled the popup
      if (error.message.includes('cancelled') || error.message.includes('closed')) {
        return;
      }
      
      // Show user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('Popup blocked')) {
        errorMessage = 'Please enable popups for this site and try again.';
      } else if (error.message.includes('timed out')) {
        errorMessage = 'Connection timed out. Please try again.';
      }
      
      toast({
        title: "Gmail connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

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

  // Fetch comments for selected task
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = useQuery<any[]>({
    queryKey: [`/api/tasks/${selectedTask?.id}/comments`],
    enabled: !!selectedTask?.id,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskForm) => {
      return await apiRequest("POST", `/api/projects/${projectId}/tasks`, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      setIsCreateTaskOpen(false);
      setTaskForm({ title: "", description: "", status: "todo", priority: "medium", tags: [], sprintId: "", assignee: "", dueDate: "", estimatedHours: 0 });
      setAttachments([]);
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
      console.log("Frontend: Updating task:", taskId, "with updates:", updates);
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
      console.log("Frontend: Server response:", response);
      return response;
    },
    onSuccess: (updatedTask) => {
      console.log("Task update successful, response:", updatedTask);
      // Force refetch to get the updated task from server
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      toast({
        title: "Task updated",
        description: "Task status changed successfully.",
      });
    },
    onError: (error: Error, variables) => {
      console.error("Task update failed, reverting optimistic update:", error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
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
    
    // Prepare task data with proper formatting
    const taskData: any = {
      ...taskForm,
      dueDate: taskForm.dueDate || undefined,
      startDate: taskForm.startDate || undefined,
      assigneeId: taskForm.assignee || undefined,
      attachments: attachments.map(file => file.name), // Store file names for now
    };
    
    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTaskStatus = async (taskId: string, status: "todo" | "in_progress" | "done") => {
    console.log("Status update clicked:", taskId, "->", status);
    
    // Auto-update progress based on status
    let progress = 0;
    if (status === "in_progress") progress = 10;
    if (status === "done") progress = 100;
    
    // Update the server directly
    updateTaskMutation.mutate({ taskId, updates: { status, progress } });
  };

  const handleUpdateTaskTime = (taskId: string, actualHours: number) => {
    updateTaskMutation.mutate({ taskId, updates: { actualHours } });
  };

  const handleUpdateTaskProgress = (taskId: string, progress: number) => {
    updateTaskMutation.mutate({ taskId, updates: { progress } });
  };

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "member" | "admin" }) => {
      return await apiRequest("POST", `/api/projects/${projectId}/members`, { email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      setIsInviteMemberOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      toast({
        title: "Invitation sent",
        description: "Email invitation has been sent using Google Gmail API.",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to invite member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite team member.",
        variant: "destructive",
      });
    },
  });

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Email address is required.",
        variant: "destructive"
      });
      return;
    }
    
    inviteMemberMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
    // Comments will be automatically loaded by React Query when selectedTask changes
  };

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: {
      content: string;
      mentions: string[];
      attachments: File[];
      taskLinks: string[];
    }) => {
      if (!selectedTask) throw new Error("No task selected");
      
      // For now, we'll store attachment names only
      // In production, you'd upload files to object storage first
      const attachmentNames = commentData.attachments.map(file => file.name);
      
      return await apiRequest("POST", `/api/tasks/${selectedTask.id}/comments`, {
        content: commentData.content,
        mentions: commentData.mentions,
        attachments: attachmentNames,
        taskLinks: commentData.taskLinks,
      });
    },
    onSuccess: () => {
      refetchComments(); // Refetch comments after successful creation
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added to the task.",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
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
              {/* Gmail Status & Reauthorization */}
              {authStatus && !(authStatus as any)?.hasGmailScope && (authStatus as any)?.isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reauthorizeGmailMutation.mutate()}
                  disabled={reauthorizeGmailMutation.isPending}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  data-testid="button-reauth-gmail"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Connect Gmail (1-Click)
                </Button>
              )}
              
              {/* AI Insights Button */}
              <Link href={`/project/${projectId}/insights`}>
                <Button variant="outline" size="sm" data-testid="button-ai-insights">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Insights
                </Button>
              </Link>

              {/* Project Settings Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsProjectSettingsOpen(true)}
                data-testid="button-project-settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              {/* Invite Team Member Button */}
              <Dialog open={isInviteMemberOpen} onOpenChange={setIsInviteMemberOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-invite-member">
                    <Users className="h-4 w-4 mr-2" />
                    Invite Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        data-testid="input-invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="invite-role">Role</Label>
                      <select
                        id="invite-role"
                        data-testid="select-invite-role"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="member">Member - Can view and edit tasks</option>
                        <option value="admin">Admin - Full project access</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsInviteMemberOpen(false)}
                        data-testid="button-cancel-invite"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInviteMember}
                        disabled={inviteMemberMutation.isPending}
                        data-testid="button-send-invite"
                      >
                        {inviteMemberMutation.isPending ? "Sending..." : "Send Invite"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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
              {project.memberEmails?.length || 1} members
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

        {/* Team Members Section */}
        <div className="mb-6">
          <TeamMembers 
            projectId={projectId!} 
            onAddMember={() => setIsInviteMemberOpen(true)}
          />
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
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(task.id, "todo");
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                ← To Do
                              </Button>
                            )}
                            {status !== "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(task.id, "in_progress");
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                {status === "todo" ? "Start →" : "← In Progress"}
                              </Button>
                            )}
                            {status !== "done" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(task.id, "done");
                                }}
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

      {/* Enhanced Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-title">Title *</Label>
                <Input
                  id="task-title"
                  data-testid="input-task-title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  data-testid="select-task-priority"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                data-testid="textarea-task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-assignee">Assign To</Label>
                <Input
                  id="task-assignee"
                  data-testid="input-task-assignee"
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                  placeholder="Enter email or name..."
                />
              </div>
              <div>
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  data-testid="input-task-due-date"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="task-estimated-hours">Estimated Hours</Label>
              <Input
                id="task-estimated-hours"
                data-testid="input-task-estimated-hours"
                type="number"
                min="0"
                step="0.5"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="task-attachments">Attach Files</Label>
              <Input
                id="task-attachments"
                data-testid="input-task-attachments"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateTaskOpen(false)}
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
                data-testid="button-create-task"
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Popup */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTask?.title}</span>
              <Badge className={priorityConfig[selectedTask?.priority || 'medium'].color}>
                {priorityConfig[selectedTask?.priority || 'medium'].label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6 pb-4">
              <div className="flex items-center space-x-4">
                <Badge className={`${statusConfig[selectedTask.status].color} text-white`}>
                  {statusConfig[selectedTask.status].label}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created {format(new Date(selectedTask.createdAt), 'MMM d, yyyy')}
                </span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Task Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span>{statusConfig[selectedTask.status].label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority:</span>
                      <span>{priorityConfig[selectedTask.priority].label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Progress:</span>
                      <span>{selectedTask.progress}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time Spent:</span>
                      <span>{selectedTask.actualHours}h</span>
                    </div>
                    {selectedTask.assigneeId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Assigned to:</span>
                        <span>{selectedTask.assigneeId}</span>
                      </div>
                    )}
                    {selectedTask.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span>{format(new Date(selectedTask.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Attachments:</span>
                        <span>{selectedTask.attachments.length} file(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Actions</h4>
                  <div className="space-y-2">
                    {selectedTask.status === "todo" && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          handleUpdateTaskStatus(selectedTask.id, "in_progress");
                          setIsTaskDetailOpen(false);
                        }}
                        data-testid="button-start-task"
                      >
                        Start Task
                      </Button>
                    )}
                    {selectedTask.status === "in_progress" && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          handleUpdateTaskStatus(selectedTask.id, "done");
                          setIsTaskDetailOpen(false);
                        }}
                        data-testid="button-complete-task"
                      >
                        Mark Complete
                      </Button>
                    )}
                    {selectedTask.status === "done" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          handleUpdateTaskStatus(selectedTask.id, "in_progress");
                          setIsTaskDetailOpen(false);
                        }}
                        data-testid="button-reopen-task"
                      >
                        Reopen Task
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Tracker Component */}
              <TimeTracker
                taskId={selectedTask.id}
                currentHours={selectedTask.actualHours || 0}
                currentProgress={selectedTask.progress || 0}
                estimatedHours={selectedTask.estimatedHours}
                onUpdateTime={(hours) => handleUpdateTaskTime(selectedTask.id, hours)}
                onUpdateProgress={(progress) => handleUpdateTaskProgress(selectedTask.id, progress)}
              />

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Attachments & Reports</h4>
                <p className="text-sm text-gray-500 mb-3">File attachments and reports will be stored in your Google Drive.</p>
                
                {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTask.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded-lg">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{attachment}</span>
                        <Button variant="outline" size="sm" className="ml-auto">
                          Download
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="mt-2">
                      Add More Files
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No attachments yet</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Files
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Comments ({comments.length})</h4>
                <div className="space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-3">
                    {comments.length > 0 ? (
                      comments.map((comment, index) => (
                        <div key={comment.id || index} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                              {comment.author?.firstName?.[0] || comment.authorId?.[0] || 'U'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : comment.authorId}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a') : 'Just now'}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                              
                              {/* Show mentions */}
                              {comment.mentions && comment.mentions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comment.mentions.map((mentionId: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      <AtSign className="h-3 w-3 mr-1" />
                                      User {mentionId}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {/* Show task links */}
                              {comment.taskLinks && comment.taskLinks.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comment.taskLinks.map((taskId: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      <Link2 className="h-3 w-3 mr-1" />
                                      Task {taskId}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {/* Show attachments */}
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {comment.attachments.map((attachment: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                                      <Paperclip className="h-3 w-3" />
                                      <span>{attachment}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No comments yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <RichCommentEditor
                      projectId={projectId!}
                      value={newComment}
                      onChange={setNewComment}
                      onSubmit={addCommentMutation.mutate}
                      disabled={addCommentMutation.isPending}
                      submitText={addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Project Settings Dialog */}
      {project && (
        <Dialog open={isProjectSettingsOpen} onOpenChange={setIsProjectSettingsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-project-settings">
            <div className="py-4">
              <ProjectSettings 
                project={project}
                onSave={(settings) => {
                  console.log('Project settings saved:', settings);
                  setIsProjectSettingsOpen(false);
                }}
                onDelete={() => {
                  setIsProjectSettingsOpen(false);
                  // Redirect to dashboard after deletion
                  setTimeout(() => {
                    window.location.href = '/dashboard';
                  }, 1000);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}