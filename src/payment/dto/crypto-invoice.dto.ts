import { ApiProperty } from "@nestjs/swagger";

export class CryptoInvoiceDto {
  @ApiProperty()
  status: string;
  
  @ApiProperty()
  result: {};
}
