import { AnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { AnalyticsCard } from "./analytics-card";
import { DottedSeparator } from "./dotted-seperator";

export const Analytics = ({ data }: AnalyticsResponseType) => {
  if (!data) return null;

  return (
    <ScrollArea className="border rounded-lg w-full whitespace-nowrap shrink-0">
      <div className="w-full flex flex-row">
        <div className="flex items-center flex-1">
          <AnalyticsCard 
            title="Total tasks"
            value={data.taskCount}
            variant={data.taskDifference > 0 ? "up" : "down"}
            increaseValue={data.taskDifference}
          />
          <DottedSeparator direction="vertical"/>
        </div>
        <div className="flex items-center flex-1">
          <AnalyticsCard 
            title="Assigned Tasks"
            value={data.assignedTaskCount}
            variant={data.assignedTaskDifference > 0 ? "up" : "down"}
            increaseValue={data.assignedTaskDifference}
          />
          <DottedSeparator direction="vertical"/>
        </div>
        <div className="flex items-center flex-1">
          <AnalyticsCard 
            title="Completed tasks"
            value={data.completedTaskCount}
            variant={data.completedTaskDifference > 0 ? "up" : "down"}
            increaseValue={data.completedTaskDifference}
          />
          <DottedSeparator direction="vertical"/>
        </div>
        <div className="flex items-center flex-1">
          <AnalyticsCard 
            title="Overdue tasks"
            value={data.overdueTasksCount}
            variant={data.overdueTasksDifference > 0 ? "up" : "down"}
            increaseValue={data.overdueTasksDifference}
          />
          <DottedSeparator direction="vertical"/>
        </div>
      </div>
      <ScrollBar orientation="horizontal"/>
    </ScrollArea>
  )
};
