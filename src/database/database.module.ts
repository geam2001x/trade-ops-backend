import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('database.host', '127.0.0.1'),
        port: configService.get<number>('database.port', 3306),
        username: configService.get<string>('database.username', 'root'),
        password: configService.get<string>('database.password', 'root_password'),
        database: configService.get<string>(
          'database.database',
          'trade_operations_suite',
        ),
        synchronize: configService.get<boolean>('database.synchronize', false),
        logging: configService.get<boolean>('database.logging', false),
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
