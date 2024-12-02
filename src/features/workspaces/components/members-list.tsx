"use client";

import { Fragment } from "react"; // 用于包裹多个元素
import Link from "next/link";
import { useWorkspaceId } from "../hooks/use-workspace-id";
import { MemberRole } from "@/features/members/types";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MembersAvatar } from "@/features/members/components/members-avatar";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useUpdateMember } from "@/features/members/api/use-update-member";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, LoaderIcon, MoreVerticalIcon } from "lucide-react";
import { DottedSeparator } from "@/components/dotted-seperator";

export const MemberList = () => {
  const workspaceId = useWorkspaceId();
  const [ConfirmDialog, confirm] = useConfirm(
    "Remove member",
    "This member will be removed from the workspace",
    "destructive"
  );
  const { data, isPending:isGettingMembers } = useGetMembers({ workspaceId });

  const { mutate:deleteMember, isPending:isDeletingMember } = useDeleteMember();
  const { mutate:updateMember, isPending:isUpdatingMember } = useUpdateMember();

  const handleUpdateMember = (memberId:string, role:MemberRole) => {
    updateMember({
      json: {role},
      param: {memberId},
    })
  }

  const handleDeleteMember = async (memberId:string) => {
    const ok = await confirm();
    if(!ok) return;

    deleteMember({param: {memberId}},{
      onSuccess: () => {
        window.location.reload();
      }
    });
  }

  return (
    <Card className="w-full h-full border-none shadow-none">
      <ConfirmDialog />
      <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/workspaces/${workspaceId}`}>
            <ArrowLeftIcon className="size-4" />
            Back
          </Link>
        </Button>
        <CardTitle className="text-xl font-bold">Members list</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        {
          isGettingMembers && <LoaderIcon className="size-8 animate-spin m-auto py-4" />
        }
        {data?.documents.map((member, index) => (
          <Fragment key={member.$id}>
            <div className="flex items-center gap-2 py-2">
              <MembersAvatar
                className="size-10"
                fallbackClassName="text-lg"
                name={member.name}
              />
              <div className="flex flex-col">
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="ml-auto" variant="secondary" size="icon" disabled={isDeletingMember||isUpdatingMember}>
                    {
                      isDeletingMember||isUpdatingMember ? <LoaderIcon className="size-4 animate-spin" /> 
                      : <MoreVerticalIcon className="size-4 text-muted-foreground" />
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem
                    className="font-medium"
                    onClick={() => handleUpdateMember(member.$id, MemberRole.ADMIN)}
                    disabled={false}
                  >
                    Set as Administrator
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="font-medium"
                    onClick={() => handleUpdateMember(member.$id, MemberRole.MEMBER)}
                    disabled={false}
                  >
                    Set as Member
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="font-medium text-red-700"
                    onClick={() => handleDeleteMember(member.$id)}
                    disabled={false}
                  >
                    Remove {member.name}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {index < data.documents.length - 1 && (
              <Separator className="my-2.5" />
            )}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
};
