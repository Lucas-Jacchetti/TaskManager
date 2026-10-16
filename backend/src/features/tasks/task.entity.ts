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
} from 'typeorm';
import { TaskType } from './task-type.enum';
import { User } from '../users/user.entity';
import { TaskRecurrence } from './task-recurrence.enum';
import { TaskOccurrence } from './task-ocurrence.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: TaskType })
    type: TaskType;

    @Column({type: 'enum', enum: TaskRecurrence, default: TaskRecurrence.ONCE})
    recurrence: TaskRecurrence;

    @Column('int', { array: true, nullable: true })
    daysOfWeek?: number[] | null;

    @Index()
    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: Relation<User>;

    @OneToMany(() => TaskOccurrence, (occurrence) => occurrence.task,)
    occurrences: Relation<TaskOccurrence[]>;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}