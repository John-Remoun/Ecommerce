import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RoleEnum } from 'src/common/enum/user.enums';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller({ path: 'brand', version: '1' })
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.brandService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
