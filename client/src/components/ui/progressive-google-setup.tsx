import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Key, Cloud, Shield, CheckCircle, Plus, Settings } from "lucide-react";
import { minimalGoogleConfigSchema, type GoogleApiConfig } from "@shared/schema";
import { z } from "zod";

interface ProgressiveGoogleSetupProps {
  onConfigSubmit: (config: GoogleApiConfig) => void;
  initialConfig?: GoogleApiConfig | null;
  isLoading?: boolean;
}

export function ProgressiveGoogleSetup({ onConfigSubmit, initialConfig, isLoading = false }: ProgressiveGoogleSetupProps) {
  const [activeTab, setActiveTab] = useState(initialConfig ? "apis" : "setup");
  const [formData, setFormData] = useState({
    apiKey: initialConfig?.apiKey || "",
    clientId: initialConfig?.clientId || "",
    clientSecret: initialConfig?.clientSecret || "",
    geminiApiKey: initialConfig?.geminiApiKey || "",
    email: (initialConfig as any)?.email || "", // Add email field for Gmail login
  });
  
  const [enabledApis, setEnabledApis] = useState(initialConfig?.enabledApis || {
    drive: true,
    gmail: false,
    contacts: false,
    tasks: false,
    calendar: false,
    docs: false,
    sheets: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const apiOptions = [
    {
      key: 'gmail' as const,
      name: 'Gmail API',
      description: 'Send email invitations and notifications',
      icon: '📧',
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    },
    {
      key: 'contacts' as const,
      name: 'People API (Contacts)',
      description: 'Access Google contacts and profile information',
      icon: '👥',
      scopes: ['https://www.googleapis.com/auth/contacts.readonly'],
    },
    {
      key: 'tasks' as const,
      name: 'Tasks API',
      description: 'Sync with Google Tasks for task management',
      icon: '✅',
      scopes: ['https://www.googleapis.com/auth/tasks'],
    },
    {
      key: 'calendar' as const,
      name: 'Calendar API',
      description: 'Schedule meetings and project milestones',
      icon: '📅',
      scopes: ['https://www.googleapis.com/auth/calendar'],
    },
    {
      key: 'docs' as const,
      name: 'Docs API',
      description: 'Create and manage project documentation',
      icon: '📄',
      scopes: ['https://www.googleapis.com/auth/documents'],
    },
    {
      key: 'sheets' as const,
      name: 'Sheets API',
      description: 'Create project trackers and reports',
      icon: '📊',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    },
  ];

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = minimalGoogleConfigSchema.parse(formData);
      
      // Create full config with minimal APIs enabled
      const fullConfig: GoogleApiConfig = {
        ...validatedData,
        enabledApis: {
          drive: true, // Always required
          gmail: false,
          contacts: false,
          tasks: false,
          calendar: false,
          docs: false,
          sheets: false,
        }
      };
      
      onConfigSubmit(fullConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleApiUpdate = () => {
    const fullConfig: GoogleApiConfig = {
      ...formData,
      enabledApis
    };
    onConfigSubmit(fullConfig);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const toggleApi = (apiKey: keyof typeof enabledApis) => {
    if (apiKey === 'drive') return; // Drive is always required
    
    setEnabledApis(prev => ({
      ...prev,
      [apiKey]: !prev[apiKey]
    }));
  };

  const enabledApisCount = Object.values(enabledApis).filter(Boolean).length;
  const availableApisCount = apiOptions.length + 1; // +1 for Drive (always enabled)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Team member inheritance notice */}
        {!initialConfig && (
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>For team owners:</strong> After you set up your Google API credentials, 
              team members you invite will automatically inherit your configuration. 
              They won't need to set up their own credentials - just sign in with Google!
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Cloud className="h-10 w-10 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectFlow</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {initialConfig ? "Manage Google APIs" : "Quick Setup"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            {initialConfig 
              ? "Enable additional Google APIs to unlock more features for your projects"
              : "Start with basic project management, add more Google services later"
            }
          </p>
        </div>

        <Card className="shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup" disabled={!!initialConfig}>
                <Key className="h-4 w-4 mr-2" />
                Initial Setup
              </TabsTrigger>
              <TabsTrigger value="apis">
                <Settings className="h-4 w-4 mr-2" />
                API Selection ({enabledApisCount}/{availableApisCount})
              </TabsTrigger>
            </TabsList>

            {/* Initial Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Google API Credentials</span>
                </CardTitle>
                <CardDescription>
                  Enter your Google API credentials to get started. You can enable more services later.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Your data is secure:</strong> All project data is stored in your Google Drive,
                    and your API keys are only used for your session.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleInitialSubmit} className="space-y-4">
                  {/* Gmail Account Field - Required for Project Owners */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Gmail Account (Required for Project Owners)</Label>
                    <Input
                      id="email"
                      data-testid="input-email"
                      type="email"
                      placeholder="Enter your Gmail address (e.g., user@gmail.com)"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                      Project owners must use Gmail for Google API integration. Team members can use any email provider.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">Google API Key</Label>
                      <Input
                        id="apiKey"
                        data-testid="input-api-key"
                        type="password"
                        placeholder="Enter your Google API key"
                        value={formData.apiKey}
                        onChange={(e) => handleInputChange("apiKey", e.target.value)}
                        className={errors.apiKey ? "border-red-500" : ""}
                      />
                      {errors.apiKey && (
                        <p className="text-sm text-red-500">{errors.apiKey}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="geminiApiKey">Google AI API Key</Label>
                      <Input
                        id="geminiApiKey"
                        data-testid="input-gemini-api-key"
                        type="password"
                        placeholder="Enter your Gemini API key"
                        value={formData.geminiApiKey}
                        onChange={(e) => handleInputChange("geminiApiKey", e.target.value)}
                        className={errors.geminiApiKey ? "border-red-500" : ""}
                      />
                      {errors.geminiApiKey && (
                        <p className="text-sm text-red-500">{errors.geminiApiKey}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientId">OAuth Client ID</Label>
                      <Input
                        id="clientId"
                        data-testid="input-client-id"
                        placeholder="Enter your OAuth Client ID"
                        value={formData.clientId}
                        onChange={(e) => handleInputChange("clientId", e.target.value)}
                        className={errors.clientId ? "border-red-500" : ""}
                      />
                      {errors.clientId && (
                        <p className="text-sm text-red-500">{errors.clientId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">OAuth Client Secret</Label>
                      <Input
                        id="clientSecret"
                        data-testid="input-client-secret"
                        type="password"
                        placeholder="Enter your OAuth Client Secret"
                        value={formData.clientSecret}
                        onChange={(e) => handleInputChange("clientSecret", e.target.value)}
                        className={errors.clientSecret ? "border-red-500" : ""}
                      />
                      {errors.clientSecret && (
                        <p className="text-sm text-red-500">{errors.clientSecret}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Plus className="h-4 w-4" />
                      <span>More APIs can be enabled after setup</span>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      data-testid="button-setup-submit"
                      className="min-w-[120px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Get Started
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </TabsContent>

            {/* API Selection Tab */}
            <TabsContent value="apis" className="space-y-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Enable Google APIs</span>
                </CardTitle>
                <CardDescription>
                  Choose which Google services to integrate with your projects. 
                  You can enable or disable these at any time.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Always enabled: Drive */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">💾</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-green-800">Google Drive API</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Required</Badge>
                      </div>
                      <p className="text-sm text-green-700">Store and manage all your project data</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>

                {/* Optional APIs */}
                {apiOptions.map((api) => (
                  <div key={api.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{api.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{api.name}</h3>
                          {enabledApis[api.key] && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">Enabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{api.description}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          Scopes: {api.scopes.join(', ')}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={enabledApis[api.key]}
                      onCheckedChange={() => toggleApi(api.key)}
                      data-testid={`switch-${api.key}`}
                    />
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleApiUpdate}
                    disabled={isLoading}
                    data-testid="button-update-apis"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Update Configuration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Setup Guide Link */}
        <div className="text-center">
          <Button variant="outline" asChild>
            <a 
              href="https://console.cloud.google.com/apis/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Google Cloud Console</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}