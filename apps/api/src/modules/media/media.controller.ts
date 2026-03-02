import { Body, Controller, Get, Param, Post, Query, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MediaService } from "./media.service";
import { CreateClipInput, CreateMediaArtifactInput } from "./media.dto";
import { Roles } from "../../auth/roles.decorator";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get("artifacts")
  listArtifacts(@Query("sessionId") sessionId: string) {
    return this.mediaService.listArtifacts(sessionId);
  }

  @Post("artifacts")
  createArtifact(@Body() input: CreateMediaArtifactInput) {
    return this.mediaService.createArtifact(input);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      dest: "uploads/",
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { sessionId: string; type?: string },
  ) {
    const sessionId = body.sessionId;
    const type = body.type ?? "video";
    const storageKey = file?.path ?? `uploads/${sessionId}/${Date.now()}-file`;
    return this.mediaService.createArtifact({ sessionId, type, storageKey });
  }

  @Post("artifacts/:id/process")
  @Roles("admin", "system")
  processArtifact(@Param("id") id: string) {
    return this.mediaService.processArtifact(id);
  }

  @Post("chunk/init")
  initChunk(@Body() body: { sessionId: string; fileName: string; contentType?: string }) {
    const uploadId = `chunk-${Date.now()}`;
    const storageKey = `uploads/${body.sessionId}/${uploadId}-${body.fileName}`;
    return { uploadId, storageKey };
  }

  @Post("chunk/part")
  uploadChunkPart(@Body() body: { uploadId: string; partNumber: number; etag: string }) {
    return { recorded: true, ...body };
  }

  @Post("chunk/complete")
  completeChunk(@Body() body: { uploadId: string; storageKey: string }) {
    return { completed: true, ...body };
  }

  @Post("multipart/init")
  initMultipart(@Body() body: { storageKey: string; contentType?: string }) {
    return this.mediaService.initMultipart(body.storageKey, body.contentType);
  }

  @Post("multipart/part-url")
  getPartUrl(@Body() body: { storageKey: string; uploadId: string; partNumber: number }) {
    return this.mediaService.getPartUrl(body.storageKey, body.uploadId, body.partNumber);
  }

  @Post("multipart/complete")
  completeMultipart(
    @Body()
    body: {
      storageKey: string;
      uploadId: string;
      parts: { ETag: string; PartNumber: number }[];
      sessionId: string;
      type?: string;
    }
  ) {
    return this.mediaService.completeMultipart(
      body.storageKey,
      body.uploadId,
      body.parts,
      body.sessionId,
      body.type ?? "video"
    );
  }

  @Get("artifacts/:id/signed-url")
  getSignedUrl(@Param("id") id: string) {
    return this.mediaService.getSignedUrl(id);
  }

  @Post("upload-url")
  getUploadUrl(@Body() body: { storageKey: string; contentType?: string }) {
    return this.mediaService.getUploadUrl(body.storageKey, body.contentType);
  }

  @Get("clips")
  listClips(@Query("mediaArtifactId") mediaArtifactId: string) {
    return this.mediaService.listClips(mediaArtifactId);
  }

  @Post("clips")
  createClip(@Body() input: CreateClipInput) {
    return this.mediaService.createClip(input);
  }

  @Post("retention/archive")
  archiveStale(@Query("workspaceId") workspaceId: string, @Query("retentionDays") retentionDays?: string) {
    const parsed = retentionDays ? Number(retentionDays) : 365;
    return this.mediaService.archiveStaleMedia(workspaceId, Number.isFinite(parsed) ? parsed : 365);
  }

  @Get("clips/:id/thumbnail")
  getClipThumbnail(@Param("id") id: string) {
    return this.mediaService.getClipThumbnail(id);
  }
}
