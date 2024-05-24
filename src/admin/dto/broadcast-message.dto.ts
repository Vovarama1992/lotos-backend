import { IsNotEmpty, IsString } from "class-validator";

export class BroadcastMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
