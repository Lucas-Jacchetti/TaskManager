import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    type Relation,
} from 'typeorm';
import { TaskOccurrence } from './task-ocurrence.entity';

@Entity('task_completions')
@Unique(['occurrenceId'])
export class TaskCompletion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    occurrenceId: string;

    @ManyToOne(() => TaskOccurrence, (occurrence) => occurrence.completions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'occurrenceId' })
    occurrence: Relation<TaskOccurrence>;
}