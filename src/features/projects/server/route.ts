import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { getMember } from "@/features/members/utils";
import { createProjectSchema, updateProjectSchema } from "../schemas";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { Project } from "../types";
import { TASKS_ID } from '../../../config';
import { TaskStatus } from "@/features/tasks/types";

const app = new Hono()
  .post(
    "/",
    sessionMiddleware,
    zValidator("form", createProjectSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { name, image, workspaceId } = c.req.valid("form");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) return c.json({ error: "Unauthorized" }, 401);

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer
        ).toString("base64")}`;
      }

      const project = await databases.createDocument(
        DATABASE_ID,
        PROJECTS_ID,
        ID.unique(),
        {
          name,
          imageUrl: uploadedImageUrl,
          workspaceId,
        }
      );

      return c.json({ data: project });
    }
  )
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");

      const { workspaceId } = c.req.valid("query");

      if (!workspaceId) {
        return c.json({ error: "Workspace ID is required" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        // 如果用户不是工作区成员，返回 401
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projects = await databases.listDocuments(DATABASE_ID, PROJECTS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.orderDesc("$createdAt"),
      ]);

      return c.json({ data: projects });
    }
  )
  .patch(
    "/:projectId",
    sessionMiddleware,
    zValidator("form", updateProjectSchema), // 接收一个名为 form 的对象并验证
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { projectId } = c.req.param();
      const { name, image } = c.req.valid("form");

      const existingProject = await databases.getDocument<Project>( // 通过 projectId 获取项目
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      );

      const member = await getMember({ // 获取用户是否是工作区成员, 如果不是返回 401
        databases,
        workspaceId: existingProject.workspaceId,
        userId: user.$id,
      });

      if(!member) return c.json({ error: "Unauthorized" }, 401);

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer
        ).toString("base64")}`;
      } else {
        // 如果 image 不是 File 类型，那么就是一个字符串，说明用户没有上传新的图片，直接使用原来的图片
        uploadedImageUrl = image;
      }

      const project = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
        {
          name,
          imageUrl: uploadedImageUrl,
        }
      );

      return c.json({ data: project });
    }
  )
  .delete("/:projectId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { projectId } = c.req.param();

    const existingProject = await databases.getDocument<Project>( // 通过 projectId 获取项目
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({ // 获取用户是否是工作区成员, 如果不是返回 401
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // TODO: Delete members, projects, and tasks

    await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

    return c.json({ data: { $id: existingProject.$id } });
  })
  .get("/:projectId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const {projectId} = c.req.param();

    const project = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
      userId: user.$id,
    })

    if(!member) return c.json({error: "Unauthorized"}, 401);

    return c.json({data: project});
  })
  .get(
    "/:projectId/analytics",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const {projectId} = c.req.param();

      const project = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      )

      const member = await getMember({
        databases,
        workspaceId: project.workspaceId,
        userId: user.$id
      })

      if(!member) return c.json({error: "Unauthorized"}, 401);

      const now = new Date(); 
      const thisMonthStart = startOfMonth(now); // 获得当前月的起始日期
      const thisMonthEnd = endOfMonth(now); // 获得当前月的结束日期
      const lastMonthStart = startOfMonth(subMonths(now,1)) // 获得上个月的起始日期
      const lastMonthEnd = endOfMonth(subMonths(now,1)) // 获得上个月的结束日期

      const thisMonthTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      )

      const lastMonthTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      )

      const taskCount = thisMonthTasks.total;
      const taskDifference = taskCount - lastMonthTasks.total;
      
      const thisMonthAssignedTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.equal("assigneeId", member.$id),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      )

      const lastMonthAssignedTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.equal("assigneeId", member.$id),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      )

      const assignedTaskCount = thisMonthAssignedTasks.total;
      const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTasks.total;

      const thisMonthIncompleteTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      )

      const lastMonthIncompleteTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      )

      const incompleteTaskCount = thisMonthIncompleteTasks.total;
      const incompleteTaskDifference = incompleteTaskCount - lastMonthIncompleteTasks.total;

      const thisMonthCompletedTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.equal("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      )

      const lastMonthCompletedTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.equal("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      )

      const completedTaskCount = thisMonthCompletedTasks.total;
      const completedTaskDifference = completedTaskCount-lastMonthCompletedTasks.total;

      const thisMonthOverdueTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.lessThan("dueDate", now.toISOString()),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      )

      const lastMonthOverdueTasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("projectId", projectId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.lessThan("dueDate", now.toISOString()),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      )

      const overdueTasksCount = thisMonthOverdueTasks.total;
      const overdueTasksDifference = overdueTasksCount-lastMonthOverdueTasks.total;
      
      return c.json({
        data: {
          taskCount,
          taskDifference,
          assignedTaskCount,
          assignedTaskDifference,
          completedTaskCount,
          completedTaskDifference,
          incompleteTaskCount,
          incompleteTaskDifference,
          overdueTasksCount,
          overdueTasksDifference
        }
      })
    }
  )

export default app;
