export type TodoItem = {
  id: string;
  group_id: string;
  text: string;
  completed: boolean;
  order: number;
};

export type TodoGroup = {
  id: string;
  name: string;
  color: string;
  order: number;
  items: TodoItem[];
};

export type TodoGroupPatch = Partial<Pick<TodoGroup, 'name' | 'color' | 'order'>>;
export type TodoItemPatch = Partial<Pick<TodoItem, 'text' | 'completed' | 'group_id' | 'order'>>;
export type TodoReorderUpdate = {
  id: string;
  order: number;
  group_id?: string;
};
