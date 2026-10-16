// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { TasksModule } from './features/tasks/task.module';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        if (!config.DATABASE_URL) {
          throw new Error('A variável DATABASE_URL é obrigatória');
        }
        return config;
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildTypeOrmOptions(config.getOrThrow<string>('DATABASE_URL')),
    }),
    TasksModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}