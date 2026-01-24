import fs from "fs";
import path from "path";
import { z } from "zod";

const DEFAULT_PROFILE = {
  username: "Learner",
  avatarUrl: "",
};

const profileSchema = z.object({
  username: z.string().min(1).max(60),
  avatarUrl: z.string().optional().default(""),
});

export type UserProfile = z.infer<typeof profileSchema>;

const resolveProfilePath = (): string => {
  const storageRoot =
    process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "local_storage");
  return path.join(storageRoot, "user-profile.json");
};

const ensureStorageDir = (filePath: string) => {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
};

export const loadProfile = (): UserProfile => {
  const filePath = resolveProfilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return profileSchema.parse(parsed);
    }
  } catch (error) {
    console.error("Failed to load profile:", error);
  }
  return DEFAULT_PROFILE;
};

export const saveProfile = (input: UserProfile): UserProfile => {
  const filePath = resolveProfilePath();
  const normalized = profileSchema.parse(input);
  try {
    ensureStorageDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2));
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
  return normalized;
};
