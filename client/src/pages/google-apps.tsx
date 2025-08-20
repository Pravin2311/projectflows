import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { GoogleDocs } from "@/components/ui/google-docs";
import { GoogleSheets } from "@/components/ui/google-sheets";
import { ProgressiveGoogleSetup } from "@/components/ui/progressive-google-setup";
import { useAuth, useGoogleConfig } from "@/hooks/useAuth";
import type { GoogleApiConfig } from "@shared/schema";

export default function GoogleAppsPage() {
  const [showSetup, setShowSetup] = useState(false);
  const { user, hasGoogleConfig } = useAuth();
  
  // For demo purposes, we'll use a mock configuration state
  const googleConfig: GoogleApiConfig = {
    apiKey: "demo_api_key",
    clientId: "demo_client_id",
    clientSecret: "demo_client_secret",
    geminiApiKey: "demo_gemini_key",
    enabledApis: {
      drive: true,
      gmail: false,
      contacts: false,
      tasks: false,
      calendar: false,
      docs: true, // Enable for demo
      sheets: true, // Enable for demo
    }
  };
  const { submitConfig, isLoading } = useGoogleConfig();

  const handleConfigUpdate = (config: GoogleApiConfig) => {
    submitConfig(config);
    setShowSetup(false);
  };

  const enabledApis = googleConfig?.enabledApis || {};
  const enabledCount = Object.values(enabledApis).filter(Boolean).length;
  const totalCount = Object.keys(enabledApis).length;

  if (showSetup) {
    return (
      <ProgressiveGoogleSetup 
        onConfigSubmit={handleConfigUpdate} 
        initialConfig={googleConfig}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Google Workspace
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your Google APIs and access your workspace documents
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>{enabledCount}/{totalCount} APIs</span>
              </Badge>
            </div>
            <Button onClick={() => setShowSetup(true)} data-testid="button-manage-apis">
              <Settings className="h-4 w-4 mr-2" />
              Manage APIs
            </Button>
          </div>
        </div>

        {/* Configuration Status */}
        {!hasGoogleConfig && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Setup Required</p>
                  <p className="text-sm text-yellow-700">
                    Configure your Google API credentials to access workspace features.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowSetup(true)}
                  className="ml-auto"
                  size="sm"
                >
                  Setup Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className={`${enabledApis.docs ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-medium text-sm">Google Docs</p>
                    <p className="text-xs text-gray-600">Documents</p>
                  </div>
                </div>
                {enabledApis.docs ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`${enabledApis.sheets ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-medium text-sm">Google Sheets</p>
                    <p className="text-xs text-gray-600">Spreadsheets</p>
                  </div>
                </div>
                {enabledApis.sheets ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`${enabledApis.gmail ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="font-medium text-sm">Gmail</p>
                    <p className="text-xs text-gray-600">Email</p>
                  </div>
                </div>
                {enabledApis.gmail ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`${enabledApis.calendar ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-medium text-sm">Calendar</p>
                    <p className="text-xs text-gray-600">Scheduling</p>
                  </div>
                </div>
                {enabledApis.calendar ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="docs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="docs" 
              disabled={!enabledApis.docs}
              className="flex items-center space-x-2"
            >
              <span className="text-lg">📄</span>
              <span>Google Docs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sheets" 
              disabled={!enabledApis.sheets}
              className="flex items-center space-x-2"
            >
              <span className="text-lg">📊</span>
              <span>Google Sheets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="mt-6">
            {enabledApis.docs ? (
              <GoogleDocs />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold mb-2">Google Docs API Not Enabled</h3>
                  <p className="text-gray-600 mb-4">
                    Enable Google Docs API to create and manage documents for your projects.
                  </p>
                  <Button onClick={() => setShowSetup(true)}>
                    Enable Google Docs
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sheets" className="mt-6">
            {enabledApis.sheets ? (
              <GoogleSheets />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold mb-2">Google Sheets API Not Enabled</h3>
                  <p className="text-gray-600 mb-4">
                    Enable Google Sheets API to create project trackers and data analysis.
                  </p>
                  <Button onClick={() => setShowSetup(true)}>
                    Enable Google Sheets
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}