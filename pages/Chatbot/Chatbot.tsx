import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChatbot } from '@/hooks/useChatbot';
import { ChatHeader } from '@/modules/ChatHeader';
import { SidePanel } from '@/modules/SideDrawer';
import { ChatMessages } from '@/modules/ChatMessages';
import { ChatInput } from '@/modules/ChatInput';
import { Loader } from '@/components/ui';
import { SignInScreen } from './SignIn';
import DocumentTree from '@/modules/DocumentTree';
import { getDocumentTreeJSon } from '@/apiRequests/ttt';
import { DocumentTreeData } from '@/types/documentTree';
import SuggestedQueries from '@/modules/SuggestedQueries';
import HistorySidebar from '@/modules/HistorySidebar';
import { getHistorySession } from '@/apiRequests/history';
import { HistorySessionDetail, HistoryDocumentEntry } from '@/types/history';
import { Message } from '@/types/chat';
import { FileText, Info } from 'lucide-react';

const LOTTIE_LOADER = 'https://lottie.host/d1fd738a-f930-465e-b6ff-cf2412f791db/8r36ZWTWb2.json';
const noop = () => {};

// Past session Q&A → the Message shape ChatMessages renders (read-only).
const toHistoryMessages = (detail: HistorySessionDetail): Message[] =>
  detail.chats.flatMap((chat) => [
    { type: 'userMessage', message: chat.question, src: 'test' } as Message,
    { type: 'apiMessage', message: chat.answer, src: 'talkingDb' } as Message,
  ]);

const PastConversationFooter: React.FC<{ documents: HistoryDocumentEntry[] }> = ({ documents }) => (
  <div style={{ maxWidth: 820, margin: '24px auto 0', width: '100%', padding: '0 24px' }}>
    {documents.length > 0 && (
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Sources</div>
        {documents.map((doc, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '10px 12px', marginBottom: 8, maxWidth: 360,
            }}
          >
            <FileText size={18} color="#6b7280" />
            <div style={{ fontSize: 13, color: '#374151' }}>{doc.name}</div>
          </div>
        ))}
      </div>
    )}
    <div style={{ display: 'flex', gap: 10, background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 10, padding: '14px 16px' }}>
      <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
        <strong>This is a past conversation.</strong>
        <div style={{ marginTop: 4, color: '#6b7280' }}>
          Reopening a history item does not allow follow-up questions that rely on this query&apos;s context.
          Any new query will be treated as a new, independent question.
        </div>
      </div>
    </div>
  </div>
);

