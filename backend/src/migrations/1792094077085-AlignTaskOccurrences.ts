import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignTaskOccurrences1792094077085 implements MigrationInterface {
  name = 'AlignTaskOccurrences1792094077085';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_recurrence_enum" AS ENUM('ONCE', 'RECURRING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD "recurrence" "public"."tasks_recurrence_enum" NOT NULL DEFAULT 'ONCE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD "startDate" date NOT NULL DEFAULT CURRENT_DATE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "startDate" DROP DEFAULT`,
    );
    await queryRunner.query(`
      CREATE TABLE "task_occurrences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "referenceDate" date NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "UQ_task_occurrences_task_date" UNIQUE ("taskId", "referenceDate"),
        CONSTRAINT "PK_task_occurrences" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_task_occurrences_taskId" ON "task_occurrences" ("taskId")`,
    );
    await queryRunner.query(`
      INSERT INTO "task_occurrences" ("taskId", "referenceDate")
      SELECT "taskId", "referenceDate" FROM "task_completions"
      ON CONFLICT ("taskId", "referenceDate") DO NOTHING
    `);
    await queryRunner.query(
      `ALTER TABLE "task_completions" DROP CONSTRAINT "FK_a979ec83a30f605167ad4a42a51"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" DROP CONSTRAINT "UQ_b29f72d2fbaf4619c4cc55ee06b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" ADD "occurrenceId" uuid`,
    );
    await queryRunner.query(`
      UPDATE "task_completions" completion
      SET "occurrenceId" = occurrence."id"
      FROM "task_occurrences" occurrence
      WHERE occurrence."taskId" = completion."taskId"
        AND occurrence."referenceDate" = completion."referenceDate"
    `);
    await queryRunner.query(
      `ALTER TABLE "task_completions" ALTER COLUMN "occurrenceId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" DROP COLUMN "taskId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" DROP COLUMN "referenceDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" ADD CONSTRAINT "UQ_task_completions_occurrence" UNIQUE ("occurrenceId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "task_occurrences"
      ADD CONSTRAINT "FK_task_occurrences_task"
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "task_completions"
      ADD CONSTRAINT "FK_task_completions_occurrence"
      FOREIGN KEY ("occurrenceId") REFERENCES "task_occurrences"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_completions" DROP CONSTRAINT "FK_task_completions_occurrence"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" DROP CONSTRAINT "UQ_task_completions_occurrence"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_occurrences" DROP CONSTRAINT "FK_task_occurrences_task"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" ADD "taskId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" ADD "referenceDate" date`,
    );
    await queryRunner.query(`
      UPDATE "task_completions" completion
      SET "taskId" = occurrence."taskId",
          "referenceDate" = occurrence."referenceDate"
      FROM "task_occurrences" occurrence
      WHERE occurrence."id" = completion."occurrenceId"
    `);
    await queryRunner.query(
      `ALTER TABLE "task_completions" DROP COLUMN "occurrenceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" ADD CONSTRAINT "UQ_b29f72d2fbaf4619c4cc55ee06b" UNIQUE ("taskId", "referenceDate")`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_completions" ADD CONSTRAINT "FK_a979ec83a30f605167ad4a42a51" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_task_occurrences_taskId"`);
    await queryRunner.query(`DROP TABLE "task_occurrences"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "recurrence"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "startDate"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_recurrence_enum"`);
  }
}
