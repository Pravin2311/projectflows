import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, Key, Cloud, Shield } from "lucide-react";
import { googleApiConfigSchema } from "@shared/schema";
import { z } from "zod";

interface GoogleConfigProps {
  onConfigSubmit: (config: { apiKey: string; clientId: string; clientSecret: string }) => void;
  isLoading?: boolean;
}

export function GoogleConfig({ onConfigSubmit, isLoading = false }: GoogleConfigProps) {
  const [formData, setFormData] = useState({
    apiKey: "",
    clientId: "",
    clientSecret: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = googleApiConfigSchema.parse(formData);
      onConfigSubmit(validatedData);
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
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Cloud className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ProjectFlow
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Connect your Google account to get started with free project management
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
              To keep this platform completely free, please provide your own Google API credentials.
              Don't worry - your keys are stored securely and only used for your projects.
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
              <li>Enable the Google Drive API and Google+ API</li>
              <li>Go to "Credentials" and create an API key</li>
              <li>Create OAuth 2.0 credentials for a web application</li>
              <li>Add your domain to authorized redirect URIs</li>
            </ol>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Required APIs:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <li>• Google Drive API</li>
                <li>• Google People API</li>
                <li>• Google OAuth2 API</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}