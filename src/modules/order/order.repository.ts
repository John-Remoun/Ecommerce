import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from 'src/common/repository';
import { Order } from 'src/model/order.model';

@Injectable()
export class OrderRepository extends DatabaseRepository<Order> {
  constructor(
    @InjectModel(Order.name)
    protected readonly model: Model<Order>,
  ) {
    super(model);
  }
}
