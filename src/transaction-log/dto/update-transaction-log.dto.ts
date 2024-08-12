import { PartialType } from '@nestjs/swagger';
import { CreateTransactionLogDto } from './create-transaction-log.dto';

export class UpdateTransactionLogDto extends PartialType(CreateTransactionLogDto) {}
