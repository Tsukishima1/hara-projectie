import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";

import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.projects[":projectId"])["$delete"], 200>;
type RequestType = InferRequestType<(typeof client.api.projects[":projectId"])["$delete"]>;

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.projects[":projectId"]["$delete"]({ param });

      if(!response.ok) {
        throw new Error("Failed to delete project!");
      }
      
      return await response.json();
    },
    onSuccess: ({data}) => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.$id] });
      // 让页面刷新，重新获取数据
    },
    onError: (error) => {
      toast.error("Failed to delete project!");
      console.error(error);
    }
  });

  return mutation;
};