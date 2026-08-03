import React, { useState, useEffect } from 'react';
import TrashIcon from '@/assets/svgs/TrashIcon';
import { deleteChatbot, getChatbots } from '@/apiRequests';
import { LiveChatbot } from '@/types/chat';
import CustomModal from '@/components/ui/customModal';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import CopyIcon from '@/assets/svgs/CopyIcon';
import CloneChatbot from '@/modules/CloneChatbot';
import Pencil from '@/assets/svgs/Pencil';

const AdminPage: React.FC = () => {

    const [liveChatbots, setLiveChatbots] = useState<LiveChatbot[] | null>(null);
    const [modalStatus, setModalStatus] = useState(false);
    const [cloneStatus, setCloneStatus] = useState(false);
    const [createChatbot, setCreateChatbot] = useState(false);
    const [selectedChatbotKey, setSelectedChatbotKey] = useState<string>('');
    const router = useRouter();
    const { key } = router.query;
    // Remove fallback value later
    const verificationKey = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "12345"


    const fetchLiveChatbots = async () => {
        let allChatbots = await getChatbots()
        setLiveChatbots(allChatbots)
    }

    useEffect(() => {
        fetchLiveChatbots()
    }, [])

    const deleteLiveChatbot = async (Id?: string) => {
        if (Id && Id !== "close modal") {
            await deleteChatbot(Id)
            await fetchLiveChatbots()
            toast(`${Id} chatbot deleted successfully`, { type: "success" });
        }
        setModalStatus(false)
        setSelectedChatbotKey('')

    }

    const handleCloneChatbot = async (Id?: string) => {
        // console.log("cloned succesfully", Id)


        if (Id === "close modal") {
            setCloneStatus(false)
            setCreateChatbot(false)
            setSelectedChatbotKey('')
        } else if (Id === "created") {
            toast("Chatbot cloned successfully", { type: "success" })
            setCreateChatbot(false)
            setSelectedChatbotKey('')
            await fetchLiveChatbots()
        } else if (Id) {
            setCreateChatbot(true);
            setCloneStatus(false)
        } else {
            if (cloneStatus) setCloneStatus(false)
            setCreateChatbot(false)
            setSelectedChatbotKey('')
        }
    }

    return (
        <>
            {key !== verificationKey ? (
                <div className='m-8 flex justify-center items-center h-screen'>
                    <h1>{"You don't have access of this page"} <br /> Please contact admin for access. </h1>
                </div>
            ) : (
                <div className='m-6'>
                    <div className='flex justify-between  mb-12'>
                        <div className='flex gap-x-2'>
                            <h1 className='text-2xl text-red-500 font-bold'>* Live</h1>
                            <h1 className='text-2xl font-bold'>Chatbots</h1>
                        </div>
                        <div>
                            <button
                                className='px-4 py-2 text-white rounded'
                                style={{ backgroundColor: '#4968DD' }}
                                onClick={() => router.push('/admin/upload')}
                            >
                                Create new Chatbot
                            </button>
                        </div>

                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-10'>
                        {liveChatbots?.map((item, index) => (
                            <div
                                key={index + 1}
                                className="relative max-w-sm bg-white shadow-lg rounded-lg overflow-hidden h-24 hover:shadow-xl"
                                style={{ backgroundColor: '#CFDDFC' }}
                            >
                                <button
                                    className="mr-4 p-4 h-full flex flex-col justify-center items-center"
                                    onClick={() => window.open(item?.url, '_blank')}
                                >
                                    <h2 className="text-xl font-bold text-gray-800">{item?.file}</h2>
                                </button>
                                <div className='flex w-6 gap-1 absolute top-2 right-16 item-center'>
                                    <button
                                        onClick={() => {
                                            setCloneStatus(true)
                                            setSelectedChatbotKey(item?.file)
                                        }}
                                        title='Clone Chatbot'
                                        className="text-gray-500 focus:outline-none hover:bg-gray-200 rounded p-1"
                                    >
                                        <CopyIcon />
                                    </button>

                                    <button
                                        onClick={() => window.open(`/admin/edit-file?chatbotId=${item?.file}&filetype=server`, '_blank')}
                                        title='Edit Chatbot'
                                        className="text-gray-500 focus:outline-none hover:bg-gray-200 rounded p-1"
                                    >
                                        <Pencil color='black' />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setModalStatus(true)
                                            setSelectedChatbotKey(item?.file)
                                        }}
                                        title='Delete Chatbot'
                                        className="text-gray-500 focus:outline-none hover:bg-gray-200 rounded p-1"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        )
                        )}
                        {modalStatus && <CustomModal id={selectedChatbotKey} title={`Do you want to delete chatbot - ${selectedChatbotKey}?`} status={modalStatus} onClose={deleteLiveChatbot} />}
                        {cloneStatus &&
                            <CustomModal
                                id={selectedChatbotKey}
                                title={`Do you want to clone this chatbot - ${selectedChatbotKey}?`}
                                status={cloneStatus}
                                onClose={handleCloneChatbot}
                            />
                        }
                        {createChatbot &&
                            <CustomModal
                                id={selectedChatbotKey}
                                onClose={handleCloneChatbot}
                                status={createChatbot}
                                title={"Enter the name for the new chatbot"}
                                showOptionsButton={false}
                            >{<CloneChatbot id={selectedChatbotKey} onClose={handleCloneChatbot} />}</CustomModal>
                        }
                    </div>
                </div>
            )}
        </>
    )

}


export default AdminPage;