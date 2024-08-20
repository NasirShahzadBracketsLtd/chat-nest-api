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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Types } from 'mongoose';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientService: PatientsService) {}

  @Post('/')
  @UsePipes(new ValidationPipe())
  async create(@Body() createDoctorDto: CreatePatientDto) {
    return await this.patientService.create(createDoctorDto);
  }

  @Get('/')
  async findAll() {
    return await this.patientService.findAll();
  }

  @Get('/:_patient_id')
  async findOne(@Param('_patient_id') _patient_id: Types.ObjectId) {
    return await this.patientService.findOne(_patient_id);
  }

  @Patch('/:_patient_id')
  async update(
    @Param('_patient_id') _patient_id: Types.ObjectId,
    @Body() updateDoctorDto: UpdatePatientDto,
  ) {
    return await this.patientService.update(_patient_id, updateDoctorDto);
  }

  @Delete('/:_patient_id')
  async remove(@Param('_patient_id') _patient_id: Types.ObjectId) {
    return await this.patientService.remove(_patient_id);
  }
}
