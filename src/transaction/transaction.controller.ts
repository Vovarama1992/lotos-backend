import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { Transaction } from "./entities/transaction.entity";

@Controller("transaction")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

}
