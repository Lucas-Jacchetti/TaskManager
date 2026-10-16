import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
    Unique,
} from 'typeorm';
import { Task } from './task.entity';
import { TaskCompletion } from './task-completion.entity';

@Entity('task_occurrences')
@Unique(['taskId', 'referenceDate'])
export class TaskOccurrence {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    taskId: string;

    @ManyToOne(() => Task, (task) => task.occurrences, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'taskId' })
    task: Relation<Task>;

    @Column({ type: 'date' })
    referenceDate: string;

    @OneToMany(() => TaskCompletion,(completion) => completion.occurrence,)
    completions: Relation<TaskCompletion[]>;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date | null;
}
