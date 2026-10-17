import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOccurrencesAndRecurrence1792244076359 implements MigrationInterface {
    name = 'CreateOccurrencesAndRecurrence1792244076359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_completions" DROP CONSTRAINT "FK_a979ec83a30f605167ad4a42a51"`);
        await queryRunner.query(`ALTER TABLE "task_completions" DROP CONSTRAINT "UQ_b29f72d2fbaf4619c4cc55ee06b"`);
        await queryRunner.query(`CREATE TABLE "task_occurrences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "referenceDate" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_70df69356ffa626cddf1ffbc5ed" UNIQUE ("taskId", "referenceDate"), CONSTRAINT "PK_0d7e9cf2e3f32f0cfe8f6f788d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3ad6e2faf11a085551e217dbbc" ON "task_occurrences"  ("taskId") `);
        await queryRunner.query(`ALTER TABLE "task_completions" DROP COLUMN "taskId"`);
        await queryRunner.query(`ALTER TABLE "task_completions" DROP COLUMN "referenceDate"`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_recurrence_enum" AS ENUM('ONCE', 'RECURRING')`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "recurrence" "public"."tasks_recurrence_enum" NOT NULL DEFAULT 'ONCE'`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "startDate" date NOT NULL DEFAULT ('now'::text)::date`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD "occurrenceId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD CONSTRAINT "UQ_d92b4fe53b39315adf2163d8e1c" UNIQUE ("occurrenceId")`);
        await queryRunner.query(`ALTER TABLE "task_occurrences" ADD CONSTRAINT "FK_3ad6e2faf11a085551e217dbbce" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD CONSTRAINT "FK_d92b4fe53b39315adf2163d8e1c" FOREIGN KEY ("occurrenceId") REFERENCES "task_occurrences"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_completions" DROP CONSTRAINT "FK_d92b4fe53b39315adf2163d8e1c"`);
        await queryRunner.query(`ALTER TABLE "task_occurrences" DROP CONSTRAINT "FK_3ad6e2faf11a085551e217dbbce"`);
        await queryRunner.query(`ALTER TABLE "task_completions" DROP CONSTRAINT "UQ_d92b4fe53b39315adf2163d8e1c"`);
        await queryRunner.query(`ALTER TABLE "task_completions" DROP COLUMN "occurrenceId"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "startDate"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "recurrence"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_recurrence_enum"`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD "referenceDate" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD "taskId" uuid NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ad6e2faf11a085551e217dbbc"`);
        await queryRunner.query(`DROP TABLE "task_occurrences"`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD CONSTRAINT "UQ_b29f72d2fbaf4619c4cc55ee06b" UNIQUE ("taskId", "referenceDate")`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD CONSTRAINT "FK_a979ec83a30f605167ad4a42a51" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
