import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetMembersProps {
  workspaceId: string;
}

export const useGetMembers = ({
  workspaceId
}: UseGetMembersProps) => {
  const query = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const response = await client.api.members.$get({query:{workspaceId}});
      // get请求的参数是query！！！

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      const { data } = await response.json(); // 已登录

      return data;
    },
  });

  return query;
};
