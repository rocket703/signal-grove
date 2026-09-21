import { promises as fs } from "fs";
import path from "path";
import { createSeedState } from "./seed";
import type { AppState } from "./types";

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = "store.json";

let writeQueue: Promise<void> = Promise.resolve();

export function getDataDir(): string {
  const fromEnv = process.env.DATA_DIR || process.env.SEOGEO_DATA_DIR;
  return fromEnv ? path.resolve(fromEnv) : DEFAULT_DATA_DIR;
}

function storePath(): string {
  return path.join(getDataDir(), STORE_FILE);
}

async function ensureStore(): Promise<AppState> {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true });
  const file = storePath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as AppState;
    if (parsed?.version !== 1) {
      throw new Error("unsupported store version");
    }
    return parsed;
  } catch {
    const seed = createSeedState();
    seed.settings.dataDirLabel = path.relative(process.cwd(), file) || file;
    await fs.writeFile(file, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

export async function readState(): Promise<AppState> {
  return ensureStore();
}

export async function writeState(state: AppState): Promise<AppState> {
  const file = storePath();
  state.settings.dataDirLabel = path.relative(process.cwd(), file) || file;
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(getDataDir(), { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
    await fs.rename(tmp, file);
  });
  await writeQueue;
  return state;
}

export async function updateState(
  mutator: (state: AppState) => AppState | void
): Promise<AppState> {
  const state = await readState();
  const next = mutator(state) ?? state;
  return writeState(next);
}

export async function resetDemoData(): Promise<AppState> {
  const seed = createSeedState();
  return writeState(seed);
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
