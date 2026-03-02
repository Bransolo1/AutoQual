import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { MediaService } from "./media.service";
import {
  ChunkPartUrlInput,
  CompleteChunkUploadInput,
  CreateClipInput,
  CreateMediaArtifactInput,
  InitChunkUploadInput,
  UpdateMediaLegalHoldInput,
} from "./media.dto";
import { Roles } from "../../auth/roles.decorator";
import { putObject } from "../../common/s3.client";

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
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { sessionId: string; type?: string },
  ) {
    const sessionId = body.sessionId;
    if (!sessionId) {
      throw new BadRequestException("missing_session_id");
    }
    if (!file) {
      throw new BadRequestException("missing_file");
    }
    const type = body.type ?? "video";
    const storageKey = `uploads/${sessionId}/${Date.now()}-${file.originalname ?? "file"}`;
    await putObject(storageKey, file.buffer, file.mimetype);
    return this.mediaService.createArtifact({ sessionId, type, storageKey });
  }

  @Post("artifacts/:id/process")
  @Roles("admin", "system")
  processArtifact(@Param("id") id: string) {
    return this.mediaService.processArtifact(id);
  }

  @Post("artifacts/:id/legal-hold")
  @Roles("admin")
  setLegalHold(@Param("id") id: string, @Body() input: UpdateMediaLegalHoldInput) {
    return this.mediaService.setLegalHold(id, input.enabled);
  }

  @Post("chunk/init")
  initChunk(@Body() body: InitChunkUploadInput) {
    return this.mediaService.initChunkUpload(body);
  }

  @Post("chunk/part")
  uploadChunkPart(@Body() body: ChunkPartUrlInput) {
    return this.mediaService.getChunkPartUrl(body);
  }

  @Post("chunk/complete")
  completeChunk(@Body() body: CompleteChunkUploadInput) {
    return this.mediaService.completeChunkUpload(body);
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

  @Get("retention/preview")
  @Roles("admin")
  previewRetention(@Query("workspaceId") workspaceId: string, @Query("retentionDays") retentionDays?: string) {
    const parsed = retentionDays ? Number(retentionDays) : undefined;
    return this.mediaService.previewRetention(
      workspaceId,
      Number.isFinite(parsed) ? parsed : undefined,
    );
  }

  @Post("retention/archive")
  @Roles("admin")
  archiveStale(@Query("workspaceId") workspaceId: string, @Query("retentionDays") retentionDays?: string) {
    const parsed = retentionDays ? Number(retentionDays) : undefined;
    return this.mediaService.archiveStaleMedia(
      workspaceId,
      Number.isFinite(parsed) ? parsed : undefined,
    );
  }

  @Get("clips/:id/thumbnail")
  getClipThumbnail(@Param("id") id: string) {
    return this.mediaService.getClipThumbnail(id);
  }
}
