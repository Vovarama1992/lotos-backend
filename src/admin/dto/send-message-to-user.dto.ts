import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendMessageToUserDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    user_id: string;

    @IsString()
    @IsNotEmpty()
    message: string;
}