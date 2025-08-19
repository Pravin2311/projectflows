import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Activity, Bot, CheckCircle, ArrowRight, MessageSquare, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { Activity as ActivityType, User } from "@shared/schema";

interface ActivityFeedProps {
  projectId: string;
  limit?: number;
}

export function ActivityFeed({ projectId, limit = 10 }: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "activities"],
    enabled: !!projectId,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "task_status_changed":
        return <ArrowRight className="w-4 h-4 text-green-600" />;
      case "task_completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "project_created":
        return <Activity className="w-4 h-4 text-purple-600" />;
      case "member_added":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "comment_added":
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task_created":
        return "border-blue-200 bg-blue-50";
      case "task_status_changed":
        return "border-green-200 bg-green-50";
      case "task_completed":
        return "border-green-200 bg-green-50";
      case "project_created":
        return "border-purple-200 bg-purple-50";
      case "member_added":
        return "border-blue-200 bg-blue-50";
      case "comment_added":
        return "border-gray-200 bg-gray-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
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
        <CardTitle className="flex items-center text-lg">
          <Activity className="mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, limit).map((activity: ActivityType & { user?: User }) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg border transition-colors hover:bg-gray-50"
                data-testid={`activity-${activity.id}`}
              >
                {activity.user ? (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {activity.user.firstName?.[0]}{activity.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-teal-600" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`flex items-center justify-center w-5 h-5 rounded border ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.user ? (
                        <span className="font-medium" data-testid={`text-activity-user-${activity.id}`}>
                          {activity.user.firstName} {activity.user.lastName}
                        </span>
                      ) : (
                        <span className="font-medium text-teal-600">AI Assistant</span>
                      )}
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1" data-testid={`text-activity-description-${activity.id}`}>
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500" data-testid={`text-activity-time-${activity.id}`}>
                      {formatDistanceToNow(new Date(activity.createdAt!), { addSuffix: true })}
                    </p>
                    
                    {activity.type === "task_status_changed" && activity.metadata && (
                      <Badge variant="outline" className="text-xs">
                        {(activity.metadata as any).oldStatus} → {(activity.metadata as any).newStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activities.length > limit && (
          <div className="text-center pt-4 border-t border-gray-200">
            <button className="text-sm text-primary hover:text-primary-dark font-medium">
              View all activity
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
