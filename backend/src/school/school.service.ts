import { Injectable } from '@nestjs/common';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { School } from './school.entity';

@Injectable()
export class SchoolService {
    constructor(
        @InjectRepository(School)
        private schoolRepository: Repository<School>) { }

    async findAll(): Promise<School[]> {
        return await this.schoolRepository.find();
    }

    async findById(id: string): Promise<School> {
        return await this.schoolRepository.findOne(id);
    }

    async create(school: School): Promise<School> {
        return await this.schoolRepository.save(school);
    }

    async update(school: School): Promise<UpdateResult> {
        return await this.schoolRepository.update(school.id, school);
    }

    async delete(id): Promise<DeleteResult> {
        return await this.schoolRepository.delete(id);
    }
}