import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";

import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.workspaces[":workspaceId"]["join"])["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.workspaces[":workspaceId"]["join"])["$post"]>;

export const useJoinWorkspace = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => { 
      // 为什么这里有两个参数？因为这个函数接收两个参数，一个是 param，一个是 json，这两个参数是从组件传递过来的
      const response = await client.api.workspaces[":workspaceId"]["join"]["$post"]({ param, json });

      if(!response.ok) {
        throw new Error("Failed to join workspace!");
      }
      
      return await response.json();
    },
    onSuccess: ({data}) => {
      toast.success("Joined workspace successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] });
      // 让页面刷新，重新获取数据
    },
    onError: (error) => {
      toast.error("Failed to join workspace!");
      console.error(error);
    }
  });

  return mutation;
};

