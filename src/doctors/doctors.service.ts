import { AuthHelper } from './../auth/utils/auth-helper';
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Doctor } from './entities/doctor.entity';
import { Model, Types } from 'mongoose';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,

    @Inject(forwardRef(() => AuthHelper))
    private readonly authHelper: AuthHelper,
  ) {}

  async create(createDoctorDto: CreateDoctorDto) {
    try {
      let create = new this.doctorModel(createDoctorDto);

      create.password = await this.authHelper.hash_password(create?.password);

      return await create.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `A Doctor with this email already exists!!`,
        );
      }

      throw error;
    }
  }

  async findAll() {
    try {
      const found = await this.doctorModel.find().lean().exec();

      if (!found.length) {
        throw new NotFoundException(`Doctor(s) not found!!`);
      }

      return found;
    } catch (error) {
      throw error;
    }
  }

  async findOne(_doctor_id: Types.ObjectId) {
    try {
      const found = await this.doctorModel.findById(_doctor_id);

      if (!found) {
        throw new NotFoundException(`Doctor doesn't Exist!!`);
      }
      return found;
    } catch (error) {
      throw error;
    }
  }

  async update(_doctor_id: Types.ObjectId, updateDoctorDto: UpdateDoctorDto) {
    try {
      await this.findOne(_doctor_id);

      const updated = await this.doctorModel.findByIdAndUpdate(
        _doctor_id,
        updateDoctorDto,
      );

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async remove(_doctor_id: Types.ObjectId) {
    try {
      await this.findOne(_doctor_id);
      await this.doctorModel.findByIdAndDelete(_doctor_id);
      return `Doctor Deleted Successfully!!`;
    } catch (error) {
      throw error;
    }
  }

  async find_doctor_by_email(email: string) {
    try {
      const found = await this.doctorModel.findOne({ email });

      return found;
    } catch (error) {
      throw error;
    }
  }

  async remove_token(_doctor_id: Types.ObjectId) {
    try {
      await this.doctorModel.findByIdAndUpdate(
        _doctor_id,
        { $set: { token: '' } },
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  }

  async setOnline(_doctor_id: Types.ObjectId, token: string) {
    try {
      await this.doctorModel.findByIdAndUpdate(_doctor_id, {
        $set: { isOnline: true },
      });
    } catch (error) {
      throw error;
    }
  }

  async setOffline(_doctor_id: Types.ObjectId) {
    try {
      await this.doctorModel.findByIdAndUpdate(_doctor_id, {
        $set: { isOnline: false },
      });
    } catch (error) {
      throw error;
    }
  }
}
