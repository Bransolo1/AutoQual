import { Body, Controller, Post, Query } from "@nestjs/common";
import { SearchService } from "./search.service";
import {
  IndexInsightInput,
  IndexStoryInput,
  IndexThemeInput,
  IndexTranscriptInput,
  SearchAllInput,
  SearchInsightsInput,
} from "./search.dto";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post("index/insight")
  indexInsight(@Body() input: IndexInsightInput) {
    return this.searchService.indexInsight(input.insightId);
  }

  @Post("index/transcript")
  indexTranscript(@Body() input: IndexTranscriptInput) {
    return this.searchService.indexTranscript(input.transcriptId);
  }

  @Post("index/theme")
  indexTheme(@Body() input: IndexThemeInput) {
    return this.searchService.indexTheme(input.themeId);
  }

  @Post("index/story")
  indexStory(@Body() input: IndexStoryInput) {
    return this.searchService.indexStory(input.storyId);
  }

  @Post("insights/query")
  queryInsights(@Body() input: SearchInsightsInput) {
    return this.searchService.searchInsights(input);
  }

  @Post("insights/query-evidence")
  queryInsightsWithEvidence(@Body() input: SearchInsightsInput) {
    return this.searchService.searchInsightsWithEvidence(input);
  }

  @Post("query")
  queryAll(@Body() input: SearchAllInput) {
    return this.searchService.searchAll(input);
  }
}
