import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckSquare, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Target
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StatsCardsProps {
  projectId: string;
}

interface ProjectStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  highPriorityTasks: number;
}

export function StatsCards({ projectId }: StatsCardsProps) {
  const { data: stats, isLoading } = useQuery<ProjectStats>({
    queryKey: ["/api/projects", projectId, "stats"],
    enabled: !!projectId,
  });

  const statCards = [
    {
      id: "total-tasks",
      title: "Total Tasks",
      value: stats?.totalTasks || 0,
      change: "+12% from last week",
      changeType: "positive" as const,
      icon: CheckSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "completed",
      title: "Completed",
      value: stats?.completedTasks || 0,
      change: "+8% completion rate",
      changeType: "positive" as const,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "in-progress",
      title: "In Progress",
      value: stats?.inProgressTasks || 0,
      change: stats?.overdueTasks ? `${stats.overdueTasks} overdue` : "On track",
      changeType: stats?.overdueTasks ? "negative" as const : "neutral" as const,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      id: "team-members",
      title: "Team Members",
      value: stats?.teamMembers || 0,
      change: "All active",
      changeType: "neutral" as const,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map((card) => (
        <Card 
          key={card.id} 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          data-testid={`card-stat-${card.id}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600" data-testid={`text-stat-title-${card.id}`}>
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900" data-testid={`text-stat-value-${card.id}`}>
                  {card.value}
                </p>
                <p className={`text-sm flex items-center ${
                  card.changeType === 'positive' ? 'text-green-600' :
                  card.changeType === 'negative' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {card.changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {card.changeType === 'negative' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  <span data-testid={`text-stat-change-${card.id}`}>{card.change}</span>
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
