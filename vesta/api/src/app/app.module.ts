import { Module } from '@nestjs/common';
// import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
// import { AuthGuard } from './auth/auth.guard';
import { UsersModule } from './users/users.module';
import { RoomModule } from './room/room.module';
import { HomesService } from './homes/homes.service';

//uncomment only for production
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    RoomModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HomesService,
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
  ],
})
export class AppModule {}
