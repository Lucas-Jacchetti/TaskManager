import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './task.service';
import { Task } from './task.entity';
import { TaskOccurrence } from './task-ocurrence.entity';
import { TasksController } from './task.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskOccurrence])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}