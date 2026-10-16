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
import { TaskCompletion } from './task-completion.entity';

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

    // nulo nas tarefas semanais
    @Column('int', { array: true, nullable: true })
    daysOfWeek?: number[];

    @Index()
    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: Relation<User>;

    @OneToMany(() => TaskCompletion, (completion) => completion.task)
    completions: Relation<TaskCompletion[]>;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}