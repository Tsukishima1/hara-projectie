import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface useGetWorkspaceInfoProps {
  workspaceId: string;
}

export const useGetWorkspaceInfo = ({
  workspaceId,
}: useGetWorkspaceInfoProps) => {
  const query = useQuery({
    queryKey: ["workspace-info"],
    queryFn: async () => {
      const response = await client.api.workspaces[":workspaceId"]["info"].$get({param: {workspaceId}});

      if (!response.ok) {
        throw new Error("Failed to fetch workspace info");
      }

      const { data } = await response.json(); // 已登录

      return data;
    },
  });

  return query;
};
