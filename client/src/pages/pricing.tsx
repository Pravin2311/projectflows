import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Cloud, Zap, Shield, ArrowRight, CheckCircle, Key, Database, Users, Settings, Calendar, MessageSquare, FileText, BarChart3, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Features() {
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    window.location.href = "/";
  };

  const features = [
    {
      icon: <Cloud className="h-6 w-6" />,
      title: "Google Drive Integration",
      description: "All project data stored securely in your own Google Drive with real-time sync"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Invite team members, assign tasks, and collaborate with role-based permissions"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Advanced Time Tracking",
      description: "Built-in timers, manual time entry, and comprehensive time analytics"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Rich Comments System",
      description: "@ mentions, # task links, file attachments, and interactive discussions"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Kanban Boards",
      description: "Drag-and-drop task management with custom columns and workflow states"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Project Analytics",
      description: "Visual progress tracking, completion rates, and team performance insights"
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI-Powered Insights",
      description: "Google Gemini AI analysis using your own API key for project optimization"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Data Privacy",
      description: "Complete data ownership - your projects never leave your Google Drive"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4 mr-2" />
            100% Free Forever
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Complete Project Management
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Everything you need to manage projects effectively, powered by your own Google ecosystem. 
            No subscriptions, no platform fees - just your own API costs directly to Google.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-lg px-8"
              data-testid="button-get-started"
            >
              <Cloud className="h-5 w-5 mr-2" />
              Get Started - Free Forever
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Cost Transparency Card */}
          <Card className="max-w-2xl mx-auto mb-16 border-green-200 bg-green-50/50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center justify-center">
                <Key className="h-5 w-5 mr-2" />
                Transparent Pricing Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-green-700 dark:text-green-300">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span><strong>Platform Cost:</strong> $0/month (Free Forever)</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span><strong>Google API Costs:</strong> ~$1-5/month (paid directly to Google)</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span><strong>AI Insights:</strong> Your own Gemini API key = your cost control</span>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-4">
                You control 100% of costs by providing your own Google API credentials
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything Included
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Professional project management features at zero platform cost
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Requirements */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Simple 5-Minute Setup
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Create Google Project</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Free Google Cloud Console project with Drive and Gmail APIs
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Get API Keys</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Copy your API credentials and optional Gemini AI key
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Start Managing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect and start creating projects immediately
              </p>
            </div>
          </div>

          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            data-testid="button-setup-now"
          >
            Start Setup Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}