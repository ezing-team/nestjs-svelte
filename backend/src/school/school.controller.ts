import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { School } from './school.entity';
import { SchoolService } from './school.service';

@Controller('school')
export class SchoolController {
    constructor(private schoolService: SchoolService) { }

    @Get("findAll")
    index(): Promise<School[]> {
        return this.schoolService.findAll();
    }

    @Get("findById/:id")
    getSchoolById(@Param('id') id): Promise<School> {
        return this.schoolService.findById(id);
    }

    @Post('create')
    async create(@Body() schoolData: School): Promise<any> {
        schoolData.id = uuidv4();
        return this.schoolService.create(schoolData);
    }

    @Put('update/:id')
    async update(@Param('id') id, @Body() schoolData: School): Promise<any> {
        schoolData.id = id;
        return this.schoolService.update(schoolData);
    }

    @Delete('delete/:id')
    async delete(@Param('id') id): Promise<any> {
        return this.schoolService.delete(id);
    }
}
