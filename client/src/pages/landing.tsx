import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleConfig } from "@/components/ui/google-config";
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
  Lock,
  Settings,
  Mail
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Landing() {
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [showMemberLogin, setShowMemberLogin] = useState(false);
  const [memberLoginUrl, setMemberLoginUrl] = useState("");

  useEffect(() => {
    // Check URL params to see if we should show Google setup
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup') === 'google') {
      setShowGoogleSetup(true);
      // Don't clean up URL immediately to preserve browser history
    }

    // Handle browser back/forward navigation
    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      if (!currentParams.get('setup')) {
        setShowGoogleSetup(false);
      } else if (currentParams.get('setup') === 'google') {
        setShowGoogleSetup(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = () => {
    // Instead of server redirect, handle this client-side for better history management
    setShowGoogleSetup(true);
    window.history.pushState({}, '', '/?setup=google');
  };

  const handleGoogleConfigSubmit = async (config: any) => {
    try {
      const response = await fetch('/api/auth/google-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        // Redirect to dashboard after successful config
        window.location.href = '/dashboard';
      } else {
        throw new Error('Failed to setup Google configuration');
      }
    } catch (error) {
      console.error('Config setup error:', error);
    }
  };

  const handleMemberLogin = async () => {
    if (!memberLoginUrl.trim()) return;
    
    try {
      const response = await fetch('/api/auth/gmail-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberLoginUrl.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Successful login - redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Show detailed error message with suggestions
        let errorDisplay = data.message || data.error || 'Login failed. Please try again.';
        
        if (data.helpText) {
          errorDisplay += `\n\n${data.helpText}`;
        }
        
        if (data.suggestions && data.suggestions.length > 0) {
          errorDisplay += '\n\nSuggestions:\n' + data.suggestions.map((s: string) => `• ${s}`).join('\n');
        }
        
        alert(errorDisplay);
      }
    } catch (error) {
      console.error('Member login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  // Add a back button handler for Google setup
  const handleBackToHome = () => {
    setShowGoogleSetup(false);
    window.history.back(); // Use browser's back navigation
  };

  // If showing Google setup, render that instead
  if (showGoogleSetup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToHome}
            className="mb-4"
          >
            ← Back to Home
          </Button>
        </div>
        <GoogleConfig onConfigSubmit={handleGoogleConfigSubmit} isLoading={false} />
      </div>
    );
  }

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
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleLogin}
                data-testid="button-login"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowMemberLogin(!showMemberLogin)}
                data-testid="button-member-login"
              >
                Member Login
              </Button>
            </div>
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
              Free Project Management
              <span className="block text-blue-600">Powered by Your Google Drive</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The completely free project management platform that stores all your data in your own Google Drive. 
              No servers, no subscriptions - just your own Google ecosystem with AI-powered insights.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
                <Settings className="h-4 w-4 inline mr-2" />
                <strong>Quick Setup Required:</strong> You'll need to create free Google API keys (5 minute setup). 
                Your data stays 100% in your Google Drive.
              </p>
            </div>
            
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
                onClick={() => window.location.href = "#features"}
                data-testid="button-view-features"
              >
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Member Login Modal */}
      {showMemberLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Member Login</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMemberLogin(false)}
              >
                ×
              </Button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Enter your email address to access all projects you've been invited to:
            </p>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your.email@company.com (any email provider works)"
                value={memberLoginUrl}
                onChange={(e) => setMemberLoginUrl(e.target.value)}
                data-testid="input-member-email"
              />
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMemberLogin(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMemberLogin}
                  disabled={!memberLoginUrl.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-member-login-submit"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Sign In with Email
                </Button>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p className="mb-2">
                <strong>Any email works:</strong> Gmail, Yahoo, corporate emails - all supported for team members.
              </p>
              <p>
                <strong>Zero setup:</strong> Inherit project configurations automatically from your project owner.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Google-First Benefits */}
      <section className="py-16 bg-blue-50 dark:bg-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4 mr-2" />
              100% Free Forever
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Your Google Ecosystem, Your Control
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Complete project management powered by your own Google services. 
              No platform fees, no subscriptions - just <strong>your own API costs directly to Google</strong>.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="text-green-600 mb-3">
                  <CheckCircle className="h-8 w-8 mx-auto" />
                </div>
                <h3 className="font-semibold mb-2">Zero Platform Costs</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Platform is completely free. You only pay Google for your API usage.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="text-green-600 mb-3">
                  <Cloud className="h-8 w-8 mx-auto" />
                </div>
                <h3 className="font-semibold mb-2">Your Data Ownership</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  All project data stored in your own Google Drive.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="text-green-600 mb-3">
                  <Zap className="h-8 w-8 mx-auto" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Google Gemini AI insights with your own API key.
                </p>
              </div>
            </div>
            
            <Button 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-lg px-8"
              onClick={handleLogin}
              data-testid="button-get-started-free"
            >
              Get Started - Completely Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50">
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