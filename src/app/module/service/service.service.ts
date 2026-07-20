import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceDocument } from './entities/service.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    serviceProviderId: string,
  ) {
    return this.serviceModel.create({
      ...createServiceDto,
      serviceProviderId,
    });
  }

  async findAll() {
    return this.serviceModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const result = await this.serviceModel.findById(id);

    if (!result) {
      throw new HttpException('Service not found', 404);
    }

    return result;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    serviceProviderId: string,
  ) {
    const result = await this.serviceModel.findOneAndUpdate(
      { _id: id, serviceProviderId },
      updateServiceDto,
      { new: true },
    );

    if (!result) {
      throw new HttpException('Service not found or access denied', 404);
    }

    return result;
  }

  async remove(id: string, serviceProviderId: string) {
    const result = await this.serviceModel.findOneAndDelete({
      _id: id,
      serviceProviderId,
    });

    if (!result) {
      throw new HttpException('Service not found or access denied', 404);
    }

    return result;
  }

  async getByProviderId(serviceProviderId: string) {
    return this.serviceModel.find({ serviceProviderId }).sort({ createdAt: -1 });
  }
}
