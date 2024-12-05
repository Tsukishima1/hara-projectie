import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface GetWorkspaceProps {
  workspaceId: string;
}

export const useGetWorkspace = ({
  workspaceId,
}: GetWorkspaceProps) => {
  const query = useQuery({
    queryKey: ["workspace"],
    queryFn: async () => {
      const response = await client.api.workspaces[":workspaceId"].$get({param: {workspaceId}});

      if (!response.ok) {
        throw new Error("Failed to fetch workspace");
      }

      const { data } = await response.json(); // 已登录

      return data;
    },
  });

  return query;
};
