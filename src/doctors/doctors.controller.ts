import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Types } from 'mongoose';
import { AuthGuard } from 'src/auth/auth.guard';
import { AwsElasticCashService } from 'src/aws-elastic-cash/aws-elastic-cash.service';

// @UseGuards(AuthGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,

    private readonly awsElasticCacheService: AwsElasticCashService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return await this.doctorsService.create(createDoctorDto);
  }

  @Get()
  async findAll() {
    return await this.doctorsService.findAll();
  }

  @Get('/:_doctor_id')
  async findOne(@Param('_doctor_id') _doctor_id: Types.ObjectId) {
    return await this.doctorsService.findOne(_doctor_id);
  }

  @Get('/check-connection/ok')
  async checkConnection() {
    try {
      console.log(`Checking connection to AWS ElastiCache`);
      return await this.awsElasticCacheService.checkConnection();
    } catch (error) {
      return { error: error.message };
    }
  }

  @Patch('/:_doctor_id')
  async update(
    @Param('_doctor_id') _doctor_id: Types.ObjectId,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return await this.doctorsService.update(_doctor_id, updateDoctorDto);
  }

  @Delete('/:_doctor_id')
  async remove(@Param('_doctor_id') _doctor_id: Types.ObjectId) {
    return await this.doctorsService.remove(_doctor_id);
  }
}
