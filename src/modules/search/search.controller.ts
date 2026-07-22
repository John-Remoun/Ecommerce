import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { SanitizeMongoPipe } from 'src/common/pipe/sanitize-mongo.pipe';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UsePipes(new SanitizeMongoPipe())
  async search(@Query() query: SearchQueryDto) {
    const result = await this.searchService.search(query);
    return { message: 'Search results retrieved', data: result };
  }
}
