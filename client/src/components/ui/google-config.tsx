import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, Key, Cloud, Shield, ArrowRight } from "lucide-react";
import { minimalGoogleConfigSchema, type GoogleApiConfig } from "@shared/schema";
import { z } from "zod";
import { ProgressiveGoogleSetup } from "@/components/ui/progressive-google-setup";

interface GoogleConfigProps {
  onConfigSubmit: (config: GoogleApiConfig) => void;
  isLoading?: boolean;
  showProgressiveSetup?: boolean;
}

export function GoogleConfig({ onConfigSubmit, isLoading = false, showProgressiveSetup = true }: GoogleConfigProps) {
  const [useProgressiveSetup, setUseProgressiveSetup] = useState(showProgressiveSetup);

  if (useProgressiveSetup) {
    return <ProgressiveGoogleSetup onConfigSubmit={onConfigSubmit} isLoading={isLoading} />;
  }

  return <LegacyGoogleConfig onConfigSubmit={onConfigSubmit} isLoading={isLoading} />;
}

interface LegacyGoogleConfigProps {
  onConfigSubmit: (config: GoogleApiConfig) => void;
  isLoading?: boolean;
}

function LegacyGoogleConfig({ onConfigSubmit, isLoading = false }: LegacyGoogleConfigProps) {
  const [formData, setFormData] = useState({
    apiKey: "",
    clientId: "",
    clientSecret: "",
    geminiApiKey: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = minimalGoogleConfigSchema.parse(formData);
      
      // Create full config with default APIs enabled
      const fullConfig: GoogleApiConfig = {
        ...validatedData,
        enabledApis: {
          drive: true,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Notice about team member inheritance */}
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>For team owners:</strong> After you set up your Google API credentials, 
            team members you invite will automatically inherit your configuration. 
            They won't need to set up their own credentials - just sign in with Google!
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Cloud className="h-10 w-10 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectFlow</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Setup Your Workspace
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Connect your Google Drive to start managing projects. Your data stays completely private and under your control.
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Google API Configuration</span>
            </CardTitle>
            <CardDescription>
              To keep this platform completely free, provide your Google API credentials including AI access.
              Your keys are stored securely and only used for your projects and AI-powered insights.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Your data is secure:</strong> All your project data will be stored in your own Google Drive,
                and your API keys are only used for your session.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="geminiApiKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Google AI (Gemini) API Key
                </Label>
                <Input
                  id="geminiApiKey"
                  data-testid="input-gemini-api-key"
                  type="password"
                  placeholder="Enter your Google AI API key (AIza...)"
                  value={formData.geminiApiKey}
                  onChange={(e) => handleInputChange("geminiApiKey", e.target.value)}
                  className={errors.geminiApiKey ? "border-red-500" : ""}
                />
                {errors.geminiApiKey && (
                  <p className="text-sm text-red-500">{errors.geminiApiKey}</p>
                )}
              </div>

              <Button 
                type="submit" 
                data-testid="button-connect-google"
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Google Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to get your Google API credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable APIs: Google Drive, Google People, and <a href="https://console.cloud.google.com/apis/library/aiplatform.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Gemini AI <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              <li>Go to "Credentials" and create API keys for both standard APIs and AI</li>
              <li>Create OAuth 2.0 credentials for web application</li>
              <li>Add your domain to authorized redirect URIs</li>
            </ol>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Required APIs:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <li>• Google Drive API (for data storage)</li>
                <li>• Google People API (for user profiles)</li>
                <li>• Google OAuth2 API (for authentication)</li>
                <li>• Google AI (Gemini) API (for AI-powered insights)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                <strong>100% Free:</strong> You control your own API costs directly through Google - no subscription fees!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}