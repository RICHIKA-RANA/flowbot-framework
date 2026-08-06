import CrossIcon from '@/assets/svgs/CrossIcon';
import React, {ReactNode} from 'react';

const CustomModal = (
  {id, title, status, onClose, children, showOptionsButton=true}: 
  {
    id?: string,
    title: string, 
    status: boolean, 
    onClose: (id?: string) => void,
    children?: ReactNode,
    showOptionsButton?: boolean
  }
) => {

  return (
    <>
      {status && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className='flex justify-between gap-6 items-center mb-4'>
              <h2 className="text-xl font-bold">{title}</h2>
              <div className='cursor-pointer' onClick={() => onClose("close modal")}><CrossIcon /></div>
            </div>
            <>
            {children}
            </>
            {showOptionsButton && <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                onClick={() => onClose(id)}
              >
                Yes
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                onClick={() => onClose() }
              >
                No
              </button>
            </div>}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomModal;