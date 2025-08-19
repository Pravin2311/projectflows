import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Cloud, Users, Brain, Shield, Zap, CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLoginRedirect = () => {
    window.location.href = '/api/auth/google-config';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ProjectFlow
            </h1>
          </div>
          <Button 
            onClick={handleLoginRedirect}
            data-testid="button-login"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Get Started Free
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Project Management
            <span className="text-blue-600"> Powered by Your Google Drive</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            A completely free project management platform that stores all your data in your own Google Drive. 
            No subscriptions, no data lock-in, just powerful project management tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleLoginRedirect}
              data-testid="button-start-free"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Start Managing Projects Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose ProjectFlow?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>100% Free Forever</CardTitle>
                <CardDescription>
                  No subscriptions, no hidden costs. You provide your own Google API keys 
                  and keep complete control over your data and costs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Your Data, Your Drive</CardTitle>
                <CardDescription>
                  All project data is stored in your Google Drive. You own it, 
                  control it, and can access it anytime, even outside the platform.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Leverage Google's Gemini AI for smart project recommendations, 
                  task optimization, and team productivity insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share projects with team members through Google Drive sharing. 
                  Real-time collaboration with commenting and activity tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-yellow-600 mb-4" />
                <CardTitle>Fast & Modern</CardTitle>
                <CardDescription>
                  Built with modern web technologies for lightning-fast performance. 
                  Responsive design works perfectly on all devices.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-teal-600 mb-4" />
                <CardTitle>No Vendor Lock-in</CardTitle>
                <CardDescription>
                  Your data stays in standard JSON format in your Google Drive. 
                  Switch platforms anytime without losing your project history.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Get Started in 3 Simple Steps
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get Your Google API Keys
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Create a free Google Cloud project and get your API credentials. 
                We'll guide you through the process step by step.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Connect Your Google Account
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Securely connect your Google account. We only access your Drive 
                to store project data - nothing else.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start Managing Projects
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Create your first project and invite team members. All data 
                automatically syncs to your Google Drive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Project Management?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using ProjectFlow to manage their projects for free.
          </p>
          <Button 
            size="lg" 
            onClick={handleLoginRedirect}
            data-testid="button-get-started-cta"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
          >
            Get Started Now - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Cloud className="h-6 w-6" />
            <span className="text-lg font-semibold">ProjectFlow</span>
          </div>
          <p className="text-sm">
            Free project management powered by Google Drive. 
            Your data, your control, your success.
          </p>
        </div>
      </footer>
    </div>
  );
}