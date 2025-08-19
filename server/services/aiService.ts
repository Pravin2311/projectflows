import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import type { InsertAiSuggestion, Task, Project } from "../../shared/schema.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ProjectAnalysis {
  suggestions: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
}

export class AiService {
  async analyzeProject(projectId: string): Promise<ProjectAnalysis> {
    try {
      const project = await storage.getProject(projectId);
      const tasks = await storage.getProjectTasks(projectId);
      
      if (!project) {
        throw new Error("Project not found");
      }

      const projectContext = this.buildProjectContext(project, tasks);
      
      const systemPrompt = `You are an AI project management assistant. Analyze the project data and provide actionable suggestions to improve team productivity and project outcomes.
      
Consider:
- Task distribution and workload balance
- Potential blockers and dependencies
- Sprint planning optimization
- Team collaboration opportunities
- Timeline and deadline management

Respond with JSON in this format:
{
  "suggestions": [
    {
      "type": "task_optimization|schedule_meeting|workload_balance|timeline_adjustment",
      "title": "Brief suggestion title",
      "description": "Detailed actionable description",
      "priority": "low|medium|high"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string" },
                  },
                  required: ["type", "title", "description", "priority"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
        contents: projectContext,
      });

      const rawJson = response.text;
      if (rawJson) {
        const analysis: ProjectAnalysis = JSON.parse(rawJson);
        
        // Store suggestions in database
        for (const suggestion of analysis.suggestions) {
          await storage.createAiSuggestion({
            type: suggestion.type,
            title: suggestion.title,
            description: suggestion.description,
            projectId,
            priority: suggestion.priority as "low" | "medium" | "high",
          });
        }
        
        return analysis;
      } else {
        throw new Error("Empty response from AI model");
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      return { suggestions: [] };
    }
  }

  async generateTaskSuggestions(projectId: string, taskTitle: string): Promise<string> {
    try {
      const project = await storage.getProject(projectId);
      const tasks = await storage.getProjectTasks(projectId);
      
      if (!project) {
        throw new Error("Project not found");
      }

      const prompt = `Based on the project "${project.name}" and existing tasks, suggest a detailed description and potential subtasks for a new task titled "${taskTitle}".

Existing tasks:
${tasks.map(t => `- ${t.title}: ${t.description || 'No description'}`).join('\n')}

Provide a comprehensive task description that fits well with the project context.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "Consider breaking this task into smaller, actionable items and defining clear acceptance criteria.";
    } catch (error) {
      console.error("Task suggestion generation failed:", error);
      return "Consider breaking this task into smaller, actionable items and defining clear acceptance criteria.";
    }
  }

  async predictTaskDuration(taskDescription: string, taskTitle: string): Promise<number> {
    try {
      const prompt = `Based on the task title "${taskTitle}" and description "${taskDescription}", estimate how many days this task would typically take to complete for a skilled developer/team member.

Consider:
- Complexity of the work
- Typical development/design/testing time
- Documentation and review time

Respond with only a number representing the estimated days (can be decimal like 2.5 for 2.5 days).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const durationText = response.text?.trim();
      const duration = parseFloat(durationText || "3");
      
      return isNaN(duration) ? 3 : Math.max(0.5, Math.min(30, duration)); // Clamp between 0.5 and 30 days
    } catch (error) {
      console.error("Duration prediction failed:", error);
      return 3; // Default to 3 days
    }
  }

  private buildProjectContext(project: Project, tasks: Task[]): string {
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'done');
    
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
    
    return `Project: ${project.name}
Description: ${project.description || 'No description'}

Task Summary:
- Total tasks: ${tasks.length}
- To Do: ${todoTasks.length}
- In Progress: ${inProgressTasks.length}
- Completed: ${doneTasks.length}
- Overdue: ${overdueTasks.length}

Tasks breakdown:
To Do Tasks:
${todoTasks.map(t => `- ${t.title} (Priority: ${t.priority}${t.dueDate ? `, Due: ${t.dueDate}` : ''})`).join('\n')}

In Progress Tasks:
${inProgressTasks.map(t => `- ${t.title} (Progress: ${t.progress}%, Priority: ${t.priority}${t.dueDate ? `, Due: ${t.dueDate}` : ''})`).join('\n')}

Overdue Tasks:
${overdueTasks.map(t => `- ${t.title} (Due: ${t.dueDate}, Status: ${t.status})`).join('\n')}`;
  }
}

export const aiService = new AiService();
