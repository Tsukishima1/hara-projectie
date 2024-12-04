import React, { useEffect, useState } from "react";

import { Task, TaskStatus } from "../types";

import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { KanbanColumnHeader } from "./kanban-column-header";
import { KanbanCard } from "./kanban-card";

const boards: TaskStatus[] = [
  // boards 用于存储任务状态的顺序
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

type TasksState = {
  // TasksState 用于存储任务状态，以及对应的任务列表
  [key in TaskStatus]: Task[];
};

interface DataKanbanProps {
  data: Task[];
  onChange: (
    tasks: { $id: string; status: TaskStatus; position: number }[]
  ) => void; // 用于更新任务状态的回调函数
}

export const DataKanban = ({ data, onChange }: DataKanbanProps) => {
  const [tasks, setTasks] = useState<TasksState>(() => {
    // 使用 useState 初始化任务状态
    const initialTasks: TasksState = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    // 将任务按状态分类
    data.forEach((task) => {
      initialTasks[task.status].push(task);
    });

    // 按任务的 position 排序
    Object.keys(initialTasks).forEach((status) => {
      initialTasks[status as TaskStatus].sort(
        (a, b) => a.position - b.position // 如果return false，a在b前面，因为a的position小
      );
    });

    return initialTasks;
  });

  useEffect(() => {
    // 当 data 变化时，更新任务状态，例如，当从服务器获取到新的任务
    const newTasks: TasksState = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    data.forEach((task) => {
      newTasks[task.status].push(task);
    });

    Object.keys(newTasks).forEach((status) => {
      newTasks[status as TaskStatus].sort((a, b) => a.position - b.position);
    });

    setTasks(newTasks);
  }, [data]);

  const onDragEnd = 
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination } = result;
      const sourceStatus = source.droppableId as TaskStatus;
      const destStatus = destination.droppableId as TaskStatus;

      // 如果源位置和目标位置相同，直接返回，不做任何操作
      if (sourceStatus === destStatus && source.index === destination.index) {
        return;
      }

      let updatesPayload: {
        $id: string;
        status: TaskStatus;
        position: number;
      }[] = [];

      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };

        const sourceColumn = [...newTasks[sourceStatus]];
        const [movedTask] = sourceColumn.splice(source.index, 1);

        if (!movedTask) {
          console.error("No task found at the source index");
          return prevTasks;
        }

        const updatedMovedTask =
          sourceStatus !== destStatus
            ? { ...movedTask, status: destStatus }
            : movedTask;

        newTasks[sourceStatus] = sourceColumn;

        const destinationColumn = [...newTasks[destStatus]]; // 拷贝一份，避免直接修改原数组
        destinationColumn.splice(destination.index, 0, updatedMovedTask); // 插入到目标位置，不删除任何元素
        // splice(index, 0, item) 会在 index 位置插入 item，不删除任何元素，第二个参数意为删除的元素个数
        newTasks[destStatus] = destinationColumn; // 更新目标位置的任务列表

        updatesPayload = []; // 用于存储需要更新的任务信息, 用于后续更新数据库

        updatesPayload.push({
          // 更新移动的任务
          $id: updatedMovedTask.$id,
          status: destStatus,
          position: Math.min((destination.index + 1) * 1000, 1000000),
        });

        newTasks[destStatus].forEach((task, index) => {
          // 更新目标位置之后的任务，例如，如果目标位置是第二个，那么第三个及之后的任务的 position 都需要更新
          if (task && task.$id !== updatedMovedTask.$id) {
            // 如果任务存在，且不是移动的任务，那么更新其 position
            const newPosition = Math.min((index + 1) * 1000, 1000000);
            // 为什么index+1？因为index是从0开始的，所以需要+1
            if (task.position !== newPosition) {
              updatesPayload.push({
                $id: task.$id,
                status: destStatus,
                position: newPosition,
              });
            }
          }
        });

        if (sourceStatus !== destStatus) {
          // 如果源状态和目标状态不同，那么需要更新源状态的任务, 例如，如果从 IN_PROGRESS 移动到 TODO，那么需要更新 IN_PROGRESS 的任务
          newTasks[destStatus].forEach((task, index) => {
            if (task) {
              const newPosition = Math.min((index + 1) * 1000, 1000000);
              if (task.position !== newPosition) {
                updatesPayload.push({
                  $id: task.$id,
                  status: destStatus,
                  position: newPosition,
                });
              }
            }
          });
        }

        return newTasks;
      });

      onChange(updatesPayload);
    }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto">
        {boards.map((board) => {
          return (
            <div
              key={board}
              className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[200px]"
            >
              <KanbanColumnHeader
                board={board}
                taskCount={tasks[board].length}
              />
              <Droppable droppableId={board}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[200px] py-1.5"
                  >
                    {tasks[board].map((task, index) => (
                      <Draggable
                        key={task.$id}
                        draggableId={task.$id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <KanbanCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
