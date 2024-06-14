import { ApiProperty } from "@nestjs/swagger";

export class GetTelegramAuthDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  first_name: string;
  @ApiProperty()
  last_name: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  photo_url: string;
  @ApiProperty()
  auth_date: number;
  @ApiProperty()
  hash: string;
}
