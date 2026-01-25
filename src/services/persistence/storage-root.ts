import path from "path";

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), "data", "storage");

const isLocalStoragePath = (value: string): boolean => {
  const normalized = path.resolve(value);
  return path.basename(normalized) === "local_storage";
};

export const resolveStorageRoot = (): string => {
  const envPath = process.env.LOCAL_STORAGE_PATH;
  if (envPath) {
    if (isLocalStoragePath(envPath)) {
      console.warn(
        `[storage] LOCAL_STORAGE_PATH points to local_storage; using ${DEFAULT_STORAGE_ROOT} instead.`
      );
      return DEFAULT_STORAGE_ROOT;
    }
    return envPath;
  }
  return DEFAULT_STORAGE_ROOT;
};
