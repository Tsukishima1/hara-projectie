import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, PROJECTS_ID } from "@/config";
import { Project } from "./types";
import { getMember } from "../members/utils";

interface GetProjectProps {
  projectId: string;
}

// 用于获取工作区具体信息（查看下方<Workspace>的定义）
export const getProject = async ({ projectId }: GetProjectProps) => {
  const { databases, account } = await createSessionClient();

  const user = await account.get();

  const project = await databases.getDocument<Project>(
    DATABASE_ID,
    PROJECTS_ID,
    projectId
  );

  const member = await getMember({
    databases,
    userId: user.$id,
    workspaceId: project.workspaceId,
  });

  if (!member) throw new Error("Unauthorized");

  return project;
};
