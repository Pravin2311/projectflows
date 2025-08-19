import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, differenceInDays, startOfDay, endOfDay } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  startDate?: string;
  dueDate?: string;
  progress: number;
  assigneeId?: string;
  dependsOn: string[];
}

interface GanttChartProps {
  tasks: Task[];
  title?: string;
}

const statusColors = {
  todo: "bg-gray-400",
  in_progress: "bg-blue-500",
  done: "bg-green-500"
};

const priorityColors = {
  low: "border-green-500",
  medium: "border-yellow-500", 
  high: "border-orange-500",
  critical: "border-red-500"
};

export function GanttChart({ tasks, title = "Project Timeline" }: GanttChartProps) {
  const { timelineTasks, startDate, endDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      return { timelineTasks: [], startDate: new Date(), endDate: new Date(), totalDays: 0 };
    }

    // Filter tasks with dates
    const tasksWithDates = tasks.filter(task => task.startDate || task.dueDate);
    
    if (tasksWithDates.length === 0) {
      return { timelineTasks: [], startDate: new Date(), endDate: new Date(), totalDays: 0 };
    }

    // Find project date range
    const dates = tasksWithDates.flatMap(task => [
      task.startDate ? new Date(task.startDate) : null,
      task.dueDate ? new Date(task.dueDate) : null
    ]).filter(Boolean) as Date[];

    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = endOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    const dayCount = differenceInDays(maxDate, minDate) + 1;

    // Calculate task positions and durations
    const timeline = tasksWithDates.map(task => {
      const taskStart = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : minDate);
      const taskEnd = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : maxDate);
      
      const startOffset = differenceInDays(taskStart, minDate);
      const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
      const leftPercent = (startOffset / dayCount) * 100;
      const widthPercent = (duration / dayCount) * 100;

      return {
        ...task,
        startOffset,
        duration,
        leftPercent,
        widthPercent,
        taskStart,
        taskEnd
      };
    });

    return {
      timelineTasks: timeline,
      startDate: minDate,
      endDate: maxDate,
      totalDays: dayCount
    };
  }, [tasks]);

  if (timelineTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No tasks with dates to display timeline</p>
            <p className="text-sm mt-1">Add start dates or due dates to tasks to see the Gantt chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate week markers
  const weekMarkers = [];
  for (let i = 0; i <= totalDays; i += 7) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const leftPercent = (i / totalDays) * 100;
    weekMarkers.push({ date, leftPercent });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="relative h-8 border-b">
            {weekMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 text-xs text-gray-500"
                style={{ left: `${marker.leftPercent}%` }}
              >
                <div className="transform -translate-x-1/2">
                  {format(marker.date, "MMM d")}
                </div>
                <div className="w-px h-4 bg-gray-300 mx-auto mt-1"></div>
              </div>
            ))}
          </div>

          {/* Task Bars */}
          <div className="space-y-3">
            {timelineTasks.map((task) => (
              <div key={task.id} className="relative">
                {/* Task Label */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{task.title}</span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${priorityColors[task.priority]} border`}
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {task.progress}%
                  </div>
                </div>

                {/* Task Bar Container */}
                <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded">
                  {/* Task Bar */}
                  <div
                    className={`absolute h-full rounded ${statusColors[task.status]} opacity-80`}
                    style={{
                      left: `${task.leftPercent}%`,
                      width: `${task.widthPercent}%`
                    }}
                    data-testid={`gantt-bar-${task.id}`}
                  >
                    {/* Progress Indicator */}
                    <div
                      className="h-full bg-white bg-opacity-30 rounded-l"
                      style={{ width: `${task.progress}%` }}
                    />
                    
                    {/* Task Duration Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white font-medium px-1 truncate">
                        {task.duration}d
                      </span>
                    </div>
                  </div>

                  {/* Dependency Lines */}
                  {task.dependsOn.length > 0 && (
                    <div className="absolute -top-1 left-0 w-2 h-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full" title="Has dependencies" />
                    </div>
                  )}
                </div>

                {/* Date Range */}
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{format(task.taskStart, "MMM d")}</span>
                  <span>{format(task.taskEnd, "MMM d")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 pt-4 border-t">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>To Do</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Done</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Has Dependencies</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}