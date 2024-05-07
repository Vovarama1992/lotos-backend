export class RegisterUserDto {
  email?: string;
  phone?: string;
  password: string;
  referral_id?: number;
}


export class CheckUserRegister {
  email?: string;
  phone?: string;
}