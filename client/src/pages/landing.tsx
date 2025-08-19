import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Cloud, 
  Shield, 
  Zap, 
  Users, 
  Brain, 
  CheckCircle, 
  ArrowRight,
  Star,
  Globe,
  Lock
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Cloud className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">ProjectFlow</h1>
            </div>
            
            <Button 
              onClick={handleLogin}
              data-testid="button-login"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              100% Free Forever - No Hidden Costs
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Project Management
              <span className="block text-blue-600">Powered by Your Google Drive</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The only project management platform that stores all your data in your own Google Drive. 
              Keep complete control while enjoying powerful AI-driven insights powered by Google Gemini.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleLogin}
                data-testid="button-hero-login"
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
              >
                <Cloud className="h-5 w-5 mr-2" />
                Login with Google
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose ProjectFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience project management without compromising on data privacy or breaking the bank.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Free Forever */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">100% Free Forever</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Use your own Google API keys to keep the platform completely free. 
                  No subscriptions, no hidden fees, no limits.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: Data Privacy */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Your Data, Your Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  All project data is stored in your own Google Drive. 
                  Complete ownership and privacy with enterprise-grade security.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: AI Powered */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Leverage Google Gemini AI for intelligent project recommendations, 
                  task optimization, and productivity insights.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4: Team Collaboration */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Invite team members via email. Everyone uses their own Gmail 
                  accounts while sharing project data seamlessly.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5: Lightning Fast */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Modern React interface with real-time updates through Google Drive API. 
                  Fast, responsive, and reliable.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6: Global Access */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Access Anywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Since your data lives in Google Drive, access your projects 
                  from anywhere with automatic sync and backup.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Login with Google</h3>
              <p className="text-gray-600">
                Sign in with your Google account using secure OAuth authentication. 
                No passwords to remember.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Setup Your Workspace</h3>
              <p className="text-gray-600">
                Provide your Google API credentials to connect your Drive. 
                We'll guide you through getting them for free.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Start Managing Projects</h3>
              <p className="text-gray-600">
                Create projects, add team members, and manage tasks. 
                Everything is automatically saved to your Drive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Take Control of Your Projects?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams who trust ProjectFlow for their project management needs.
          </p>
          <Button 
            onClick={handleLogin}
            data-testid="button-cta-login"
            size="lg"
            variant="secondary"
            className="text-lg px-8"
          >
            <Cloud className="h-5 w-5 mr-2" />
            Get Started Now - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Cloud className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">ProjectFlow</span>
            </div>
            <p className="text-gray-400 mb-4">
              Project management powered by your Google Drive
            </p>
            <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Your data stays in your Google Drive</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}