const Chatbot: React.FC = () => {
  const {
    messages,
    loading,
    botLoading,
    query,
    setQuery,
    typingState,
    handleSubmit,
    handleInputChange,
    handleFileUpload,
    JSModule,
    open,
    setOpen,
    styles,
    references,
    chatId,
    isLoggedIn,
    isCheckingSession,
    hasOpenID,
    handleLogin,
    authError,
    setAuthError,
    namespace,
    startNewChat,
    currentSession,
  } = useChatbot();

  const showHistory = !!JSModule?.showHistory;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [historyReloadToken, setHistoryReloadToken] = useState(0);
  const [hasPriorSessions, setHasPriorSessions] = useState(false);
  const handleSessionsCount = useCallback((n: number) => setHasPriorSessions(n > 0), []);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId === currentSession ? null : sessionId);
  };

  const [pastDetail, setPastDetail] = useState<HistorySessionDetail | null>(null);
  const [pastLoading, setPastLoading] = useState(false);
  useEffect(() => {
    if (!selectedSessionId) { setPastDetail(null); return; }
    let alive = true;
    setPastLoading(true);
    setPastDetail(null);
    getHistorySession(selectedSessionId).then((d) => {
      if (!alive) return;
      setPastDetail(d);
      setPastLoading(false);
    });
    return () => { alive = false; };
  }, [selectedSessionId]);

  const handleNewChat = () => {
    setSelectedSessionId(null);
    startNewChat();
    setHistoryReloadToken((t) => t + 1);
  };

  useEffect(() => {
    if (!showHistory || selectedSessionId) return;
    if (messages.length > 0) setHistoryReloadToken((t) => t + 1);
  }, [messages.length, showHistory, selectedSessionId]);

  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [showSuggestedQueries, setShowSuggestedQueries] = useState(true);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [activeTabName, setActiveTabName] = useState<string>('chat');
  const [documentTreeLoading, setDocumentTreeLoading] = useState<boolean>(false);
  const [documentTreeJSon, setDocumentTreeJSon] = useState<DocumentTreeData | null>(null);

  const handleSuggestedQueries = (queries: string[]) => {
    if (queries?.length  > 0) {
      setShowSuggestedQueries(true)
      setSuggestedQueries(queries)
    } else {
      setShowSuggestedQueries(false)
    }
  }

  const latestRequestRef = useRef(0);
  const switchTab = async (tabName: string, graphId: string ='') => {
    setActiveTabName(tabName)

    // if documentTree tab is being selected, then setting the graphId of selected document;
    if (tabName === 'documentTree') {
      const requestId = ++latestRequestRef.current;
      setDocumentTreeLoading(true);
  
      try {
        const response = await getDocumentTreeJSon(graphId);
        if (requestId === latestRequestRef.current && response) {
          setDocumentTreeJSon(response);
        }
      } finally {
        if (requestId === latestRequestRef.current) {
          setDocumentTreeLoading(false);
        }
      }
    }
  }

  // Set up window functions immediately (for headerPaneHtml onclick handlers)
  if (typeof window !== 'undefined') {
    (window as any).toggleDrawer = () => setOpen(!open);
    (window as any).toggleLeftPanel = () => setLeftPanelExpanded(prev => !prev);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).toggleDrawer;
        delete (window as any).toggleLeftPanel;
      }
    };
  }, []);

  if (hasOpenID && isCheckingSession) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ width: '150px', height: '150px' }}>
          <Loader loader={LOTTIE_LOADER} />
        </div>
      </div>
    );
  }

  if (hasOpenID && !isLoggedIn) {
    return (
      <SignInScreen
        JSModule={JSModule}
        onLogin={() => { setAuthError(null); handleLogin(); }}
        error={authError}
      />
    );
  }

  if (botLoading || !JSModule?.enabled) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ width: '150px', height: '150px' }}>
          <Loader loader={LOTTIE_LOADER} />
        </div>
      </div>
    )
  }
  else {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <ChatHeader
          drawerOpen={open}
          onDrawerToggle={() => setOpen(!open)}
        />
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}>
          {showHistory ? (
            <HistorySidebar
              selectedSessionId={selectedSessionId ?? currentSession}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
              reloadToken={historyReloadToken}
              onCountChange={handleSessionsCount}
            />
          ) : leftPanelExpanded && JSModule?.leftPanelHtml ? (
            <div
              className={styles?.['sidebar']}
              dangerouslySetInnerHTML={{ __html: JSModule.leftPanelHtml }}
            />
          ) : null}

          {/* Main Content Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            minWidth: 0,
          }}>
            <div style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'row',
            }}>

              {
                selectedSessionId ? (
                  <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
                    {pastLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <div style={{ width: 120, height: 120 }}>
                          <Loader loader={LOTTIE_LOADER} />
                        </div>
                      </div>
                    ) : !pastDetail ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
                        This conversation is no longer available.
                      </div>
                    ) : (
                      <ChatMessages
                        chatId={pastDetail.chatbotId}
                        messages={toHistoryMessages(pastDetail)}
                        references={[]}
                        loading={false}
                        typingState={false}
                        handleSubmit={noop}
                        handleFileUpload={noop}
                        footer={<PastConversationFooter documents={pastDetail.documents} />}
                      />
                    )}
                  </div>
                ) : activeTabName === 'documentTree' ? (
                  <div
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      minWidth: 0,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => setActiveTabName('chat')}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1000,
                        width: 32,
                        height: 32,
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        background: '#fff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      ✕
                    </button>
                    {
                      documentTreeLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <div style={{ width: '150px', height: '150px' }}>
                            <Loader loader={LOTTIE_LOADER} />
                          </div>
                        </div>
                      ) : (                
                        documentTreeJSon?.nodes?.length ? (
                          <DocumentTree data={documentTreeJSon} />
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: '100%',
                              height: '100%',
                              fontSize: '16px',
                              color: '#666',
                            }}
                          >
                            Document tree is not available at this moment.
                          </div>
                        )
                      )
                    }
                  </div>
                ) : (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}>
                    <div style={{
                      flex: 1,
                      overflow: 'auto',
                    }}>
                      <ChatMessages
                        chatId={String(chatId)}
                        references={references}
                        messages={messages}
                        loading={loading}
                        handleSubmit={handleSubmit}
                        handleFileUpload={handleFileUpload}
                        typingState={typingState}
                        onUploadClick={JSModule?.drawerEnabled ? () => setOpen(true) : undefined}
                      />
                    </div>
                    {
                      showSuggestedQueries && !hasPriorSessions && messages?.length == 0 && query === "" && (
                        <SuggestedQueries setQuery={setQuery} suggestedQuestions={suggestedQueries} />
                      )
                    }
                    <ChatInput
                      query={query}
                      messages={messages}
                      typingState={typingState}
                      loading={loading}
                      onSubmit={handleSubmit}
                      onChange={setQuery}
                      onAddClick={JSModule?.drawerEnabled ? () => setOpen(true) : undefined}
                    />
                  </div>
                )
              }
              {JSModule?.drawerEnabled && !selectedSessionId && (
                <SidePanel switchTab={switchTab} open={open} setOpen={setOpen} namespace={namespace} handleSuggestedQueries={handleSuggestedQueries} hideDemoDocs={hasPriorSessions} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Chatbot;