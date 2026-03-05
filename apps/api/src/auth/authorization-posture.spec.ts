import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { PATH_METADATA, METHOD_METADATA } from "@nestjs/common/constants";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { EmbedController } from "../modules/embed/embed.controller";
import fs from "fs";
import path from "path";

const CONTROLLERS_ROOT = path.resolve(__dirname, "../modules");

function listControllerFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listControllerFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".controller.ts") ? [entryPath] : [];
  });
}

function getRouteHandlers(controller: new (...args: never[]) => object) {
  const prototype = controller.prototype as Record<string, unknown>;
  return Object.getOwnPropertyNames(prototype)
    .filter((name) => typeof prototype[name] === "function" && name !== "constructor")
    .filter((name) => Reflect.getMetadata(PATH_METADATA, prototype[name]));
}

describe("authorization posture", () => {
  it("limits @Public routes to embed controller", () => {
    const controllerFiles = listControllerFiles(CONTROLLERS_ROOT);
    const publicControllers = controllerFiles.filter((file) => {
      const contents = fs.readFileSync(file, "utf8");
      return contents.includes("@Public(");
    });

    const nonEmbedPublic = publicControllers.filter(
      (file) => !file.includes(`${path.sep}embed${path.sep}`) && !file.includes(`${path.sep}health${path.sep}`),
    );
    expect(nonEmbedPublic).toEqual([]);
  });

  it("requires embed routes to be marked public", () => {
    const handlers = getRouteHandlers(EmbedController);
    const publicHandlers = handlers.filter((name) =>
      Reflect.getMetadata(IS_PUBLIC_KEY, EmbedController.prototype[name]),
    );

    const expectedPublic = handlers.filter((name) => name !== "createToken");
    expect(publicHandlers).toEqual(expectedPublic);
  });
});
