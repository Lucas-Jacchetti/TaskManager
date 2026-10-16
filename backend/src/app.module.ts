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
        for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
          if (!config[key]) {
            throw new Error(`A variável ${key} é obrigatória`);
          }
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