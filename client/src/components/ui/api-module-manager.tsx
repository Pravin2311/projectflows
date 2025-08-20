import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Settings, Loader2, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// API module definitions
const apiModules = [
  {
    key: 'docs',
    name: 'Google Docs API',
    icon: '📄',
    description: 'Create, edit, and manage Google Docs from your projects',
    scopes: ['https://www.googleapis.com/auth/documents'],
    benefits: ['Document templates', 'Collaborative editing', 'Project documentation']
  },
  {
    key: 'sheets',
    name: 'Google Sheets API',
    icon: '📊',
    description: 'Create and manage spreadsheets for project data',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    benefits: ['Budget tracking', 'Time sheets', 'Data analysis']
  },
  {
    key: 'gmail',
    name: 'Gmail API',
    icon: '📧',
    description: 'Send email notifications and project updates',
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    benefits: ['Team notifications', 'Task reminders', 'Progress reports']
  },
  {
    key: 'calendar',
    name: 'Google Calendar API',
    icon: '📅',
    description: 'Sync project deadlines and meeting schedules',
    scopes: ['https://www.googleapis.com/auth/calendar'],
    benefits: ['Deadline tracking', 'Meeting scheduling', 'Timeline views']
  },
  {
    key: 'tasks',
    name: 'Google Tasks API',
    icon: '✅',
    description: 'Integrate with Google Tasks for personal todo management',
    scopes: ['https://www.googleapis.com/auth/tasks'],
    benefits: ['Personal task sync', 'Mobile access', 'Quick capture']
  },
  {
    key: 'contacts',
    name: 'Google Contacts API',
    icon: '👥',
    description: 'Access contacts for team member suggestions',
    scopes: ['https://www.googleapis.com/auth/contacts.readonly'],
    benefits: ['Smart member suggestions', 'Contact integration', 'Team directory']
  }
];

export function ApiModuleManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localEnabledApis, setLocalEnabledApis] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current API settings
  const { data: apiSettings, isLoading, error } = useQuery({
    queryKey: ['/api/google-apis/enabled'],
    retry: false
  });

  // Update API settings mutation
  const updateApisMutation = useMutation({
    mutationFn: async (enabledApis: Record<string, boolean>) => {
      return apiRequest('POST', '/api/google-apis/update', { enabledApis });
    },
    onSuccess: (data) => {
      toast({
        title: 'Settings Updated',
        description: 'Your Google API modules have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/google-apis/enabled'] });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update API settings',
        variant: 'destructive',
      });
    },
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (apiSettings && typeof apiSettings === 'object' && 'enabledApis' in apiSettings) {
      setLocalEnabledApis(apiSettings.enabledApis as Record<string, boolean>);
    }
  }, [apiSettings]);

  const handleToggleApi = (apiKey: string) => {
    const updatedApis = {
      ...localEnabledApis,
      [apiKey]: !localEnabledApis[apiKey]
    };
    
    setLocalEnabledApis(updatedApis);
    
    // Check if there are changes from original
    const originalApis = (apiSettings && typeof apiSettings === 'object' && 'enabledApis' in apiSettings) ? apiSettings.enabledApis : {};
    const hasChangesNow = JSON.stringify(updatedApis) !== JSON.stringify(originalApis);
    setHasChanges(hasChangesNow);
  };

  const handleSaveChanges = () => {
    updateApisMutation.mutate(localEnabledApis);
  };

  const handleResetChanges = () => {
    const originalApis = (apiSettings && typeof apiSettings === 'object' && 'enabledApis' in apiSettings) ? apiSettings.enabledApis as Record<string, boolean> : {};
    setLocalEnabledApis(originalApis);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading API settings...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need to complete your Google API setup first before managing individual modules.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Google API Modules</span>
        </CardTitle>
        <CardDescription>
          Enable or disable Google services for your projects. Changes affect all your projects immediately.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Core APIs - Always Enabled */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">Core Services (Always Enabled)</h3>
          
          <div className="flex items-center justify-between p-4 border rounded-lg bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔐</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">Google OAuth API</h4>
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">User authentication and project access control</p>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-purple-600" />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💾</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Google Drive API</h4>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">Store and manage all your project data</p>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🤖</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Google Gemini AI</h4>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Required
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">AI-powered project insights and recommendations</p>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        {/* Optional APIs */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">Optional Services</h3>
          
          {apiModules.map((api) => (
            <div key={api.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{api.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{api.name}</h4>
                    {localEnabledApis[api.key] && (
                      <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Enabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{api.description}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Benefits:</strong> {api.benefits.join(', ')}
                  </div>
                </div>
              </div>
              <Switch
                checked={localEnabledApis[api.key] || false}
                onCheckedChange={() => handleToggleApi(api.key)}
                data-testid={`switch-${api.key}-api`}
              />
            </div>
          ))}
        </div>

        {/* Save/Reset Actions */}
        {hasChanges && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-orange-600 dark:text-orange-400">
              You have unsaved changes
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetChanges}
                data-testid="button-reset-api-changes"
              >
                Reset
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveChanges}
                disabled={updateApisMutation.isPending}
                data-testid="button-save-api-changes"
              >
                {updateApisMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}