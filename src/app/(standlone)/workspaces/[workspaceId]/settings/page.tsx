import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";

import { WorkspaceIdSettingClient } from "./client";

const WorkspaceIdSettingsPage = async () => {
  const user = await getCurrent();
  if(!user) redirect("/sign-in");

  return (
    <WorkspaceIdSettingClient />
  );
};

export default WorkspaceIdSettingsPage;
