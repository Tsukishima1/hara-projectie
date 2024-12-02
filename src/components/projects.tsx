"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { RiAddCircleFill } from "react-icons/ri";
import { cn } from "@/lib/utils";

const Projects = () => {
  // const projectId = null; // TODO: useProjectId()
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();
  const { data: projects } = useGetProjects({ workspaceId });
  const { open } = useCreateProjectModal();

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-neutral-500">Projects</p>
        <RiAddCircleFill
          onClick={open}
          className="size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition"
        />
      </div>
      {projects?.documents.map((project) => {
        const href = `/workspace/${workspaceId}/project/${project.$id}`;
        const isActive = pathname === href;

        return (
          <Link href={href} key={project.$id}>
            <div
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-lg hover:opacity-75 transition cursor-pointer text-neutral-500",
                isActive && "bg-white shadow-sm hover:opacity-100 text-primary"
              )}
            >
              <ProjectAvatar image={project.imageUrl} name={project.name}/>
              <span className="truncate">{project.name}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default Projects;
