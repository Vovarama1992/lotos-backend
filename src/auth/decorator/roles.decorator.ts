import { Reflector } from "@nestjs/core";
import { UserRole } from "src/constants";

export const Roles = Reflector.createDecorator<UserRole[]>();
