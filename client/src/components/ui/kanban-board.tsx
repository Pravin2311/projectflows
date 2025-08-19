import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Task, User } from "@shared/schema";

interface KanbanBoardProps {
  tasks: (Task & { assignee?: User; createdBy: User })[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onCreateTask: (status: string) => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-gray-100" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
];

export function KanbanBoard({ tasks, onTaskUpdate, onCreateTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks
      .filter(task => task.status === column.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    return acc;
  }, {} as Record<string, typeof tasks>);

  const handleDragEnd = (result: any) => {
    setDraggedTask(null);
    
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Update task status if moved to different column
    if (source.droppableId !== destination.droppableId) {
      onTaskUpdate(draggableId, { 
        status: destination.droppableId as "todo" | "in_progress" | "done",
        position: destination.index
      });
    } else {
      // Just update position within same column
      onTaskUpdate(draggableId, { position: destination.index });
    }
  };

  const handleDragStart = (start: any) => {
    setDraggedTask(start.draggableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="grid grid-cols-3 gap-6">
        {COLUMNS.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  column.id === 'todo' ? 'bg-gray-400' :
                  column.id === 'in_progress' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></span>
                {column.title}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  column.id === 'todo' ? 'bg-gray-100 text-gray-600' :
                  column.id === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tasksByStatus[column.id]?.length || 0}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCreateTask(column.id)}
                  className="h-8 w-8 p-0"
                  data-testid={`button-add-task-${column.id}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-96 p-2 rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? column.color : 'transparent'
                  }`}
                >
                  <div className="space-y-3">
                    {tasksByStatus[column.id]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-transform ${
                              snapshot.isDragging ? 'rotate-3 scale-105' : ''
                            }`}
                          >
                            <TaskCard
                              task={task}
                              onUpdate={onTaskUpdate}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
