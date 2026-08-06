import {
    ChevronRight,
    FileText,
    ExternalLink,
} from "lucide-react";
import ThemeContext from "@/contexts/ThemeContext";
import { useContext } from "react";
import { Document } from "langchain/document";
import { SourcePanelProps } from "@/types/sourcePanel";

export default function SourcePanel({
    sources,
    expandedSources,
    onChange,
    onOpenDocument,
}: SourcePanelProps) {

    const { styles } = useContext(ThemeContext);
    const handleSourceClick = (index: number) => {
        const next = new Set(expandedSources);

        next.has(index)
            ? next.delete(index)
            : next.add(index);

        onChange(next);
    };
    const allExpanded = sources.length > 0 && expandedSources.size === sources.length;
    const handleExpandCollapseAll = () => {
        onChange(allExpanded ? new Set() : new Set(sources.map((_, index) => index)));
    };

    return (
        <div className={styles.sourceContainer}>
            <div className={styles.sourceHeader}>
                <span>Sources ({sources.length})</span>
                <button
                    className={styles.sourceCollapse}
                    onClick={handleExpandCollapseAll}
                >
                    {allExpanded ? "Collapse all" : "Expand all"}
                </button>
            </div>

            <div className={styles.sourceList}>
                {sources.map((source: Document, index) => {
                    const isExpanded = expandedSources.has(index);

                    return (
                        <div key={index} className={styles.sourceRow}>
                        <button
                            className={styles.sourceItem}
                            onClick={() => handleSourceClick(index)}
                        >
                            <div className={styles.sourceIcon}>
                                <FileText size={22} />
                            </div>
                            <div className={styles.sourceContent}>
                                <div className={styles.sourceTitle}>
                                    Page {source.metadata?.pageNumber}
                                </div>
                                <div
                                    className={
                                        isExpanded
                                            ? styles.sourceSubtitleExpanded
                                            : styles.sourceSubtitle
                                    }
                                >
                                    {source.pageContent}
                                </div>
                            </div>
                            <ChevronRight
                                size={20}
                                className={
                                    isExpanded
                                        ? styles.chevronExpanded
                                        : ""
                                }
                            />
                        </button>
                        {onOpenDocument && (
                            <button
                                className={styles.sourceOpenDoc}
                                onClick={() => onOpenDocument(source)}
                            >
                                <span>Open in Document</span>
                                <ExternalLink size={14} />
                            </button>
                        )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}