import { Module } from "@nestjs/common";
import { VoyagerService } from "./voyager.service";
import { VoyagerController } from "./voyager.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Voyager } from "./entities/voyager.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Voyager])],
  controllers: [VoyagerController],
  providers: [VoyagerService],
  exports: [VoyagerService]
})
export class VoyagerModule {}
