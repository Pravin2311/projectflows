import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Crown, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProjectMember, User } from "@shared/schema";

interface TeamMembersProps {
  projectId: string;
  onAddMember?: () => void;
}

export function TeamMembers({ projectId, onAddMember }: TeamMembersProps) {
  const { data: members = [], isLoading } = useQuery<(ProjectMember & { user: User })[]>({
    queryKey: ["/api/projects", projectId, "members"],
    enabled: !!projectId,
  });

  const getStatusColor = (status: "online" | "away" | "offline") => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getRandomStatus = (): "online" | "away" | "offline" => {
    const statuses: ("online" | "away" | "offline")[] = ["online", "away", "offline"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3" />;
      case "admin":
        return <Shield className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
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
            <Users className="mr-2" />
            Team Members
          </CardTitle>
          {onAddMember && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMember}
              data-testid="button-add-member"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-4">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No team members yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member: ProjectMember & { user: User }) => {
              // Use consistent status simulation based on user ID for stable display
              const statusOptions = ["online", "away", "offline"] as const;
              const statusIndex = (member.user.id || '').length % 3;
              const status = statusOptions[statusIndex];
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  data-testid={`member-${member.user.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(status)}`}></div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900" data-testid={`text-member-name-${member.user.id}`}>
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        {member.role && member.role !== 'member' && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRoleColor(member.role)}`}
                          >
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500" data-testid={`text-member-email-${member.user.id}`}>
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                    <span className="text-sm text-gray-500 capitalize">
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Team stats */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Members</span>
            <span className="font-medium" data-testid="text-member-count">
              {members.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Online Now</span>
            <span className="font-medium text-green-600" data-testid="text-online-count">
              {members.filter((member: ProjectMember & { user: User }) => {
                const statusOptions = ["online", "away", "offline"] as const;
                const statusIndex = (member.user.id || '').length % 3;
                return statusOptions[statusIndex] === 'online';
              }).length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
