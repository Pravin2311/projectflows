import { GoogleGenAI } from '@google/genai';
import type { Project, Task } from '@shared/schema';

interface ProjectInsights {
  workloadAnalysis: string;
  taskOptimization: string[];
  riskAssessment: string;
  productivityRecommendations: string[];
  timelinePrediction: string;
  teamBalancing: string[];
}

export class AIInsightsService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateProjectInsights(project: Project, tasks: Task[], teamMembers: any[]): Promise<ProjectInsights> {
    const projectData = {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt
      },
      tasks: tasks.map(task => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        progress: task.progress,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        tags: task.tags
      })),
      teamMembers: teamMembers.map(member => ({
        email: member.email,
        role: member.role
      }))
    };

    const prompt = `
Analyze this project management data and provide actionable insights:

${JSON.stringify(projectData, null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "workloadAnalysis": "Brief analysis of current workload distribution and bottlenecks",
  "taskOptimization": ["Specific suggestion 1", "Specific suggestion 2", "Specific suggestion 3"],
  "riskAssessment": "Assessment of project risks and potential delays",
  "productivityRecommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "timelinePrediction": "Realistic timeline prediction based on current progress",
  "teamBalancing": ["Team balancing suggestion 1", "Team balancing suggestion 2"]
}

Focus on:
- Identifying overloaded team members
- Tasks that may be blocking others
- Opportunities to optimize task sequencing
- Realistic timeline adjustments
- Productivity improvements
- Risk mitigation strategies

Keep suggestions specific and actionable.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      
      // Parse JSON response
      const insights: ProjectInsights = JSON.parse(text);
      return insights;
    } catch (error) {
      console.error('AI Insights generation error:', error);
      throw new Error('Failed to generate AI insights. Please check your Google AI API key.');
    }
  }

  async generateWorkloadAnalysis(teamMembers: any[], tasks: Task[]): Promise<any> {
    const workloadData = teamMembers.map(member => {
      const memberTasks = tasks.filter(task => task.assigneeId === member.email);
      const totalEstimated = memberTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
      const totalActual = memberTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
      
      return {
        email: member.email,
        role: member.role,
        assignedTasks: memberTasks.length,
        totalEstimatedHours: totalEstimated,
        totalActualHours: totalActual,
        completedTasks: memberTasks.filter(t => t.status === 'done').length,
        inProgressTasks: memberTasks.filter(t => t.status === 'in_progress').length,
        todoTasks: memberTasks.filter(t => t.status === 'todo').length
      };
    });

    const prompt = `
Analyze team workload distribution and provide recommendations:

${JSON.stringify(workloadData, null, 2)}

Provide analysis in this JSON format:
{
  "overloadedMembers": ["member1@email.com", "member2@email.com"],
  "underutilizedMembers": ["member3@email.com"],
  "recommendations": ["Specific rebalancing recommendation 1", "Recommendation 2"],
  "efficiencyInsights": ["Insight about team efficiency 1", "Insight 2"],
  "workloadScore": "Overall workload balance score from 1-10 with explanation"
}

Focus on identifying imbalances and providing specific redistribution recommendations.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Workload analysis error:', error);
      throw new Error('Failed to analyze team workload.');
    }
  }
}