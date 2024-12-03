import { Models } from "node-appwrite";

export enum TaskStatus {
  BACKLOG = 'BACKLOG', // 待处理
  TODO = 'TODO', // 待办
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  IN_REVIEW = 'IN_REVIEW', // 待审核
  DONE = 'DONE', // 已完成
}

export type Task = Models.Document & {
  name: string;
  status: TaskStatus;
  assigneeId: string;
  projectId: string;
  position: number;
  dueDate: string;
}