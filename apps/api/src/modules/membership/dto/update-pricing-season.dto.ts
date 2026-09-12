import { PartialType } from '@nestjs/swagger';
import { CreatePricingSeasonDto } from './create-pricing-season.dto';

export class UpdatePricingSeasonDto extends PartialType(CreatePricingSeasonDto) {}
