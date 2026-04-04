export interface TaskStep {
  agent: string;
  action: string;
  input?: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
}

export interface Task {
  id: string;
  objective: string;
  requiredAgents: string[];
  steps: TaskStep[];
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
}
