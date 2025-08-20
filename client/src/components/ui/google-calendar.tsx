import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  ExternalLink,
  Bell
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  htmlLink: string;
  status: 'tentative' | 'confirmed' | 'cancelled';
  created: string;
  updated: string;
}

interface GoogleCalendarProps {
  projectId?: string;
  projectName?: string;
  teamMembers?: string[];
}

export function GoogleCalendar({ projectId, projectName, teamMembers = [] }: GoogleCalendarProps) {
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState(false);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  
  // Event form data
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventAttendees, setEventAttendees] = useState("");
  const [includeMeet, setIncludeMeet] = useState(false);
  
  // Milestone form data
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch upcoming events
  const { data: events = [], isLoading } = useQuery<GoogleCalendarEvent[]>({
    queryKey: ['/api/google/calendars/primary/events'],
    queryFn: async () => {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead
      const response = await fetch(`/api/google/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}`, { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  // Fetch project deadlines if projectId provided
  const { data: projectDeadlines = [] } = useQuery<GoogleCalendarEvent[]>({
    queryKey: [`/api/projects/${projectId}/calendar/deadlines`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/calendar/deadlines`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch deadlines');
      return response.json();
    },
    enabled: !!projectId
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: any) => apiRequest('POST', '/api/google/calendars/primary/events', eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/calendars/primary/events'] });
      setIsCreateEventOpen(false);
      resetEventForm();
      toast({
        title: "Event created",
        description: "Calendar event has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create calendar event.",
        variant: "destructive",
      });
    }
  });

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: (milestoneData: any) => 
      apiRequest('POST', `/api/projects/${projectId}/calendar/milestone`, milestoneData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/calendars/primary/events'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/calendar/deadlines`] });
      setIsCreateMilestoneOpen(false);
      resetMilestoneForm();
      toast({
        title: "Milestone created",
        description: "Project milestone has been added to your calendar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create milestone.",
        variant: "destructive",
      });
    }
  });

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: (meetingData: any) => 
      apiRequest('POST', `/api/projects/${projectId}/calendar/meeting`, meetingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/calendars/primary/events'] });
      setIsCreateMeetingOpen(false);
      resetEventForm();
      toast({
        title: "Meeting scheduled",
        description: "Team meeting has been scheduled and invitations sent.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule meeting.",
        variant: "destructive",
      });
    }
  });

  const resetEventForm = () => {
    setEventTitle("");
    setEventDescription("");
    setEventStart("");
    setEventEnd("");
    setEventLocation("");
    setEventAttendees("");
    setIncludeMeet(false);
  };

  const resetMilestoneForm = () => {
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneDue("");
  };

  const handleCreateEvent = () => {
    if (!eventTitle.trim() || !eventStart || !eventEnd) {
      toast({
        title: "Error",
        description: "Title, start time, and end time are required.",
        variant: "destructive"
      });
      return;
    }

    const eventData = {
      summary: eventTitle,
      description: eventDescription || undefined,
      startDateTime: eventStart,
      endDateTime: eventEnd,
      location: eventLocation || undefined,
      attendees: eventAttendees ? eventAttendees.split(',').map(email => email.trim()) : undefined,
      conferenceData: includeMeet
    };

    createEventMutation.mutate(eventData);
  };

  const handleCreateMilestone = () => {
    if (!milestoneTitle.trim() || !milestoneDue) {
      toast({
        title: "Error",
        description: "Title and due date are required.",
        variant: "destructive"
      });
      return;
    }

    const milestoneData = {
      title: milestoneTitle,
      description: milestoneDescription || undefined,
      dueDate: milestoneDue,
      attendees: teamMembers
    };

    createMilestoneMutation.mutate(milestoneData);
  };

  const handleCreateMeeting = () => {
    if (!eventTitle.trim() || !eventStart || !eventEnd) {
      toast({
        title: "Error",
        description: "Title, start time, and end time are required.",
        variant: "destructive"
      });
      return;
    }

    const meetingData = {
      title: eventTitle,
      description: eventDescription || undefined,
      startDateTime: eventStart,
      endDateTime: eventEnd,
      attendees: eventAttendees ? eventAttendees.split(',').map(email => email.trim()) : teamMembers,
      location: eventLocation || undefined,
      includeMeet: includeMeet
    };

    createMeetingMutation.mutate(meetingData);
  };

  const formatEventTime = (event: GoogleCalendarEvent) => {
    if (event.start.dateTime && event.end.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'h:mm a')}`;
    }
    return 'All day';
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'tentative': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-event">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Calendar Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-title">Title</Label>
                  <Input
                    id="event-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Event title"
                    data-testid="input-event-title"
                  />
                </div>
                <div>
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Event description (optional)"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="event-start">Start</Label>
                    <Input
                      id="event-start"
                      type="datetime-local"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      data-testid="input-event-start"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-end">End</Label>
                    <Input
                      id="event-end"
                      type="datetime-local"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      data-testid="input-event-end"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="event-location">Location</Label>
                  <Input
                    id="event-location"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Event location (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="event-attendees">Attendees</Label>
                  <Input
                    id="event-attendees"
                    value={eventAttendees}
                    onChange={(e) => setEventAttendees(e.target.value)}
                    placeholder="email1@domain.com, email2@domain.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-meet"
                    checked={includeMeet}
                    onChange={(e) => setIncludeMeet(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="include-meet">Include Google Meet link</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateEvent}
                    disabled={createEventMutation.isPending}
                    data-testid="button-save-event"
                  >
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {projectId && (
            <>
              <Dialog open={isCreateMilestoneOpen} onOpenChange={setIsCreateMilestoneOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-create-milestone">
                    <Bell className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Project Milestone</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="milestone-title">Milestone Title</Label>
                      <Input
                        id="milestone-title"
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        placeholder="Milestone title"
                        data-testid="input-milestone-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="milestone-description">Description</Label>
                      <Textarea
                        id="milestone-description"
                        value={milestoneDescription}
                        onChange={(e) => setMilestoneDescription(e.target.value)}
                        placeholder="Milestone description (optional)"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="milestone-due">Due Date</Label>
                      <Input
                        id="milestone-due"
                        type="datetime-local"
                        value={milestoneDue}
                        onChange={(e) => setMilestoneDue(e.target.value)}
                        data-testid="input-milestone-due"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateMilestoneOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateMilestone}
                        disabled={createMilestoneMutation.isPending}
                        data-testid="button-save-milestone"
                      >
                        Create Milestone
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCreateMeetingOpen} onOpenChange={setIsCreateMeetingOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-create-meeting">
                    <Users className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Schedule Team Meeting</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="meeting-title">Meeting Title</Label>
                      <Input
                        id="meeting-title"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Meeting title"
                        data-testid="input-meeting-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="meeting-description">Agenda</Label>
                      <Textarea
                        id="meeting-description"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Meeting agenda (optional)"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="meeting-start">Start</Label>
                        <Input
                          id="meeting-start"
                          type="datetime-local"
                          value={eventStart}
                          onChange={(e) => setEventStart(e.target.value)}
                          data-testid="input-meeting-start"
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-end">End</Label>
                        <Input
                          id="meeting-end"
                          type="datetime-local"
                          value={eventEnd}
                          onChange={(e) => setEventEnd(e.target.value)}
                          data-testid="input-meeting-end"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="meeting-location">Location</Label>
                      <Input
                        id="meeting-location"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="Meeting location (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="meeting-attendees">Additional Attendees</Label>
                      <Input
                        id="meeting-attendees"
                        value={eventAttendees}
                        onChange={(e) => setEventAttendees(e.target.value)}
                        placeholder="extra@domain.com (team members auto-included)"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="meeting-include-meet"
                        checked={includeMeet}
                        onChange={(e) => setIncludeMeet(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="meeting-include-meet">Include Google Meet link</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateMeetingOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateMeeting}
                        disabled={createMeetingMutation.isPending}
                        data-testid="button-save-meeting"
                      >
                        Schedule Meeting
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading calendar events...</div>
        ) : (
          <div className="space-y-4">
            {/* Project deadlines section */}
            {projectId && projectDeadlines.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Project Deadlines</h4>
                <div className="space-y-2">
                  {projectDeadlines.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <Bell className="h-4 w-4 text-yellow-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.summary}</p>
                        <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(event.htmlLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming events */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Upcoming Events</h4>
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No upcoming events. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      data-testid={`event-${event.id}`}
                    >
                      <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.summary}
                          </p>
                          <Badge className={getEventStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatEventTime(event)}</span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{event.attendees.length} attendees</span>
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(event.htmlLink, '_blank')}
                        data-testid={`button-open-event-${event.id}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}