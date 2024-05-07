import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FreespinService } from './freespin.service';
import { CreateFreespinDto } from './dto/create-freespin.dto';
import { UpdateFreespinDto } from './dto/update-freespin.dto';

@Controller('freespin')
export class FreespinController {
  constructor(private readonly freespinService: FreespinService) {}

  @Post()
  create(@Body() createFreespinDto: CreateFreespinDto) {
    return this.freespinService.create(createFreespinDto);
  }

  @Get()
  findAll() {
    return this.freespinService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.freespinService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFreespinDto: UpdateFreespinDto) {
    return this.freespinService.update(id, updateFreespinDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.freespinService.remove(id);
  }
}
