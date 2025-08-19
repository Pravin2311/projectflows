import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Clock, Calendar, User, Bot } from "lucide-react";
import type { Task, User as UserType } from "@shared/schema";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task & { assignee?: UserType; createdBy: UserType };
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onUpdate, isDragging }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-50 border-gray-200";
      case "in_progress":
        return "bg-yellow-50 border-yellow-200";
      case "done":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isAiEnhanced = task.description?.includes("AI") || Math.random() > 0.7; // Simulated AI enhancement

  return (
    <Card 
      className={`task-card cursor-pointer transition-all duration-200 hover:shadow-md ${
        getStatusColor(task.status)
      } ${isDragging ? 'shadow-lg' : ''}`}
      data-testid={`card-task-${task.id}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with priority and actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={`text-xs font-medium ${getPriorityColor(task.priority || 'medium')}`}
              data-testid={`badge-priority-${task.priority}`}
            >
              {task.priority === 'high' ? 'High Priority' : 
               task.priority === 'low' ? 'Low Priority' : 'Medium'}
            </Badge>
            {isAiEnhanced && (
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                <Bot className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Task title and description */}
        <div>
          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2" data-testid={`text-task-title-${task.id}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2" data-testid={`text-task-description-${task.id}`}>
              {task.description}
            </p>
          )}
        </div>

        {/* Progress bar for in-progress tasks */}
        {task.status === 'in_progress' && task.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span data-testid={`text-progress-${task.id}`}>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        )}

        {/* Due date and assignee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {task.assignee ? (
              <div className="flex items-center space-x-1">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={task.assignee.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {task.createdBy.id !== task.assignee.id && (
                  <Avatar className="w-6 h-6 -ml-2">
                    <AvatarImage src={task.createdBy.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {task.createdBy.firstName?.[0]}{task.createdBy.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : (
              <div className="flex items-center text-gray-400 text-xs">
                <User className="w-4 h-4 mr-1" />
                Unassigned
              </div>
            )}
          </div>
          
          {task.dueDate && (
            <div className={`flex items-center text-xs ${
              isOverdue ? 'text-red-600' : 'text-gray-500'
            }`}>
              <Calendar className="w-3 h-3 mr-1" />
              <span data-testid={`text-due-date-${task.id}`}>
                {isOverdue ? 'Overdue' : 
                 task.status === 'done' ? `Completed ${format(new Date(task.updatedAt!), 'MMM d')}` :
                 `Due ${format(new Date(task.dueDate), 'MMM d')}`}
              </span>
            </div>
          )}
        </div>

        {/* Completion badge for done tasks */}
        {task.status === 'done' && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-full justify-center">
            ✓ Completed
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
