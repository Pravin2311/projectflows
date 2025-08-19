import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Flag, Plus, Target, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";

interface Sprint {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
  goal?: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  sprintId?: string;
}

interface SprintManagerProps {
  projectId: string;
  tasks: Task[];
}

const statusConfig = {
  planned: { label: "Planned", color: "bg-gray-500", badgeVariant: "secondary" as const },
  active: { label: "Active", color: "bg-blue-500", badgeVariant: "default" as const },
  completed: { label: "Completed", color: "bg-green-500", badgeVariant: "outline" as const }
};

export function SprintManager({ projectId, tasks }: SprintManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    goal: ""
  });

  // Fetch sprints
  const { data: sprints = [] } = useQuery<Sprint[]>({
    queryKey: [`/api/projects/${projectId}/sprints`],
  });

  // Create sprint mutation
  const createSprintMutation = useMutation({
    mutationFn: async (sprintData: any) => {
      return await apiRequest("POST", `/api/projects/${projectId}/sprints`, sprintData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/sprints`] });
      setIsCreateSprintOpen(false);
      setSprintForm({ name: "", description: "", startDate: "", endDate: "", goal: "" });
      toast({
        title: "Sprint created",
        description: "New sprint has been added to the project.",
      });
    },
  });

  // Update sprint status mutation
  const updateSprintMutation = useMutation({
    mutationFn: async ({ sprintId, updates }: { sprintId: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/sprints/${sprintId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/sprints`] });
      toast({
        title: "Sprint updated",
        description: "Sprint status has been updated.",
      });
    },
  });

  const handleCreateSprint = () => {
    if (!sprintForm.name.trim() || !sprintForm.startDate || !sprintForm.endDate) {
      toast({
        title: "Missing required fields",
        description: "Please fill in sprint name, start date, and end date.",
        variant: "destructive"
      });
      return;
    }

    if (new Date(sprintForm.startDate) >= new Date(sprintForm.endDate)) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive"
      });
      return;
    }

    createSprintMutation.mutate({
      name: sprintForm.name,
      description: sprintForm.description,
      startDate: new Date(sprintForm.startDate).toISOString(),
      endDate: new Date(sprintForm.endDate).toISOString(),
      goal: sprintForm.goal,
      status: "planned"
    });
  };

  const handleSprintStatusChange = (sprintId: string, newStatus: string) => {
    updateSprintMutation.mutate({ sprintId, updates: { status: newStatus } });
  };

  const getSprintProgress = (sprint: Sprint) => {
    const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
    if (sprintTasks.length === 0) return 0;
    
    const completedTasks = sprintTasks.filter(task => task.status === "done").length;
    return Math.round((completedTasks / sprintTasks.length) * 100);
  };

  const getSprintTimeProgress = (sprint: Sprint) => {
    const now = new Date();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    
    if (isBefore(now, start)) return 0;
    if (isAfter(now, end)) return 100;
    
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(now, start);
    
    return Math.round((elapsedDays / totalDays) * 100);
  };

  const activeSprint = sprints.find(sprint => sprint.status === "active");
  const upcomingSprints = sprints.filter(sprint => sprint.status === "planned");
  const completedSprints = sprints.filter(sprint => sprint.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Sprint Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Organize work into focused sprints</p>
        </div>
        <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-sprint">
              <Plus className="h-4 w-4 mr-2" />
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sprint-name">Sprint Name</Label>
                <Input
                  id="sprint-name"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Sprint 1"
                />
              </div>
              <div>
                <Label htmlFor="sprint-goal">Sprint Goal</Label>
                <Input
                  id="sprint-goal"
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="What should this sprint achieve?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={sprintForm.startDate}
                    onChange={(e) => setSprintForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={sprintForm.endDate}
                    onChange={(e) => setSprintForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sprint-description">Description</Label>
                <Textarea
                  id="sprint-description"
                  value={sprintForm.description}
                  onChange={(e) => setSprintForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Sprint details..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateSprintOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSprint}
                  disabled={createSprintMutation.isPending}
                >
                  {createSprintMutation.isPending ? "Creating..." : "Create Sprint"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Flag className="h-5 w-5 text-blue-600" />
                  <span>{activeSprint.name}</span>
                  <Badge variant="default">Active</Badge>
                </CardTitle>
                {activeSprint.goal && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center">
                    <Target className="h-3 w-3 mr-1" />
                    {activeSprint.goal}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSprintStatusChange(activeSprint.id, "completed")}
              >
                Complete Sprint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sprint Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Task Progress</span>
                  <span>{getSprintProgress(activeSprint)}% complete</span>
                </div>
                <Progress value={getSprintProgress(activeSprint)} className="h-2" />
              </div>

              {/* Time Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Time Progress</span>
                  <span>{getSprintTimeProgress(activeSprint)}% elapsed</span>
                </div>
                <Progress value={getSprintTimeProgress(activeSprint)} className="h-2" />
              </div>

              {/* Sprint Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(activeSprint.startDate), "MMM d")} - {format(new Date(activeSprint.endDate), "MMM d")}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Users className="h-4 w-4 mr-2" />
                  {tasks.filter(task => task.sprintId === activeSprint.id).length} tasks
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sprints */}
      {upcomingSprints.length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-3">Upcoming Sprints</h3>
          <div className="space-y-3">
            {upcomingSprints.map((sprint) => (
              <Card key={sprint.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <span>{sprint.name}</span>
                        <Badge variant="secondary">Planned</Badge>
                      </CardTitle>
                      {sprint.goal && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {sprint.goal}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSprintStatusChange(sprint.id, "active")}
                      disabled={!!activeSprint}
                    >
                      Start Sprint
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d")}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {tasks.filter(task => task.sprintId === sprint.id).length} tasks
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-3">Completed Sprints</h3>
          <div className="space-y-2">
            {completedSprints.slice(0, 3).map((sprint) => (
              <Card key={sprint.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium flex items-center space-x-2">
                        <span>{sprint.name}</span>
                        <Badge variant="outline">Completed</Badge>
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{getSprintProgress(sprint)}% complete</div>
                      <div className="text-xs text-gray-500">
                        {tasks.filter(task => task.sprintId === sprint.id).length} tasks
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sprints.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Flag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No sprints created yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first sprint to start organizing work</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}