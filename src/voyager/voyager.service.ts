import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Voyager } from './entities/voyager.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VoyagerService {
    public constructor(
        @InjectRepository(Voyager)
        private readonly voyagerRepository: Repository<Voyager>
    ){}

    async create(userId: string, amount: number){
        const doesExist = !!(await this.findByUserId(userId));
        if(doesExist) throw new ConflictException("Can't create new voyager amount, it already exists!");
        
        return await this.voyagerRepository.save({
            amount,
            userId
        })
    }

    async findByUserId(userId: string){
        return await this.voyagerRepository.findOneBy({userId});
    }

    async isVoyagerExceeded(userId: string, amount: number){
        const voyager = await this.findByUserId(userId);
        if(!voyager) return true;

        return amount >= voyager.amount;
    }
}
