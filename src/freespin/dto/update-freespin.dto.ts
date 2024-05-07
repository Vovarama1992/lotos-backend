import { PartialType } from '@nestjs/swagger';
import { CreateFreespinDto } from './create-freespin.dto';

export class UpdateFreespinDto extends PartialType(CreateFreespinDto) {}
