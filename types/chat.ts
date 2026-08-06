import { Document } from 'langchain/document';
import { AxiosResponse } from 'axios';

export type Message = {
  type: 'apiMessage' | 'userMessage';
  message: string;
  src: 'test' | 'gpt4' | 'talkingDb' | ''
  isStreaming?: boolean;
  sourceDocs?: Document[];
  step?: { [key: string]: any };
  answer?: string;
  error?: boolean;
  errorMessage?: string
};

export type contextItem = {
  content: Array<string>;
  content_source: string;
};

export type contextItemArray = contextItem[];

export type Page = {
  page_number: string;
  page_body: string
};

export interface IReferences {
  documentName: string;
  pageNumber: number;
}

export interface LiveChatbot {
  file: string;
  url: string;
}
export type ChatbotsResponse = AxiosResponse<{data: LiveChatbot[]}>;
export interface SignInScreenProps {
  JSModule: any;
  onLogin: () => void;
  error?: string | null;
}

export interface ChatHeaderProps {
  drawerOpen?: boolean;
  onDrawerToggle?: () => void;
  messages?: Message[]
  manageProjectsOpen?: boolean
  onToggleManageProjects?: () => void
}