export type InstallState = {
  prompt: {prompt(): Promise<void>; userChoice: Promise<{outcome: string}>} | null;
  installed: boolean;
  standalone: boolean;
  busy: boolean;
  error: string;
};
export function createInstallController(target: Window): {
  subscribe(listener: () => void): () => void;
  getSnapshot(): InstallState;
  install(): Promise<void>;
};
