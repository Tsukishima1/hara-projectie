import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";

import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.workspaces[":workspaceId"]["reset-invite-code"])["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.workspaces[":workspaceId"]["reset-invite-code"])["$post"]>;

export const useResetInviteCode = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.workspaces[":workspaceId"]["reset-invite-code"]["$post"]({ param });

      if(!response.ok) {
        throw new Error("Failed to reset invite code!");
      }
      
      return await response.json();
    },
    onSuccess: ({data}) => {
      toast.success("Inviter code reset successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces", data.$id] });
      // 让页面刷新，重新获取数据
    },
    onError: (error) => {
      toast.error("Failed to reset invite code!");
      console.error(error);
    }
  });

  return mutation;
};

