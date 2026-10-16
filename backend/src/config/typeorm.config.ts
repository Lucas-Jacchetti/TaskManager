import { DataSourceOptions } from 'typeorm';
import { TaskCompletion } from '../features/tasks/task-completion.entity';
import { Task } from '../features/tasks/task.entity';
import { User } from '../features/users/user.entity';
import { TaskOccurrence } from '../features/tasks/task-ocurrence.entity';

export const buildTypeOrmOptions = (databaseUrl: string): DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl,
  entities: [User, Task, TaskOccurrence, TaskCompletion],
  synchronize: false,
});