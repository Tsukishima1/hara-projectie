"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { EditWorkspaceForm } from "@/features/workspaces/components/edit-workspace-form"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"

export const WorkspaceIdSettingClient = () => {
  const workspaceId = useWorkspaceId();
  const {data, isLoading} = useGetWorkspace({workspaceId});

  if(isLoading) return <PageLoader />;

  if(!data) return <PageError message="Workspace not found"/>

  return (
    <div className="w-full lg:max-w-xl">
      <EditWorkspaceForm initialValues={data}/>
    </div>
  )
}