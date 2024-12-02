import { z } from "zod";
import { TaskStatus } from "./types";

export const createTaskSchema = z.object({
  name: z.string().min(1, "Required"),
  status: z.nativeEnum(TaskStatus, { required_error: "Required" }),
  workspaceId: z.string().trim().min(1, "Required"),
  projectId: z.string().trim().min(1, "Required"),
  dueDate: z.coerce.date(), // 将输入的值转换为日期类型，如果无法转换则返回 undefined
  assigneeId: z.string().trim().min(1,"Required"), // 任务负责人
  description: z.string().optional(),
})