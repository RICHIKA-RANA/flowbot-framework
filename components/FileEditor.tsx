import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Props {
  fileType: string;
  fileContent: string;
  handleSubmit: (content: string) => void
}

const FileEditor: React.FC<Props> = ({ fileType, fileContent, handleSubmit }) => {
  const [content, setContent] = useState(fileContent);

  const handleEditorChange = (value: string | undefined) => {
    setContent(value || '');
  };

  const handleSave = async () => {
    handleSubmit(content)
    toast("Chatbot Updated successfully", { type: "success" })
  };

  return (
    <>
      <div className='flex justify-between p-2 items-center'>
        <h1 className='items-center flex'>Code Editor</h1>
        <button
          className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700' 
          onClick={handleSave}>Save</button>
      </div>
      <div style={{ height: '94vh', width: '100%' }}>
        <MonacoEditor
          language={fileType}
          value={content}
          onChange={handleEditorChange}
          theme="vs-dark"
        />
        </div>
    </>
  );
};

export default FileEditor;