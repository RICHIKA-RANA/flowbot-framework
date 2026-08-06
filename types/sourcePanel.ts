import { Document } from "langchain/document";

export interface SourcePanelProps {
    sources: Document[];
    expandedSources: Set<number>;
    onChange: (next: Set<number>) => void;
    onOpenDocument?: (source: Document) => void;
}