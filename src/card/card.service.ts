import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';

@Injectable()
export class CardService {

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>
  ) { }

  create(createCardDto: CreateCardDto) {
    return this.cardRepository.save(createCardDto)
  }

  async deactivate(id: string) {
    const card = await this.cardRepository.findOne({ where: { id } })
    card.isActive = false
    return this.cardRepository.save(card)
  }

  findAll() {
    return this.cardRepository.find();
  }

  async remove(id: number) {
    const result = await this.cardRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Card with ID ${id} not found`);
    }
    return { message: `Card with ID ${id} successfully removed`, id: id };
  }
}
