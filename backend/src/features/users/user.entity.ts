import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
} from 'typeorm';
import { Task } from '../tasks/task.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    password: string;

    @OneToMany(() => Task, (task) => task.user)
    tasks: Relation<Task[]>;

    @CreateDateColumn()
    createdAt: Date;
}