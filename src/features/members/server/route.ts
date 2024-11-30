import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { getMember } from "../utils";
import { DATABASE_ID, MEMBERS_ID } from "@/config";
import { Query } from "node-appwrite";
import { MemberRole } from "../types";

const app = new Hono()
  // 获取当前用户的所有工作区
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId } = c.req.valid("query");

      // 获取在当前工作区的成员信息
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json(
          {
            error: "Unauthorized",
          },
          401
        );
      }

      const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", workspaceId), // 查询当前工作区的成员, 以 workspaceId 为条件
      ]);

      const populatedMembers = await Promise.all(
        // 为什么要用 Promise.all()？ 因为要等待所有的用户信息都获取到后，再返回给前端
        members.documents.map(async (member) => {
          const user = await users.get(member.userId);
          return {
            ...member,
            name: user.name,
            email: user.email,
          };
        })
      );

      return c.json({
        // 返回当前工作区的所有成员信息，包括用户的 name 和 email
        data: {
          ...members,
          documents: populatedMembers, // 将用户的 name 和 email 信息添加到 documents 中，返回给前端
        },
      });
    }
  )
  // 删除成员
  .delete("/:memberId", sessionMiddleware, async (c) => {
    const { memberId } = c.req.param();
    const user = c.get("user");
    const databases = c.get("databases");

    // 获取要删除的成员信息
    const memberToDelete = await databases.getDocument(
      DATABASE_ID,
      MEMBERS_ID,
      memberId
    );

    // 获取要删除的成员的目前工作区的所有成员信息 （？
    const allMembersInWorkspace = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      [Query.equal("workspaceId", memberToDelete.workspaceId)]
    );

    const member = await getMember({
      databases,
      workspaceId: memberToDelete.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401
      );
    }

    if (member.id !== memberToDelete.$id && member.role !== MemberRole.ADMIN) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401
      );
    }

    if (allMembersInWorkspace.total === 1) {
      return c.json({
        error: "Cannot remove the last member",
      });
    }

    // 删除成员
    await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, memberId);

    return c.json({
      data: { $id: memberToDelete.$id },
    });
  })
  // 更新成员信息
  .patch(
    "/:memberId",
    sessionMiddleware,
    zValidator("json", z.object({ role: z.nativeEnum(MemberRole) })), // 接收 role 参数
    async (c) => {
      const { memberId } = c.req.param();
      const { role } = c.req.valid("json");
      const user = c.get("user");
      const databases = c.get("databases");

      // 获取要修改的成员信息
      const memberToUpdate = await databases.getDocument(
        DATABASE_ID,
        MEMBERS_ID,
        memberId
      );

      // 获取要修改的成员的目前工作区的所有成员信息 （？
      const allMembersInWorkspace = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [Query.equal("workspaceId", memberToUpdate.workspaceId)]
      );

      const member = await getMember({
        databases,
        workspaceId: memberToUpdate.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json(
          {
            error: "Unauthorized",
          },
          401
        );
      }

      if (member.role !== MemberRole.ADMIN) {
        return c.json(
          {
            error: "Unauthorized",
          },
          401
        );
      }

      if (allMembersInWorkspace.total === 1) {
        return c.json({
          error: "Cannot remove the downgrade member",
        });
      }

      // 删除成员
      await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {role});

      return c.json({
        data: { $id: memberToUpdate.$id }, // 返回修改后的成员信息
      });
    }
  );

export default app;
