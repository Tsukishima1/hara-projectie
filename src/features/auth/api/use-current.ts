import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export const useCurrent=()=> {
    const query = useQuery({
        queryKey: ["current"],
        queryFn: async () => {
            const response = await client.api.auth.current.$get();
            if(!response.ok) {
                return null; // 未登录
            }
            const { data } = await response.json(); // 已登录
            return data;
        },
    })

    return query;
}