declare module 'react-pdf' {
    import { ComponentType, ReactNode } from 'react';
  
    export interface DocumentProps {
      file: string | Uint8Array | { url: string } | any;
      onLoadSuccess?: ({ numPages }: { numPages: number }) => void;
      onLoadError?: (error: Error) => void;
      children?: ReactNode;
    }
  
    export interface PageProps {
      pageNumber: number;
      scale?: number;
      width?: number;
      height?: number;
      renderAnnotationLayer?: boolean;
      renderTextLayer?: boolean;
      customTextRenderer?: (layer: { str: string; itemIndex: number }) => string;
    }
  
    export const Document: ComponentType<DocumentProps>;
    export const Page: ComponentType<PageProps>;
  
    export const pdfjs: {
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      version: string;
    };
  }