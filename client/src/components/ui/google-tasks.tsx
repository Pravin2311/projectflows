import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  Calendar, 
  RotateCcw,
  ListTodo,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface GoogleTaskList {
  id: string;
  title: string;
  selfLink: string;
  updated: string;
}

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated: string;
  selfLink: string;
  parent?: string;
  position: string;
}

interface GoogleTasksProps {
  projectId?: string;
  showSync?: boolean;
}

export function GoogleTasks({ projectId, showSync = true }: GoogleTasksProps) {
  const [selectedTaskList, setSelectedTaskList] = useState<string>("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task lists
  const { data: taskLists = [], isLoading: isLoadingLists } = useQuery<GoogleTaskList[]>({
    queryKey: ['/api/google/tasklists'],
    queryFn: async () => {
      const response = await fetch('/api/google/tasklists', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch task lists');
      return response.json();
    },
  });

  // Fetch tasks for selected list
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<GoogleTask[]>({
    queryKey: ['/api/google/tasklists', selectedTaskList, 'tasks'],
    queryFn: async () => {
      const response = await fetch(`/api/google/tasklists/${selectedTaskList}/tasks`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    enabled: !!selectedTaskList
  });

  // Create task list mutation
  const createTaskListMutation = useMutation({
    mutationFn: (title: string) => apiRequest('POST', '/api/google/tasklists', { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/tasklists'] });
      setIsCreateListOpen(false);
      setNewListTitle("");
      toast({
        title: "Task list created",
        description: "New Google Tasks list has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task list.",
        variant: "destructive",
      });
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: { title: string; notes?: string; due?: string }) => 
      apiRequest('POST', `/api/google/tasklists/${selectedTaskList}/tasks`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/tasklists', selectedTaskList, 'tasks'] });
      setIsCreateTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskNotes("");
      setNewTaskDue("");
      toast({
        title: "Task created",
        description: "New task has been added to Google Tasks.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId }: { taskId: string }) => 
      apiRequest('POST', `/api/google/tasklists/${selectedTaskList}/tasks/${taskId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/tasklists', selectedTaskList, 'tasks'] });
      toast({
        title: "Task completed",
        description: "Task has been marked as completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete task.",
        variant: "destructive",
      });
    }
  });

  // Sync project tasks mutation
  const syncProjectTasksMutation = useMutation({
    mutationFn: ({ tasklistId }: { tasklistId: string }) => 
      apiRequest('POST', `/api/projects/${projectId}/sync-google-tasks`, { tasklistId }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/tasklists', selectedTaskList, 'tasks'] });
      toast({
        title: "Tasks synced",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to sync project tasks.",
        variant: "destructive",
      });
    }
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title is required.",
        variant: "destructive"
      });
      return;
    }

    createTaskMutation.mutate({
      title: newTaskTitle,
      notes: newTaskNotes || undefined,
      due: newTaskDue || undefined
    });
  };

  const handleCreateTaskList = () => {
    if (!newListTitle.trim()) {
      toast({
        title: "Error",
        description: "Task list title is required.",
        variant: "destructive"
      });
      return;
    }

    createTaskListMutation.mutate(newListTitle);
  };

  const handleSyncTasks = () => {
    if (!selectedTaskList) {
      toast({
        title: "Error",
        description: "Please select a task list first.",
        variant: "destructive"
      });
      return;
    }

    syncProjectTasksMutation.mutate({ tasklistId: selectedTaskList });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Google Tasks Integration
        </CardTitle>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedTaskList}
            onChange={(e) => setSelectedTaskList(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="">Select a task list</option>
            {taskLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.title}
              </option>
            ))}
          </select>
          
          <Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-create-tasklist">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="list-title">Task List Title</Label>
                  <Input
                    id="list-title"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Enter task list name"
                    data-testid="input-list-title"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateListOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateTaskList}
                    disabled={createTaskListMutation.isPending}
                    data-testid="button-create-list"
                  >
                    Create List
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoadingLists ? (
          <div className="text-center py-4">Loading task lists...</div>
        ) : taskLists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No Google Tasks lists found. Create one to get started.
          </div>
        ) : !selectedTaskList ? (
          <div className="text-center py-8 text-gray-500">
            Select a task list to view and manage tasks.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-create-task">
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
                      <Label htmlFor="task-title">Title</Label>
                      <Input
                        id="task-title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title"
                        data-testid="input-task-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-notes">Notes</Label>
                      <Textarea
                        id="task-notes"
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        placeholder="Add task notes (optional)"
                        rows={3}
                        data-testid="textarea-task-notes"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-due">Due Date</Label>
                      <Input
                        id="task-due"
                        type="datetime-local"
                        value={newTaskDue}
                        onChange={(e) => setNewTaskDue(e.target.value)}
                        data-testid="input-task-due"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateTask}
                        disabled={createTaskMutation.isPending}
                        data-testid="button-save-task"
                      >
                        Create Task
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {showSync && projectId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncTasks}
                  disabled={syncProjectTasksMutation.isPending}
                  data-testid="button-sync-tasks"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Sync Project Tasks
                </Button>
              )}
            </div>

            {/* Tasks list */}
            {isLoadingTasks ? (
              <div className="text-center py-4">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tasks in this list. Create one to get started.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    data-testid={`task-${task.id}`}
                  >
                    <button
                      onClick={() => completeTaskMutation.mutate({ taskId: task.id })}
                      className="mt-1 text-gray-400 hover:text-blue-600"
                      disabled={completeTaskMutation.isPending}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm font-medium ${
                          task.status === 'completed' 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-900'
                        }`}>
                          {task.title}
                        </p>
                        
                        <Badge variant={task.status === 'completed' ? 'secondary' : 'default'}>
                          {task.status === 'completed' ? 'Done' : 'Active'}
                        </Badge>
                      </div>
                      
                      {task.notes && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {task.notes}
                        </p>
                      )}
                      
                      {task.due && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            Due: {format(new Date(task.due), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(task.selfLink, '_blank')}
                      data-testid={`button-open-task-${task.id}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}