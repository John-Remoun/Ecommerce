import { User } from 'src/model';
import { IUser } from '../interface';
import { DatabaseRepository } from './base.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository extends DatabaseRepository<IUser> {
  constructor(
    @InjectModel(User.name)
    protected readonly model: Model<IUser>,
  ) {
    super(model);
  }
}
