import { Controller } from '@nestjs/common';
import { VoyagerService } from './voyager.service';

@Controller('voyager')
export class VoyagerController {
  constructor(private readonly voyagerService: VoyagerService) {}
}
