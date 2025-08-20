import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Clock, 
  Target,
  ArrowLeft,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectInsights {
  workloadAnalysis: string;
  taskOptimization: string[];
  riskAssessment: string;
  productivityRecommendations: string[];
  timelinePrediction: string;
  teamBalancing: string[];
}

interface WorkloadAnalysis {
  overloadedMembers: string[];
  underutilizedMembers: string[];
  recommendations: string[];
  efficiencyInsights: string[];
  workloadScore: string;
}

export default function ProjectInsightsPage() {
  const [match, params] = useRoute("/project/:id/insights");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const projectId = params?.id;

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
  });

  // Fetch AI insights
  const { 
    data: insights, 
    isLoading: insightsLoading, 
    error: insightsError,
    refetch: refetchInsights 
  } = useQuery<ProjectInsights>({
    queryKey: [`/api/projects/${projectId}/ai-insights`],
    enabled: !!projectId && !!project && !!tasks && !!members,
    retry: false,
  });

  // Fetch workload analysis
  const { 
    data: workloadAnalysis, 
    isLoading: workloadLoading,
    refetch: refetchWorkload 
  } = useQuery<WorkloadAnalysis>({
    queryKey: [`/api/projects/${projectId}/workload-analysis`],
    enabled: !!projectId && !!tasks && !!members,
    retry: false,
  });

  const refreshInsights = () => {
    refetchInsights();
    refetchWorkload();
    toast({
      title: "Refreshing insights",
      description: "Generating fresh AI analysis...",
    });
  };

  if (projectLoading || tasksLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading project data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href={`/project/${projectId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-600" />
                <span>AI Insights</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Intelligent analysis for {(project as any)?.name || "your project"}
              </p>
            </div>
          </div>

          <Button onClick={refreshInsights} disabled={insightsLoading || workloadLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(insightsLoading || workloadLoading) ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </Button>
        </div>

        {/* Error State */}
        {insightsError && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">AI Analysis Unavailable</p>
                  <p className="text-sm text-red-700">
                    Unable to generate insights. Please check your Google AI API configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {(insightsLoading || workloadLoading) && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                <div>
                  <p className="font-medium text-blue-800">AI Analysis in Progress</p>
                  <p className="text-sm text-blue-700">
                    Analyzing your project data to generate intelligent insights...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="workload" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Team Workload</span>
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Optimization</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Workload Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {insights?.workloadAnalysis || "Analyzing current workload distribution..."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Risk Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {insights?.riskAssessment || "Evaluating project risks and potential delays..."}
                  </p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Productivity Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights?.productivityRecommendations?.length ? (
                    <div className="space-y-3">
                      {insights.productivityRecommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <Target className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Generating productivity recommendations...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Workload Tab */}
          <TabsContent value="workload" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {workloadAnalysis && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Workload Balance Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {workloadAnalysis.workloadScore}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Team Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {workloadAnalysis.overloadedMembers?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-600 mb-2">Overloaded Members:</p>
                            <div className="flex flex-wrap gap-2">
                              {workloadAnalysis.overloadedMembers.map(member => (
                                <Badge key={member} variant="destructive">{member}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {workloadAnalysis.underutilizedMembers?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-600 mb-2">Available for More Work:</p>
                            <div className="flex flex-wrap gap-2">
                              {workloadAnalysis.underutilizedMembers.map(member => (
                                <Badge key={member} variant="secondary">{member}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Workload Balancing Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {workloadAnalysis.recommendations?.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Users className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                            <p className="text-gray-700 text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Task Optimization Tab */}
          <TabsContent value="optimization" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Task Optimization Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights?.taskOptimization?.length ? (
                  <div className="space-y-3">
                    {insights.taskOptimization.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Sparkles className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                        <p className="text-gray-700 text-sm">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Analyzing tasks for optimization opportunities...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Timeline Prediction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {insights?.timelinePrediction || "Analyzing current progress to predict timeline..."}
                </p>
                
                {insights?.teamBalancing?.length && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Team Balancing Suggestions:</h3>
                    <div className="space-y-2">
                      {insights.teamBalancing.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                          <Clock className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}