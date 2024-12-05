import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetProjectProps {
  projectId: string;
}

export const useGetProject = ({
  projectId
}: UseGetProjectProps) => {
  const query = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await client.api.projects[":projectId"].$get({param: {projectId}});

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const { data } = await response.json(); // 已登录

      return data;
    },
  });

  return query;
};
