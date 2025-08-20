import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Users, 
  Shield, 
  Trash2, 
  Archive,
  Globe,
  Lock,
  Eye,
  Calendar,
  Clock,
  Bell,
  Save,
  Loader2,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Project } from '@shared/schema';

interface ProjectSettingsProps {
  project: Project;
  onSave?: (settings: any) => void;
  onDelete?: () => void;
}

export function ProjectSettings({ project, onSave, onDelete }: ProjectSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status || 'active',
    visibility: 'private', // 'public', 'private', 'team'
    category: 'business', // 'business', 'personal', 'education', 'nonprofit'
    tags: project.tags || [],
    defaultView: 'kanban' // 'kanban', 'list', 'gantt', 'calendar'
  });

  // Team Settings
  const [teamSettings, setTeamSettings] = useState({
    allowInvitations: true,
    defaultRole: 'member', // 'admin', 'member', 'viewer'
    requireApproval: false,
    maxMembers: 50,
    allowGuestAccess: false,
    teamVisibility: 'members' // 'members', 'admins'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssignments: true,
    statusUpdates: true,
    dueDateReminders: true,
    newComments: true,
    teamChanges: true,
    projectMilestones: true,
    emailDigest: 'weekly', // 'daily', 'weekly', 'never'
    slackIntegration: false
  });

  // Automation Settings
  const [automationSettings, setAutomationSettings] = useState({
    autoAssignTasks: false,
    statusTransitions: true,
    dueDateReminders: true,
    timeTracking: true,
    aiSuggestions: true,
    smartScheduling: false,
    autoArchiveCompleted: false,
    recurringTasks: false
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      return apiRequest('PATCH', `/api/projects/${project.id}`, projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
      toast({
        title: 'Project Updated',
        description: 'Project settings have been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update project settings',
        variant: 'destructive',
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/projects/${project.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Project Deleted',
        description: 'The project has been permanently deleted.',
      });
      onDelete?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete project',
        variant: 'destructive',
      });
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const allSettings = {
        ...generalSettings,
        teamSettings,
        notificationSettings,
        automationSettings
      };
      
      await updateProjectMutation.mutateAsync(allSettings);
      onSave?.(allSettings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteProjectMutation.mutate();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Project Settings</span>
        </CardTitle>
        <CardDescription>
          Configure project preferences, team access, and automation rules.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-1">
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Team</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-1">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Automation</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={generalSettings.name}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                  data-testid="input-project-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Description</Label>
                <Textarea
                  id="projectDescription"
                  value={generalSettings.description}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, description: e.target.value })}
                  placeholder="Describe your project..."
                  rows={3}
                  data-testid="textarea-project-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectStatus">Status</Label>
                  <Select value={generalSettings.status} onValueChange={(value) => setGeneralSettings({ ...generalSettings, status: value })}>
                    <SelectTrigger data-testid="select-project-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectVisibility">Visibility</Label>
                  <Select value={generalSettings.visibility} onValueChange={(value) => setGeneralSettings({ ...generalSettings, visibility: value })}>
                    <SelectTrigger data-testid="select-project-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>Private</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="team">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Team Only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>Public</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectCategory">Category</Label>
                  <Select value={generalSettings.category} onValueChange={(value) => setGeneralSettings({ ...generalSettings, category: value })}>
                    <SelectTrigger data-testid="select-project-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="nonprofit">Non-profit</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultView">Default View</Label>
                  <Select value={generalSettings.defaultView} onValueChange={(value) => setGeneralSettings({ ...generalSettings, defaultView: value })}>
                    <SelectTrigger data-testid="select-default-view">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kanban">Kanban Board</SelectItem>
                      <SelectItem value="list">List View</SelectItem>
                      <SelectItem value="gantt">Gantt Chart</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Team Access</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Role</Label>
                    <Select value={teamSettings.defaultRole} onValueChange={(value) => setTeamSettings({ ...teamSettings, defaultRole: value })}>
                      <SelectTrigger data-testid="select-default-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - Read only</SelectItem>
                        <SelectItem value="member">Member - Can edit tasks</SelectItem>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Members</Label>
                    <Input
                      type="number"
                      value={teamSettings.maxMembers}
                      onChange={(e) => setTeamSettings({ ...teamSettings, maxMembers: parseInt(e.target.value) || 50 })}
                      min="1"
                      max="500"
                      data-testid="input-max-members"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(teamSettings).filter(([key]) => typeof teamSettings[key as keyof typeof teamSettings] === 'boolean').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {getTeamSettingDescription(key)}
                        </p>
                      </div>
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => 
                          setTeamSettings({ ...teamSettings, [key]: checked })
                        }
                        data-testid={`switch-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Digest Frequency</Label>
                  <Select value={notificationSettings.emailDigest} onValueChange={(value) => setNotificationSettings({ ...notificationSettings, emailDigest: value })}>
                    <SelectTrigger data-testid="select-email-digest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {Object.entries(notificationSettings).filter(([key]) => typeof notificationSettings[key as keyof typeof notificationSettings] === 'boolean').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {getNotificationDescription(key)}
                        </p>
                      </div>
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ ...notificationSettings, [key]: checked })
                        }
                        data-testid={`switch-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Automation Settings */}
          <TabsContent value="automation" className="space-y-4">
            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Automation features help streamline your project management by handling routine tasks automatically.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {Object.entries(automationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {getAutomationDescription(key)}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setAutomationSettings({ ...automationSettings, [key]: checked })
                      }
                      data-testid={`switch-${key}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Danger Zone */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These actions are permanent and cannot be undone. Your project data will be removed from Google Drive.
            </AlertDescription>
          </Alert>
          <div className="flex space-x-2">
            <Button variant="outline" className="text-orange-600 border-orange-600">
              <Archive className="mr-2 h-4 w-4" />
              Archive Project
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteProjectMutation.isPending}
              data-testid="button-delete-project"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || updateProjectMutation.isPending}
            data-testid="button-save-project-settings"
          >
            {isSaving || updateProjectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getTeamSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    allowInvitations: 'Allow team members to invite others to the project',
    requireApproval: 'Require admin approval for new team members',
    allowGuestAccess: 'Allow temporary guest access for external collaborators',
    teamVisibility: 'Who can see the team member list'
  };
  return descriptions[key] || 'Configure this team setting';
}

function getNotificationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    taskAssignments: 'Notify when tasks are assigned or reassigned',
    statusUpdates: 'Notify when task or project status changes',
    dueDateReminders: 'Send reminders about upcoming due dates',
    newComments: 'Notify about new comments and discussions',
    teamChanges: 'Notify when team members join or leave',
    projectMilestones: 'Notify when milestones are reached',
    slackIntegration: 'Send notifications to connected Slack channels'
  };
  return descriptions[key] || 'Configure this notification setting';
}

function getAutomationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    autoAssignTasks: 'Automatically assign tasks based on workload and expertise',
    statusTransitions: 'Auto-move tasks through workflow stages',
    dueDateReminders: 'Automatically send due date reminders',
    timeTracking: 'Enable automatic time tracking for tasks',
    aiSuggestions: 'Get AI-powered project optimization suggestions',
    smartScheduling: 'Use AI to optimize task scheduling and dependencies',
    autoArchiveCompleted: 'Automatically archive completed tasks after 30 days',
    recurringTasks: 'Enable creation of recurring tasks and templates'
  };
  return descriptions[key] || 'Configure this automation setting';
}