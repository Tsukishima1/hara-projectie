import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { EditWorkspaceForm } from "@/features/workspaces/components/edit-workspace-form";
import { getWorkspace } from "@/features/workspaces/queries";

interface WorkspaceIdSettingsPageProps {
  params: {
    workspaceId: string;
  }
}

// 没有使用useParams()，而是直接从props中获取参数
// 因为该组件是一个异步组件，属于服务器端渲染，不是客户端渲染，所以无法使用useParams()。
// 但是可以通过参数props获取参数，因为参数是通过服务器端渲染传递给组件的。

const WorkspaceIdSettingsPage = async ({
  params,
}: WorkspaceIdSettingsPageProps) => {
  const user = await getCurrent();
  if(!user) redirect("/sign-in");

  const initialValues = await getWorkspace({workspaceId: params.workspaceId});

  return (
    <div className="w-full lg:max-w-xl">
      <EditWorkspaceForm initialValues={initialValues}/>
    </div>
  );
};

export default WorkspaceIdSettingsPage;
