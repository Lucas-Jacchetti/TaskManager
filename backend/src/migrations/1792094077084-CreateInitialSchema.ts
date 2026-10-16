import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1792094077084 implements MigrationInterface {
    name = 'CreateInitialSchema1792094077084'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_type_enum" AS ENUM('daily', 'weekly', 'custom')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "type" "public"."tasks_type_enum" NOT NULL, "daysOfWeek" integer array, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_166bd96559cb38595d392f75a3" ON "tasks"  ("userId") `);
        await queryRunner.query(`CREATE TABLE "task_completions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "referenceDate" date NOT NULL, CONSTRAINT "UQ_b29f72d2fbaf4619c4cc55ee06b" UNIQUE ("taskId", "referenceDate"), CONSTRAINT "PK_c9c25215a82514668ab1d72a04d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_completions" ADD CONSTRAINT "FK_a979ec83a30f605167ad4a42a51" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_completions" DROP CONSTRAINT "FK_a979ec83a30f605167ad4a42a51"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"`);
        await queryRunner.query(`DROP TABLE "task_completions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_166bd96559cb38595d392f75a3"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
