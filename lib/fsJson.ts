import fs from "fs";

export function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(filePath: string, obj: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}
