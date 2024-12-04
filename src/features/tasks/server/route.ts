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
.delete(
  "/:taskId",
  sessionMiddleware,
  async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    const { taskId } = c.req.param();

    const task = await databases.getDocument<Task>( // 通过 projectId 获取项目
      DATABASE_ID,
      TASKS_ID,
      taskId,
    );

    const member = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: user.$id,
    })

    if(!member) return c.json({error: "Unauthorized"}, 401);

    await databases.deleteDocument(DATABASE_ID, TASKS_ID, taskId);

    return c.json({data: { $id: task.$id }});
  }
)
.patch(
  "/:taskId",
  sessionMiddleware,
  zValidator("json", createTaskSchema.partial()), // 使用 partial() 方法将 schema 变为可选的，因为我们不需要所有字段都传递
  async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    const {
      name, status, description, projectId, dueDate, assigneeId
    } = c.req.valid("json");

    const { taskId } = c.req.param();

    const existingTask = await databases.getDocument<Task>(
      DATABASE_ID,
      TASKS_ID,
      taskId,
    )

    const member = await getMember({
      databases,
      workspaceId: existingTask.workspaceId,
      userId: user.$id,
    })

    if(!member) return c.json({error: "Unauthorized"}, 401);

    const task = await databases.updateDocument(
      DATABASE_ID, 
      TASKS_ID, 
      taskId,
      {
        name,
        status,
        projectId,
        dueDate,
        assigneeId,
        description,
      }
    );

    return c.json({data: task});
  }
)
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
)
.get(
  "/:taskId",
  sessionMiddleware,
  async(c)=>{
    const currentUser = c.get("user");
    const databases = c.get("databases");
    const { users } = await createAdminClient();
    const { taskId } = c.req.param();

    const task = await databases.getDocument<Task>(
      DATABASE_ID,
      TASKS_ID,
      taskId,
    )

    const currentMember = await getMember({ // 获取当前用户的信息，如果不是项目成员则返回 401
      databases,
      workspaceId: task.workspaceId,
      userId: currentUser.$id,
    })

    if(!currentMember) return c.json({error: "Unauthorized"}, 401);

    const project = await databases.getDocument<Project> ( // 根据 projectId 获取项目
      DATABASE_ID,
      PROJECTS_ID,
      task.projectId,
    );

    const member = await databases.getDocument( // 根据 assigneeId 获取负责人信息
      DATABASE_ID,
      MEMBERS_ID,
      task.assigneeId,
    );

    const user = await users.get(member.userId); // 根据 member 中的 userId 获取更具体的用户信息

    const assignee = { // assignee 中只有 userId，我们需要展示更多的用户信息
      ...member,
      name: user.name,
      email: user.email,
    }

    return c.json({
      data: {
        ...task,
        project,
        assignee,
      }
    })
  }
)
.post(
  "/bulk-update",
  sessionMiddleware,
  zValidator("json", z.object({
    tasks: z.array(z.object({
      $id: z.string(),
      status: z.nativeEnum(TaskStatus),
      position: z.number().int().positive().min(1000).max(1000000),
    })),
  })),
  async (c) => {
    const databases = c.get("databases")
    const user = c.get("user");
    const { tasks } = c.req.valid("json");

    // 获取所有需要更新的任务
    const tasksToUpdate = await databases.listDocuments<Task>(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.contains("$id", tasks.map((task)=>task.$id))
      ]
    )

    // 获取所有需要更新的任务所在的工作区
    const workspaceIds = new Set(tasksToUpdate.documents.map((task)=>task.workspaceId));
    if(workspaceIds.size!==1) { // 如果工作区不止一个，则返回错误，因为我们只能在一个工作区内更新任务
      return c.json({error: "Tasks must be in the same workspace"}, 400);
    }

    const workspaceId = workspaceIds.values().next().value;

    if(!workspaceId) return c.json({error: "Invalid workspace"}, 400);

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    })

    if(!member) return c.json({error: "Unauthorized"}, 401);

    const updatedTasks = await Promise.all(
      tasks.map(async (task)=>{
        const {$id, status, position} = task;
        return databases.updateDocument<Task>(
          DATABASE_ID,
          TASKS_ID,
          $id,
          {
            status,
            position,
          }
        )
      })
    )

    return c.json({data: updatedTasks});
  }

)

export default app;
