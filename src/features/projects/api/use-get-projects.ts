import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetProjectsProps {
  workspaceId: string;
}

export const useGetProjects = ({
  workspaceId
}: UseGetProjectsProps) => {
  const query = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const response = await client.api.projects.$get({query: {workspaceId}});

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const { data } = await response.json(); // 已登录

      return data;
    },
  });

  return query;
};
