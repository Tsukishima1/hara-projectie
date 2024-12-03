import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { createTaskSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID } from "@/config";
import { z } from "zod";
import { ID, Query } from "node-appwrite";
import { Task, TaskStatus } from "../types";
import { createAdminClient } from "@/lib/appwrite";
import { Project } from "@/features/projects/types";

const app = new Hono()
.get(
  "/",
  sessionMiddleware,
  zValidator("query", z.object({
    workspaceId: z.string(),
    projectId: z.string().nullish(),
    assigneeId: z.string().nullish(),
    status: z.nativeEnum(TaskStatus).nullish(),
    search: z.string().nullish(),
    dueDate: z.string().nullish(),
  })),
  async (c) => {
    const {users} = await createAdminClient(); // 查询用户信息，用于获取任务负责人的信息

    const user = c.get("user");
    const databases = c.get("databases");

    const {
      workspaceId,
      projectId,
      status,
      search,
      dueDate,
      assigneeId,
    } = c.req.valid("query");

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    })

    if(!member) return c.json({error: "Unauthorized"}, 401);

    const query = [
      Query.equal("workspaceId", workspaceId),
      Query.orderDesc("$createdAt"),
    ];

    if(projectId) {
      console.log("projectId:", projectId);
      query.push(Query.equal("projectId", projectId));
    }

    if(status) {
      console.log("status:", status);
      query.push(Query.equal("status", status));
    }

    if(assigneeId) {
      console.log("assigneeId:", assigneeId);
      query.push(Query.equal("assigneeId", assigneeId));
    }

    if(dueDate) {
      console.log("dueDate:", dueDate);
      query.push(Query.equal("dueDate", dueDate));
    }

    if(search) {
      console.log("search:", search);
      query.push(Query.equal("name", search));
    }

    const tasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, query);

    const projectIds = tasks.documents.map((task) => task.projectId);
    const assigneeIds = tasks.documents.map((task) => task.assigneeId);

    const projects = await databases.listDocuments<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectIds.length>0?[Query.contains("$id", projectIds)]:[] 
    );

    const members = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      assigneeIds.length>0?[Query.contains("$id", assigneeIds)]:[] 
    );

    const assignees = await Promise.all( 
      members.documents.map(async (member)=> {
        const user = await users.get(member.userId);

        return {
          ...member,
          name: user.name,
          email: user.email,
        }
      })
    )

    // 将任务的项目名称和负责人名称添加到任务数据中, 以便前端展示
    const populatedTasks = tasks.documents.map((task) => {
      const project = projects.documents.find((project) => project.$id === task.projectId);
      const assignee = assignees.find((assignee) => assignee.$id === task.assigneeId);

      return {
        ...task,
        project,
        assignee,
      }
    });

    return c.json({data: {
      ...tasks,
      documents: populatedTasks,
    }});
  }
)
.post(
  "/",
  sessionMiddleware,
  zValidator("json", createTaskSchema),
  async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    const {
      name,
      status,
      workspaceId,
      projectId,
      dueDate,
      assigneeId,
      description,
    } = c.req.valid("json");

    const member = await getMember({
      databases,
      workspaceId: workspaceId,
      userId: user.$id,
    });

    if (!member) return c.json({ error: "Unauthorized" }, 401);

    // 查询当前状态下的最高位置的任务，然后将新任务的位置设置为最高位置的任务的位置+1000
    // 因为我们的任务列表是按照位置排序的，所以这样可以确保新任务在最后
    const highestPositionTask = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("status", status),
        Query.equal("workspaceId", workspaceId),
        Query.orderAsc("position"),
        Query.limit(1),
      ]
    );

    const newPosition =
      highestPositionTask.documents.length > 0
        ? highestPositionTask.documents[0].position + 1000
        : 1000;

    const task = await databases.createDocument(
      DATABASE_ID,
      TASKS_ID,
      ID.unique(), // 使用唯一 ID 作为任务 ID
      {
        name,
        status,
        workspaceId,
        projectId,
        dueDate,
        assigneeId,
        description,
        position: newPosition,
      }
    );

    return c.json({ data: task });
  }
);

export default app;
