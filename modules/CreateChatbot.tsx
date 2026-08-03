import React, { useEffect, useState } from "react";
import { UploadChatbotZip, UploadConfig } from "@/apiRequests";
import Dropdown from "@/components/ui/Dropdown";
import { toast } from 'react-toastify';


interface CreateChatbotProps {
    title: string,
    description: string,
    submitButtonText: string,
    inputList?: { label: string; placeholder: string; type: string; data?: string[] }[];
    allowedFileType: string[]
}

const CreateChatbot = ({ title, description, submitButtonText, inputList, allowedFileType }: CreateChatbotProps) => {
    const [chatBotId, setChatBotId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        const fileType = selectedFile?.type;
        // const fileName = selectedFile?.name.toLowerCase();

        if (fileType && allowedFileType.includes(fileType)) {
            setFile(selectedFile);
        } else {
            alert('Please upload a correct file format');
        }
    };

    useEffect(() => {
        setChatBotId('');
        setFile(null);
    }, [title])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (file) {
            const fileType = file?.type;

            if (['application/zip', 'application/x-zip-compressed'].includes(fileType)) {
                await UploadChatbotZip(chatBotId, file)
            }

            if (fileType === 'text/javascript' && inputList && selectedIndex !== null && inputList[1]?.data) {
                await UploadConfig(chatBotId, 'js', inputList[1]?.data[selectedIndex], file)
            }

            if (fileType === 'text/css') {
                await UploadConfig(chatBotId, 'css', 'webapp', file)
            }

            // Clear inputs after upload
            setChatBotId('');
            setFile(null);
            toast("configuration uploaded", {type: "success"});
            (document.getElementById('fileInput') as HTMLInputElement).value = '';
        }
    };

    return (
        <>
            <div className="flex justify-center w-full">
                <div
                    className="relative min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-gray-500 bg-no-repeat bg-cover relative items-center"
                    style={{ width: "750px" }}
                >
                    <div className="sm:max-w-lg w-full p-10 bg-white rounded-xl z-10">
                        <div className="text-center">
                            <h2 className="mt-5 text-3xl font-bold text-gray-900">
                                {title}
                            </h2>
                            <p className="mt-2 text-sm text-gray-400">{description}</p>
                        </div>
                        <form className="m-8 space-y-3" onSubmit={handleSubmit}>
                            {inputList && inputList?.length > 0 && inputList?.map((item, index) =>
                                <div className="grid grid-cols-1 space-y-2 mb-4" key={index + 1}>
                                    <label className="text-sm font-bold text-gray-500 tracking-wide mb-2">{item?.label}</label>
                                    {item.type === "input" && <input
                                        className="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        type="text"
                                        placeholder={item?.placeholder}
                                        value={chatBotId}
                                        onChange={(e) => setChatBotId(e.target.value)}
                                    />}

                                    {
                                        item.type === "radioGroup" && item.data &&
                                        <Dropdown
                                            options={item.data}
                                            selectedIndex={selectedIndex}
                                            onSelect={(index: number) => setSelectedIndex(index)}
                                        />
                                    }
                                </div>
                            )
                            }
                            <div className="grid grid-cols-1 space-y-2 shadow-inner">
                                <label className="text-sm font-bold text-gray-500 tracking-wide">{"Attach Document"}</label>
                                <div className="flex items-center justify-center">
                                    <label className="flex flex-col rounded-lg border-4 border-dashed w-full h-60 p-10 group text-center cursor-pointer">
                                        <div className="h-full w-full text-center flex flex-col items-center justify-center items-center">
                                            <div className="flex flex-auto max-h-48 w-2/5 mx-auto -mt-10">
                                                <img src="https://user-images.githubusercontent.com/507615/54591670-ac0a0180-4a65-11e9-846c-e55ffce0fe7b.png" alt="image" />
                                            </div>
                                            <p className="pointer-none text-gray-500 ">
                                                <span className="text-sm">Drag and drop</span> files here <br /> or <span className="text-blue-600 hover:underline">select a file</span> from your computer <br />
                                                {`supported (*${allowedFileType[0]})`}
                                            </p>
                                        </div>
                                        <input id="fileInput" type="file" accept={allowedFileType.join(',')} className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                            {file && <div className="text-sm text-gray-300 flex flex-col mb-8">
                                <span>{`Attached Document - ${file?.name}`}</span>
                                <span>{`Please click below button.`}</span>
                            </div>}
                            {<div className="mt-6">
                                <button
                                    type="submit"
                                    className={`text-blue-600 my-5 w-full flex justify-center p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline transition ease-in duration-300
                                    ${!file ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-gray-100 hover:bg-blue-600 hover:shadow-xl shadow-lg cursor-pointer'}`}
                                    disabled={!file}
                                    style={{ border: file ? '2px solid black' : 'none', backgroundColor: '#CFDDFC', cursor: file ? 'pointer' : 'not-allowed' }}
                                >
                                    {submitButtonText || "Submit"}
                                </button>
                            </div>}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreateChatbot;