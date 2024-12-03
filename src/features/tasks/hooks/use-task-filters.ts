import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

import { TaskStatus } from "../types";

// useQueryStates 用于接收一个对象，该对象包含了所有的任务筛选器即查询参数，将他们转换为React状态，以便在组件中使用
export const useTaskFilters = () => {
  return useQueryStates({
    projectId: parseAsString,
    status: parseAsStringEnum(Object.values(TaskStatus)),
    search: parseAsString,
    assigneeId: parseAsString,
    dueDate: parseAsString,
  })
}