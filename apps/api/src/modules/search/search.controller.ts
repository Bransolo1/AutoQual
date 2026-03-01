import { Body, Controller, Post, Query } from "@nestjs/common";
import { SearchService } from "./search.service";
import { IndexInsightInput, SearchInsightsInput } from "./search.dto";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post("index/insight")
  indexInsight(@Body() input: IndexInsightInput) {
    return this.searchService.indexInsight(input.insightId);
  }

  @Post("insights/query")
  queryInsights(@Body() input: SearchInsightsInput) {
    return this.searchService.searchInsights(input);
  }
}
