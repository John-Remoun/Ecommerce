import { Module } from '@nestjs/common';
import { UserModel } from 'src/model/user.model';
import { UserRepository } from 'src/common/repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserModel],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
