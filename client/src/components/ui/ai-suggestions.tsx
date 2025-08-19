import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Lightbulb, Clock, RefreshCw, X, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AiSuggestion } from "@shared/schema";

interface AiSuggestionsProps {
  projectId: string;
}

export function AiSuggestions({ projectId }: AiSuggestionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "ai", "suggestions"],
    enabled: !!projectId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      await apiRequest("POST", `/api/projects/${projectId}/ai/analyze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectId, "ai", "suggestions"] 
      });
      toast({
        title: "Analysis Complete",
        description: "New AI suggestions have been generated for your project.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate AI suggestions. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });

  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      await apiRequest("PUT", `/api/ai/suggestions/${suggestionId}`, {
        applied: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectId, "ai", "suggestions"] 
      });
      toast({
        title: "Suggestion Applied",
        description: "The AI suggestion has been applied to your project.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Apply",
        description: "Could not apply the suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const dismissSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      await apiRequest("PUT", `/api/ai/suggestions/${suggestionId}`, {
        dismissedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectId, "ai", "suggestions"] 
      });
    },
  });

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "task_optimization":
        return <Lightbulb className="w-4 h-4" />;
      case "schedule_meeting":
        return <Clock className="w-4 h-4" />;
      case "workload_balance":
        return <Bot className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case "task_optimization":
        return "bg-blue-50 border-blue-200";
      case "schedule_meeting":
        return "bg-purple-50 border-purple-200";
      case "workload_balance":
        return "bg-green-50 border-green-200";
      default:
        return "bg-teal-50 border-teal-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="text-teal-600 mr-2" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Bot className="text-teal-600 mr-2" />
            AI Suggestions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={isAnalyzing || analyzeMutation.isPending}
            data-testid="button-refresh-suggestions"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No AI suggestions available yet.</p>
            <Button
              variant="outline"
              onClick={() => analyzeMutation.mutate()}
              disabled={isAnalyzing || analyzeMutation.isPending}
              data-testid="button-generate-suggestions"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Project...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion: AiSuggestion) => (
              <div
                key={suggestion.id}
                className={`rounded-lg p-4 border ${getSuggestionColor(suggestion.type)}`}
                data-testid={`suggestion-${suggestion.id}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    suggestion.type === 'task_optimization' ? 'bg-blue-100 text-blue-600' :
                    suggestion.type === 'schedule_meeting' ? 'bg-purple-100 text-purple-600' :
                    suggestion.type === 'workload_balance' ? 'bg-green-100 text-green-600' :
                    'bg-teal-100 text-teal-600'
                  }`}>
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-900" data-testid={`text-suggestion-title-${suggestion.id}`}>
                        {suggestion.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {suggestion.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            High Priority
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissSuggestionMutation.mutate(suggestion.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          data-testid={`button-dismiss-${suggestion.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3" data-testid={`text-suggestion-description-${suggestion.id}`}>
                      {suggestion.description}
                    </p>
                    {!suggestion.applied && (
                      <Button
                        size="sm"
                        onClick={() => applySuggestionMutation.mutate(suggestion.id)}
                        disabled={applySuggestionMutation.isPending}
                        className={`text-sm ${
                          suggestion.type === 'task_optimization' ? 'bg-blue-600 hover:bg-blue-700' :
                          suggestion.type === 'schedule_meeting' ? 'bg-purple-600 hover:bg-purple-700' :
                          suggestion.type === 'workload_balance' ? 'bg-green-600 hover:bg-green-700' :
                          'bg-teal-600 hover:bg-teal-700'
                        }`}
                        data-testid={`button-apply-${suggestion.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Apply Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
