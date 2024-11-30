import { Query, type Databases } from "node-appwrite";

import { DATABASE_ID, MEMBERS_ID } from "@/config";

interface GetMemberProps {
  databases: Databases;
  workspaceId: string;
  userId: string;
}

// 用于获取成员信息，根据 workspaceId 和 userId 查询
export const getMember = async ({
  databases,
  workspaceId,
  userId,
}: GetMemberProps) => {
  const members = await databases.listDocuments(
    DATABASE_ID,
    MEMBERS_ID, 
    [
      Query.equal("workspaceId", workspaceId),
      Query.equal("userId", userId),
    ]
  );

  return members.documents[0];
};
