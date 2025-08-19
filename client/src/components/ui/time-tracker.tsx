import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, Pause, Square, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  description?: string;
  hours: number;
  date: string;
  billable: boolean;
  createdAt: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface TimeTrackerProps {
  taskId: string;
  taskTitle: string;
}

export function TimeTracker({ taskId, taskTitle }: TimeTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [timeForm, setTimeForm] = useState({
    hours: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    billable: false
  });

  // Fetch time entries
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: [`/api/tasks/${taskId}/time-entries`],
  });

  // Create time entry mutation
  const createTimeEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      return await apiRequest("POST", `/api/tasks/${taskId}/time-entries`, entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/time-entries`] });
      setIsAddEntryOpen(false);
      setTimeForm({ hours: "", description: "", date: new Date().toISOString().split('T')[0], billable: false });
      toast({
        title: "Time entry added",
        description: "Your time has been logged successfully.",
      });
    },
  });

  const handleStartStop = () => {
    if (!isTracking) {
      setIsTracking(true);
      setStartTime(new Date());
      setElapsedTime(0);
    } else {
      if (startTime) {
        const endTime = new Date();
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        // Automatically create time entry
        createTimeEntryMutation.mutate({
          hours: Number(hours.toFixed(2)),
          description: `Tracked time on ${taskTitle}`,
          date: new Date().toISOString(),
          billable: false
        });
      }
      
      setIsTracking(false);
      setStartTime(null);
      setElapsedTime(0);
    }
  };

  const handleManualEntry = () => {
    if (!timeForm.hours || parseFloat(timeForm.hours) <= 0) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number of hours.",
        variant: "destructive"
      });
      return;
    }

    createTimeEntryMutation.mutate({
      hours: parseFloat(timeForm.hours),
      description: timeForm.description,
      date: new Date(timeForm.date).toISOString(),
      billable: timeForm.billable
    });
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Time Tracking</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timer Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleStartStop}
                variant={isTracking ? "destructive" : "default"}
                size="sm"
                data-testid={isTracking ? "button-stop-timer" : "button-start-timer"}
              >
                {isTracking ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              
              {isTracking && (
                <Badge variant="secondary" className="font-mono">
                  {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
                </Badge>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddEntryOpen(true)}
              data-testid="button-add-time-entry"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>

          {/* Total Hours */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total logged: <span className="font-semibold">{totalHours.toFixed(2)} hours</span>
          </div>

          {/* Recent Entries */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Entries</h4>
            {timeEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No time entries yet</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {timeEntries.slice(0, 5).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div>
                      <span className="font-medium">{entry.hours}h</span>
                      {entry.description && (
                        <span className="ml-2 text-gray-500">{entry.description}</span>
                      )}
                    </div>
                    <div className="text-gray-400">
                      {format(new Date(entry.date), "MMM d")}
                      {entry.billable && (
                        <Badge variant="outline" className="ml-1 text-xs">Billable</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Manual Time Entry Dialog */}
        <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  min="0"
                  value={timeForm.hours}
                  onChange={(e) => setTimeForm(prev => ({ ...prev, hours: e.target.value }))}
                  placeholder="2.5"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={timeForm.date}
                  onChange={(e) => setTimeForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={timeForm.description}
                  onChange={(e) => setTimeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What did you work on?"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="billable"
                  checked={timeForm.billable}
                  onChange={(e) => setTimeForm(prev => ({ ...prev, billable: e.target.checked }))}
                />
                <Label htmlFor="billable">Billable time</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddEntryOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualEntry}
                  disabled={createTimeEntryMutation.isPending}
                >
                  {createTimeEntryMutation.isPending ? "Adding..." : "Add Entry"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}