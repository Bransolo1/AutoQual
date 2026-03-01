import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { CreateTaskInput, ShareTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from "./tasks.dto";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@Query("projectId") projectId: string) {
    return this.tasksService.list(projectId);
  }

  @Get("dependency-order")
  getDependencyOrder(@Query("projectId") projectId: string) {
    return this.tasksService.getDependencyOrder(projectId);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.tasksService.getById(id);
  }

  @Post()
  create(@Body() input: CreateTaskInput) {
    return this.tasksService.create(input);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() input: UpdateTaskInput) {
    return this.tasksService.update(id, input);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() input: UpdateTaskStatusInput) {
    return this.tasksService.updateStatus(id, input);
  }

  @Post(":id/comments")
  addComment(
    @Param("id") id: string,
    @Body() body: { authorUserId: string; body: string },
  ) {
    return this.tasksService.addComment(id, body.authorUserId, body.body);
  }

  @Post(":id/share")
  share(@Param("id") id: string, @Body() body: ShareTaskInput) {
    return this.tasksService.share(id, body);
  }
}
