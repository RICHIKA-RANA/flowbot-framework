import Libby from "@/assets/svgs/Libby";
import You from "@/assets/svgs/You";
import ToolTip from "@/assets/svgs/icons/ToolTip";
import LoadingDots from "@/components/ui/LoadingDots";
import ReferenceViewer from "@/components/ui/ReferenceView/ReferenceView";
import ThemeContext from "@/contexts/ThemeContext";
import Image from "next/image";
import { Fragment, useContext, useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { IReferences, Message } from '@/types/chat';
import rehypeRaw from 'rehype-raw';
import { DynamicComponent } from "@/components/DynamicComponent";
import { useRouter } from 'next/router';
import { FileText, ChevronUp } from "lucide-react";
import { Document } from "langchain/document";
import SourcePanel from "./SourcePanel";
import { getDocumentFile } from "@/apiRequests/ttt";
import { DocumentFileError } from "@/types/ui";

interface ChatMessageProps {
    chatId: string;
    typingState: boolean
    loading: boolean
    handleSubmit: (val?: string) => void
    handleFileUpload: (file: FileList) => void
    messages: Message[]
    references: IReferences[]
    onUploadClick?: () => void
    footer?: React.ReactNode
}

const documentColumnStyle = (expanded: boolean): React.CSSProperties => ({
    width: expanded ? '78%' : '46%',
    flexShrink: 0,
    height: '100%',
    overflow: 'hidden',
    transition: 'width 160ms ease',
});

export const ChatMessages: React.FC<ChatMessageProps> = ({ chatId, messages, loading, handleSubmit, typingState, handleFileUpload, references, onUploadClick, footer }) => {

    const [expandedMessageIndex, setExpandedMessageIndex] = useState<number | null>(null);
    const [selectedSourceReferences, setSelectedSourceReferences] = useState<Document[]>([]);
    const [sourceExpansion, setSourceExpansion] = useState<Record<number, Set<number>>>({});
    const [openedSource, setOpenedSource] = useState<Document | null>(null);
    const [docExpanded, setDocExpanded] = useState<boolean>(false);
    const openedGraphId: string | undefined = openedSource?.metadata?.graph_id;
    const [fileUrl, setFileUrl] = useState<string>('');
    const [fileError, setFileError] = useState<DocumentFileError | undefined>(undefined);
    const { JSModule, styles } = useContext(ThemeContext);
    const router = useRouter();
    const messageListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // This effect will run each time the messages array is updated (i.e., when a new message is added)
        if (messageListRef.current) {
            messageListRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages]);

    useEffect(() => {
        if (!openedGraphId) return;
        let objectUrl = '';
        let cancelled = false;

        (async () => {
            const { blob, status } = await getDocumentFile(openedGraphId);
            if (cancelled) return;
            if (!blob) {
                setFileError(
                    status === 401 || status === 403
                        ? 'unauthorized'
                        : status === 404
                            ? 'missing'
                            : 'error'
                );
                return;
            }
            objectUrl = URL.createObjectURL(blob);
            setFileError(undefined);
            setFileUrl(objectUrl);
        })();

        return () => {
            cancelled = true;
            setFileUrl('');
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [openedGraphId]);

    useEffect(() => {
        if (expandedMessageIndex !== null && expandedMessageIndex >= messages.length) {
            setExpandedMessageIndex(null);
            setSelectedSourceReferences([]);
        }
    }, [messages.length, expandedMessageIndex]);

    const createMarkup = (question: any) => {
        return { __html: question };
    };

    const askQuestion = () => {
        handleSubmit('contact us');
    }

    const handleSourceReferencesView = (message: Message, index: number) => {
        if (expandedMessageIndex === index) {
            setExpandedMessageIndex(null);
            setSelectedSourceReferences([]);
        } else {
            setExpandedMessageIndex(index);
            setSelectedSourceReferences(message.sourceDocs ?? []);
        }
    }

    return (
        <div style={{ display:'flex', flexDirection:"row", width: "100%", height: "100%"}}>
            <div className={styles?.cloud} style={{ width: "100%"}}>
                <div className={styles["messagelist"]}>
                    {/* Empty state / Welcome screen */}
                    {messages.length === 0 && (
                        <div className={styles?.['welcome-screen']}>
                            <div className={styles?.['welcome-icon']}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                            </div>
                            <h2 className={styles?.['welcome-title']}>
                                Welcome to {JSModule?.botName}
                            </h2>
                            <p className={styles?.['welcome-subtitle']}>
                                Upload your documents and start chatting to get AI-powered answers.
                            </p>
                            {JSModule?.howToUseSteps?.length > 0 && (
                                <div className={styles?.['how-to-use']}>
                                    <h3>How to use</h3>
                                    {JSModule.howToUseSteps.map((step: any) => (
                                        <div key={step.number} className={styles?.['how-to-step']}>
                                            <div className={styles?.['step-number']}>{step.number}</div>
                                            <div className={styles?.['step-content']}>
                                                <p className={styles?.['step-title']}>{step.title}</p>
                                                <p className={styles?.['step-description']}>{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TODO: Move Icon to conf */}
                    {messages.map((message, index) => {
                            let icon;
                            let className;
                            if (message.type === 'apiMessage') {
                                icon = (
                                    <div style={{ paddingRight: '20px' }}>
                                        <Image
                                            key={index}
                                            src="/bot-image.png"
                                            alt="AI"
                                            width="40"
                                            height="40"
                                            className={styles.boticon}
                                            priority
                                        />
                                    </div>
                                );
                                if (JSModule?.enabled) {
                                    icon = (
                                        <div className={styles?.libby}>
                                            {JSModule.chatbotIcon ? (
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: JSModule.chatbotIcon,
                                                    }}
                                                />
                                            ) : (
                                                <Libby />
                                            )}
                                        </div>
                                    );
                                }
                                className = styles?.apimessage;
                            } else {
                                icon = (
                                    <div className={styles?.libby}>
                                        {JSModule.userIcon ? (
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: JSModule.userIcon,
                                                }}
                                            />
                                        ) : (
                                            <You />
                                        )}
                                    </div>
                                );
                                // The latest message sent by the user will be animated while waiting for a response
                                className =
                                    loading && index === messages?.length - 1
                                        ? styles?.usermessagewaiting
                                        : styles?.usermessage;
                            }
                            return (
                                <Fragment key={index}>
                                    {message?.step?.header && (
                                        <div className={styles?.headerContainer}>
                                            <div className={styles?.stepCircle}>
                                                {message?.step?.header?.step}
                                            </div>
                                            <div className={styles?.stepText}>
                                                {message?.step?.header?.text}
                                            </div>
                                        </div>
                                    )}
                                    <div key={`chatMessage-${index}`} className={className}>
                                        <div
                                            className={`${styles.container} ${
                                                message.type === 'userMessage'
                                                  ? styles.userRow
                                                  : styles.botRow
                                              }`}
                                        >
                                            {
                                                message.type === 'apiMessage' &&
                                                !JSModule?.hideBotIcon && (
                                                    <div>
                                                    {icon}
                                                    </div>
                                                )
                                            }
                                            <div>
                                                {/* botname */}
                                                {!JSModule?.hideBotIcon && message.type === 'apiMessage' && (
                                                    <span className={styles?.botName}>
                                                        {JSModule?.botName}
                                                        {message?.step?.tooltip && (
                                                            <p
                                                                title={message?.step?.tooltip}
                                                                className={styles?.tooltipIcon}
                                                            >
                                                                <ToolTip />
                                                            </p>
                                                        )}
                                                    </span>
                                                )}

                                                {/* username */}
                                                {!JSModule?.hideUserIcon && message.type === 'userMessage' && (
                                                    <span
                                                        className={styles?.botName}
                                                        style={{
                                                            textAlign: JSModule?.conversationLayout ? 'right' : 'left'
                                                        }}
                                                    >
                                                        You
                                                    </span>
                                                )}

                                                <div
                                                    className={`${styles?.markdownanswer}`}
                                                >
                                                    <span
                                                        className={`${styles?.markdownanswerspan} ${message?.type == 'apiMessage' ? styles?.chat_container_left : styles?.chat_container_right}
                                                        ${message?.type === 'apiMessage' && message?.sourceDocs? styles?.chat_container_left_with_reference: ''}
                                                            `}
                                                    >
                                                        <div style={{ display: 'flex' }}>
                                                            {!message?.step?.injectionType &&
                                                                <div

                                                                    onInput={() => console.log("typing ...")}
                                                                >
                                                                    <ReactMarkdown
                                                                        // @ts-ignore
                                                                        rehypePlugins={[rehypeRaw]}
                                                                        components={{
                                                                            p: ({ node, children, ...props }) => (
                                                                                <p
                                                                                    className={
                                                                                        styles?.userMessageFont
                                                                                    }
                                                                                    {...props}
                                                                                >
                                                                                    {children}
                                                                                </p>
                                                                            ),
                                                                        }}
                                                                    >
                                                                        {message.message}
                                                                    </ReactMarkdown>
                                                                </div>}
                                                            {message?.step?.injectionType === 'contactUs' &&
                                                                <div>
                                                                    <div dangerouslySetInnerHTML={createMarkup(message.message)} />
                                                                    <span style={{ cursor: 'pointer' }} onClick={askQuestion}><b><u>Contact Us</u></b></span>
                                                                </div>
                                                            }
                                                            {message?.error && (
                                                                <div
                                                                    style={{
                                                                        color: 'red',
                                                                        paddingLeft: '4px',
                                                                        fontWeight: 'bold',
                                                                    }}
                                                                >
                                                                    ({message?.errorMessage})
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* here is the document icon to see the pagewise source references */}
                                                        {(message?.type === 'apiMessage' && message?.sourceDocs && message.sourceDocs.length > 0) && (
                                                          <button
                                                          className={`${styles.referenceButton}`}
                                                          onClick={() => {handleSourceReferencesView(message, index)}}
                                                        >
                                                          <span className={`${styles?.referenceButton__icon}`}>
                                                          {expandedMessageIndex === index
                                                          ? <ChevronUp size={20} />
                                                          : <FileText size={20} />}
                                                          </span>
                                                          <span className={`${styles?.referenceButton__divider}`} />
                                                          <span className={`${styles?.referenceButton__count}`}>{message?.sourceDocs?.length}</span>
                                                        </button>
                                                        )}
                                                    </span>
                                                    {(JSModule?.conversationLayout && ((message?.step?.inputType === 'await' && index === messages.length - 1) || (typingState && index === messages.length - 1) || (loading && index === messages.length - 1))) &&
                                                        <span
                                                            className={`${styles?.chat_container_left}`}
                                                            style={{
                                                                width: '40px',
                                                                marginTop: '20px',
                                                                backgroundColor: '#F6F5F5'
                                                            }}
                                                        >
                                                            <LoadingDots color="#000" />
                                                        
                                                        </span>}
                                                    {JSModule?.conversational && (
                                                        <div className={styles?.extraContainer}>
                                                            {/* component */}
                                                            <DynamicComponent 
                                                                messages={messages}
                                                                message={message}
                                                                index={index}
                                                                handleSubmit={(val) => handleSubmit(val)}
                                                                handleFileUpload={handleFileUpload}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* USER ICON (right side) */}
                                            {message.type === 'userMessage' &&
                                                !JSModule?.hideUserIcon && (
                                                  <div>
                                                    {icon}
                                                  </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </Fragment>
                            )
                    })}
                    {footer}
                    {/* Dummy div to scroll into view */}
                    <div ref={messageListRef} />
                </div>
                {
                    expandedMessageIndex !== null && (
                        <SourcePanel
                            sources={selectedSourceReferences}
                            expandedSources={sourceExpansion[expandedMessageIndex] ?? new Set()}
                            onChange={(next) =>
                                setSourceExpansion(prev => ({
                                    ...prev,
                                    [expandedMessageIndex]: next,
                                }))
                            }
                            onOpenDocument={
                                JSModule?.referenceDocumentViewEnabled ? setOpenedSource : undefined
                            }
                        />
                    )
                }
            </div>
            {/* here we will be showing the reference documents */}
            {
                JSModule?.referenceDocumentViewEnabled && openedGraphId && openedSource && (
                    <div style={documentColumnStyle(docExpanded)}>
                        <ReferenceViewer
                            key={`${openedGraphId}:${openedSource.metadata?.pageNumber}`}
                            fileUrl={fileUrl}
                            fileError={fileError}
                            pageNumber={Number(openedSource.metadata?.pageNumber) || 1}
                            highlight={openedSource.pageContent}
                            fileName={openedSource.metadata?.filename}
                            expanded={docExpanded}
                            onToggleExpand={() => setDocExpanded(prev => !prev)}
                            onClose={() => {
                                setOpenedSource(null);
                                setDocExpanded(false);
                            }}
                        />
                    </div>
                )
            }

        </div>
    )
}
