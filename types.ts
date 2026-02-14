
export type BackgroundType = 'image' | 'video' | 'color';

export interface AppState {
  recipient: string;
  message: string;
  bgUrl: string;
  bgType: BackgroundType;
  theme: 'dark' | 'light' | 'pink';
}

export enum GenerationMode {
  MESSAGE = 'MESSAGE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface GenerationStatus {
  isGenerating: boolean;
  progress: string;
  error?: string;
}
