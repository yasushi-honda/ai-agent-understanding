import type { Task, TaskStep } from "../types/task.js";
import { getRegisteredAgentNames } from "./agent-registry.js";

const tasks = new Map<string, Task>();
let nextId = 1;

export function createTask(
  objective: string,
  requiredAgents: string[],
  steps: Array<{ agent: string; action: string; input?: string }>
): Task {
  const registered = getRegisteredAgentNames();
  const unknown = requiredAgents.filter((a) => !registered.includes(a));
  if (unknown.length > 0) {
    throw new Error(`未登録のエージェント: ${unknown.join(", ")}`);
  }

  const taskSteps: TaskStep[] = steps.map((s) => ({
    agent: s.agent,
    action: s.action,
    input: s.input,
    status: "pending",
  }));

  const task: Task = {
    id: `task-${nextId++}`,
    objective,
    requiredAgents,
    steps: taskSteps,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  tasks.set(task.id, task);
  return task;
}

export function getTask(taskId: string): Task | undefined {
  return tasks.get(taskId);
}

export function listTasks(): Task[] {
  return Array.from(tasks.values());
}

export function updateTaskStatus(
  taskId: string,
  status: Task["status"]
): void {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`タスク ${taskId} が見つかりません`);
  task.status = status;
  if (status === "completed" || status === "failed") {
    task.completedAt = new Date().toISOString();
  }
}

export function updateStepStatus(
  taskId: string,
  stepIndex: number,
  status: TaskStep["status"],
  result?: string,
  error?: string
): void {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`タスク ${taskId} が見つかりません`);
  if (stepIndex < 0 || stepIndex >= task.steps.length) {
    throw new Error(`ステップ ${stepIndex} が範囲外です`);
  }
  task.steps[stepIndex].status = status;
  if (result !== undefined) task.steps[stepIndex].result = result;
  if (error !== undefined) task.steps[stepIndex].error = error;
}
