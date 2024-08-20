import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Model, Types } from 'mongoose';
import { Patient } from './entities/patient.entity';
import { InjectModel } from '@nestjs/mongoose';
import { DoctorsService } from 'src/doctors/doctors.service';
import { AuthHelper } from 'src/auth/utils/auth-helper';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,

    @Inject(forwardRef(() => DoctorsService))
    private readonly doctorService: DoctorsService,

    @Inject(forwardRef(() => AuthHelper))
    private readonly authHelper: AuthHelper,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    try {
      /** Find Doctor */
      const _doctor_id = new Types.ObjectId(createPatientDto._doctor_id);

      await this.doctorService.findOne(_doctor_id);

      /** If Doctor Exist then Create Patient */
      let create = new this.patientModel({ ...createPatientDto, _doctor_id });

      create.password = await this.authHelper.hash_password(create?.password);

      return await create.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `A Patient with this email already exists!!`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    try {
      const found = await this.patientModel.find().lean().exec();

      if (!found.length) {
        throw new NotFoundException(`Patient(s) not found!!`);
      }

      return found;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: Types.ObjectId) {
    try {
      const found = await this.patientModel.findById(id);

      if (!found) {
        throw new NotFoundException(`Patient doesn't Exist!!`);
      }
      return found;
    } catch (error) {
      throw error;
    }
  }

  async update(
    _patient_id: Types.ObjectId,
    updatePatientDto: UpdatePatientDto,
  ) {
    try {
      await this.findOne(_patient_id);

      const updated = await this.patientModel.findByIdAndUpdate(
        _patient_id,
        updatePatientDto,
      );

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async remove(_patient_id: Types.ObjectId) {
    try {
      await this.findOne(_patient_id);
      await this.patientModel.findByIdAndDelete(_patient_id);
      return `Doctor Deleted Successfully!!`;
    } catch (error) {
      throw error;
    }
  }

  async find_patient_by_email(email: string) {
    try {
      const found = await this.patientModel.findOne({ email });

      return found;
      return found;
    } catch (error) {
      throw error;
    }
  }

  async remove_token(_patient_id: Types.ObjectId) {
    try {
      await this.patientModel.findByIdAndUpdate(
        _patient_id,
        { $set: { token: '' } },
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  }

  async setOnline(_patient_id: Types.ObjectId, token: string) {
    try {
      await this.patientModel.findByIdAndUpdate(_patient_id, {
        $set: { isOnline: true },
      });
    } catch (error) {
      throw error;
    }
  }

  async setOffline(_patient_id: Types.ObjectId) {
    try {
      await this.patientModel.findByIdAndUpdate(_patient_id, {
        $set: { isOnline: false },
      });
    } catch (error) {
      throw error;
    }
  }
}
