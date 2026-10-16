import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
    Unique,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_completions')
@Unique(['taskId', 'referenceDate'])
export class TaskCompletion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    taskId: string;

    @ManyToOne(() => Task, (task) => task.completions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'taskId' })
    task: Relation<Task>;

    @Column({ type: 'date' })
    referenceDate: string;
}