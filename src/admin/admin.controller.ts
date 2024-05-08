import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';

@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("transactions")
  @Roles(["admin", "root"])
  getAllTransactions(@Query() query: any){
    const {status} = query;
    return this.adminService.getTransactions({status: status});
  }


}
