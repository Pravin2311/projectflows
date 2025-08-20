import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Plus,
  Save,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

interface TimeTrackerProps {
  taskId: string;
  currentHours: number;
  currentProgress: number;
  estimatedHours?: number;
  onUpdateTime: (hours: number) => void;
  onUpdateProgress: (progress: number) => void;
}

export function TimeTracker({
  taskId,
  currentHours,
  currentProgress,
  estimatedHours,
  onUpdateTime,
  onUpdateProgress
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0); // in seconds
  const [manualHours, setManualHours] = useState("");
  const [progress, setProgress] = useState([currentProgress]);
  const [sessions, setSessions] = useState<{time: number, date: string}[]>([]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Load saved sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem(`task-sessions-${taskId}`);
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, [taskId]);

  const startTimer = () => {
    setIsRunning(true);
    setSessionTime(0);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (sessionTime > 0) {
      const hoursToAdd = sessionTime / 3600;
      const newSession = {
        time: sessionTime,
        date: new Date().toISOString()
      };
      
      // Save session
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      localStorage.setItem(`task-sessions-${taskId}`, JSON.stringify(updatedSessions));
      
      // Update total time
      onUpdateTime(currentHours + hoursToAdd);
      setSessionTime(0);
    }
  };

  const addManualTime = () => {
    const hours = parseFloat(manualHours);
    if (hours > 0) {
      onUpdateTime(currentHours + hours);
      setManualHours("");
    }
  };

  const updateProgress = () => {
    onUpdateProgress(progress[0]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-yellow-500";
    if (progress < 75) return "bg-blue-500";
    return "bg-green-500";
  };

  const completionRate = estimatedHours ? Math.min((currentHours / estimatedHours) * 100, 100) : 0;

  return (
    <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Tracking
        </h4>
        <Badge variant="outline" className="text-xs">
          {currentHours.toFixed(1)}h logged
        </Badge>
      </div>

      {/* Active Timer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Session</span>
          <div className="text-lg font-mono font-bold text-blue-600">
            {formatTime(sessionTime)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button onClick={startTimer} size="sm" className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={pauseTimer} size="sm" variant="outline" className="flex items-center gap-1">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          
          <Button 
            onClick={stopTimer} 
            size="sm" 
            variant="destructive" 
            disabled={sessionTime === 0}
            className="flex items-center gap-1"
          >
            <Square className="h-4 w-4" />
            Stop & Save
          </Button>
        </div>
      </div>

      {/* Manual Time Entry */}
      <div className="space-y-2">
        <Label htmlFor="manual-time" className="text-sm font-medium">Add Time Manually</Label>
        <div className="flex items-center gap-2">
          <Input
            id="manual-time"
            type="number"
            step="0.1"
            min="0"
            placeholder="Hours"
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            className="w-24"
          />
          <Button 
            onClick={addManualTime} 
            size="sm" 
            disabled={!manualHours || parseFloat(manualHours) <= 0}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Task Progress</Label>
          <span className="text-sm font-bold text-gray-700">{progress[0]}%</span>
        </div>
        
        <div className="space-y-2">
          <Slider
            value={progress}
            onValueChange={setProgress}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <Button 
          onClick={updateProgress} 
          size="sm" 
          variant="outline"
          disabled={progress[0] === currentProgress}
          className="flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          Update Progress
        </Button>
      </div>

      {/* Time Statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="text-gray-500">Time Spent</div>
          <div className="font-bold text-lg">{currentHours.toFixed(1)}h</div>
        </div>
        
        {estimatedHours && (
          <div className="space-y-1">
            <div className="text-gray-500">Estimated</div>
            <div className="font-bold text-lg">{estimatedHours}h</div>
          </div>
        )}
        
        <div className="space-y-1">
          <div className="text-gray-500">Progress</div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-12 rounded-full ${getProgressColor(currentProgress)}`} style={{width: `${Math.max(currentProgress, 5)}%`}}></div>
            <span className="font-bold">{currentProgress}%</span>
          </div>
        </div>
        
        {estimatedHours && (
          <div className="space-y-1">
            <div className="text-gray-500">Completion Rate</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="font-bold">{completionRate.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Recent Sessions</Label>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {sessions.slice(-3).reverse().map((session, index) => (
              <div key={index} className="flex justify-between text-xs text-gray-600 bg-white p-2 rounded">
                <span>{format(new Date(session.date), 'MMM d, h:mm a')}</span>
                <span>{(session.time / 3600).toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}