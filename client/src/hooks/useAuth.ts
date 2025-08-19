import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface AuthStatus {
  isAuthenticated: boolean;
  hasGoogleConfig: boolean;
  user: any;
}

export function useAuth() {
  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: authStatus?.isAuthenticated || false,
  });

  return {
    user: authStatus?.isAuthenticated ? user : null,
    isLoading: isLoading || (authStatus?.isAuthenticated && userLoading),
    isAuthenticated: authStatus?.isAuthenticated || false,
    hasGoogleConfig: authStatus?.hasGoogleConfig || false,
  };
}

export function useGoogleConfig() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitConfig = async (config: { apiKey: string; clientId: string; clientSecret: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/google-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to configure Google API');
      }

      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitConfig,
    isLoading,
    error,
  };
}
