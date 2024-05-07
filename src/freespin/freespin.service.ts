import { Injectable } from '@nestjs/common';
import { CreateFreespinDto } from './dto/create-freespin.dto';
import { UpdateFreespinDto } from './dto/update-freespin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Freespin } from './entities/freespin.entity';


@Injectable()
export class FreespinService {

  constructor(
    @InjectRepository(Freespin)
    private readonly freespinRepository: Repository<Freespin>
  ) { }

  create(createFreespinDto: CreateFreespinDto) {
    return this.freespinRepository.save(createFreespinDto)
  }

  findAll() {
    return this.freespinRepository.find();
  }

  findOne(gameId: string) {
    return this.freespinRepository.findOne({
      where: { gameId }
    })
  }

  async update(id: string, updateFreespinDto: UpdateFreespinDto) {
    const freespin = await this.freespinRepository.findOneBy({ id });
    if (!freespin) {
      throw new Error(`Freespin with ID ${id} not found`);
    }
    const updated = await this.freespinRepository.save({
      ...freespin, // spread the existing freespin
      ...updateFreespinDto, // spread the dto to overwrite existing properties
    });
    return updated;
  }

  async remove(id: string) {
    const result = await this.freespinRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Freespin with ID ${id} not found`);
    }
    return { message: `Freespin with ID ${id} successfully removed`, id: id };
  }
}
