import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { 
  AtSign, 
  Paperclip, 
  Link2, 
  X, 
  Upload, 
  FileText,
  Send 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Task {
  id: string;
  title: string;
}

interface RichCommentEditorProps {
  projectId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (data: {
    content: string;
    mentions: string[];
    attachments: File[];
    taskLinks: string[];
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  submitText?: string;
}

export function RichCommentEditor({
  projectId,
  value,
  onChange,
  onSubmit,
  placeholder = "Add a comment...",
  disabled = false,
  submitText = "Comment"
}: RichCommentEditorProps) {
  const [mentions, setMentions] = useState<User[]>([]);
  const [taskLinks, setTaskLinks] = useState<Task[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch project members for mentions
  const { data: projectMembers = [] } = useQuery<User[]>({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
  });

  // Fetch project tasks for linking
  const { data: projectTasks = [] } = useQuery<Task[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
  });

  // Handle @ mentions
  useEffect(() => {
    const handleTextChange = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
          setMentionQuery(textAfterAt);
          setShowMentions(true);
          return;
        }
      }
      setShowMentions(false);
    };

    handleTextChange();
  }, [value]);

  // Handle # task links
  useEffect(() => {
    const handleTextChange = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
      
      if (lastHashIndex !== -1) {
        const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
        if (!textAfterHash.includes(' ') && textAfterHash.length >= 0) {
          setTaskQuery(textAfterHash);
          setShowTasks(true);
          return;
        }
      }
      setShowTasks(false);
    };

    handleTextChange();
  }, [value]);

  const insertMention = (user: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const newText = 
      textBeforeCursor.substring(0, lastAtIndex) + 
      `@${user.firstName} ${user.lastName} ` + 
      textAfterCursor;
    
    onChange(newText);
    setShowMentions(false);
    
    // Add to mentions if not already there
    if (!mentions.find(m => m.id === user.id)) {
      setMentions([...mentions, user]);
    }
  };

  const insertTaskLink = (task: Task) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    const newText = 
      textBeforeCursor.substring(0, lastHashIndex) + 
      `#${task.title} ` + 
      textAfterCursor;
    
    onChange(newText);
    setShowTasks(false);
    
    // Add to task links if not already there
    if (!taskLinks.find(t => t.id === task.id)) {
      setTaskLinks([...taskLinks, task]);
    }
  };

  const removeMention = (userId: string) => {
    setMentions(mentions.filter(m => m.id !== userId));
  };

  const removeTaskLink = (taskId: string) => {
    setTaskLinks(taskLinks.filter(t => t.id !== taskId));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!value.trim() && attachments.length === 0) return;

    onSubmit({
      content: value,
      mentions: mentions.map(m => m.id),
      attachments,
      taskLinks: taskLinks.map(t => t.id),
    });

    // Reset state
    onChange("");
    setMentions([]);
    setTaskLinks([]);
    setAttachments([]);
  };

  const filteredMembers = projectMembers.filter(member =>
    !mentionQuery || 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(mentionQuery.toLowerCase()))
  );

  const filteredTasks = projectTasks.filter(task =>
    !taskQuery || 
    task.title.toLowerCase().includes(taskQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Tags for mentions and task links */}
      {(mentions.length > 0 || taskLinks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {mentions.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              <AtSign className="h-3 w-3" />
              {user.firstName} {user.lastName}
              <button
                onClick={() => removeMention(user.id)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {taskLinks.map((task) => (
            <Badge key={task.id} variant="outline" className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              {task.title}
              <button
                onClick={() => removeTaskLink(task.id)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* File attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 flex-1">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main textarea with popover for mentions */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="resize-none"
        />
        
        {/* Mentions popover */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute z-10 w-64 mt-1 bg-white border rounded-lg shadow-lg">
            <div className="p-2 border-b text-xs text-gray-500">
              Mention someone with @
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => insertMention(member)}
                  className="w-full p-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {member.firstName?.[0] || member.email?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{member.email || 'No email'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Task links popover */}
        {showTasks && filteredTasks.length > 0 && (
          <div className="absolute z-10 w-64 mt-1 bg-white border rounded-lg shadow-lg">
            <div className="p-2 border-b text-xs text-gray-500">
              Link to task with #
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => insertTaskLink(task)}
                  className="w-full p-2 text-left hover:bg-gray-50"
                >
                  <div className="text-sm font-medium">{task.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <Paperclip className="h-4 w-4" />
            Attach
          </button>
          <span className="text-xs text-gray-500">
            @ to mention • # to link task
          </span>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={disabled || (!value.trim() && attachments.length === 0)}
          size="sm"
          className="flex items-center gap-1"
        >
          <Send className="h-4 w-4" />
          {submitText}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
      />
    </div>
  );
}