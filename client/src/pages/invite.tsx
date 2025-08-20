import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InvitationDetails {
  id: string;
  projectId: string;
  projectName: string;
  inviterName: string;
  role: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function InvitePage() {
  const { id: invitationId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invitationId) {
      fetchInvitationDetails();
    }
  }, [invitationId]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${invitationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Invitation not found or has expired.");
        } else {
          setError("Failed to load invitation details.");
        }
        return;
      }

      const data = await response.json();
      setInvitation(data);
    } catch (err) {
      setError("Failed to load invitation. Please try again.");
      console.error("Error fetching invitation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    try {
      setAccepting(true);

      const response = await apiRequest("POST", `/api/invitations/${invitationId}/accept`, {});
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Welcome to the team!",
          description: `You've successfully joined "${invitation.projectName}". Redirecting to your project...`,
        });
        
        // Force refresh auth status to pick up inherited configuration
        queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
        
        // Redirect directly to project since user is now authenticated with inherited config
        setTimeout(() => {
          setLocation(`/project/${data.projectId}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }
    } catch (err: any) {
      toast({
        title: "Failed to Accept Invitation",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
              variant="outline"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is not valid.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
              variant="outline"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Already Accepted</CardTitle>
            <CardDescription>You've already accepted this invitation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation(`/project/${invitation.projectId}`)} 
              className="w-full"
            >
              Go to Project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            Join your team on ProjectFlow
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Project Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Project:</span>
                <p className="font-medium">{invitation.projectName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Invited by:</span>
                <p className="font-medium">{invitation.inviterName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Your role:</span>
                <Badge variant="secondary" className="ml-2">
                  {invitation.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Invitation sent to:</span>
            </div>
            <p className="font-medium text-sm">{invitation.email}</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleAcceptInvitation}
              className="w-full"
              disabled={accepting}
              data-testid="button-accept-invitation"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Accepting Invitation...
                </>
              ) : (
                'Accept Invitation & Get Started'
              )}
            </Button>
            
            <Button 
              onClick={() => setLocation("/")} 
              variant="outline"
              className="w-full"
              data-testid="button-decline-invitation"
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              <strong>Zero Configuration Required!</strong><br/>
              You'll inherit the project owner's Google setup automatically.<br/>
              Just accept and start collaborating - completely free forever.
            </p>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}