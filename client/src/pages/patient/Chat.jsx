import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import { Send, Paperclip, User } from 'lucide-react';

const Chat = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            fetchMessages(selectedDoctor._id);
        }
    }, [selectedDoctor]);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/patient/doctors', { // Reuse doctor discovery
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(data.data.doctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchMessages = async (moduleId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get(`/api/chat/${moduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(data.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedDoctor) return;

        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/chat', {
                receiverId: selectedDoctor._id,
                message: newMessage,
                type: 'text'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages([...messages, data.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-64px)] bg-gray-50">
                {/* Contact List */}
                <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">Messages</h2>
                    </div>
                    {doctors.map(doctor => (
                        <div
                            key={doctor._id}
                            onClick={() => setSelectedDoctor(doctor)}
                            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition ${selectedDoctor?._id === doctor._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {doctor.name[0]}
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-800">{doctor.name}</h3>
                                <p className="text-xs text-gray-500">{doctor.specialization}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedDoctor ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {selectedDoctor.name[0]}
                                </div>
                                <h2 className="font-bold text-gray-800">{selectedDoctor.name}</h2>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-10">No messages yet. Start a conversation!</div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.senderId === selectedDoctor._id ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${msg.senderId === selectedDoctor._id
                                                    ? 'bg-white text-gray-800'
                                                    : 'bg-blue-600 text-white'
                                                }`}>
                                                <p>{msg.message}</p>
                                                <span className={`text-[10px] block mt-1 ${msg.senderId === selectedDoctor._id ? 'text-gray-400' : 'text-blue-100'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                                <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-gray-200 rounded-lg px-4 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <User size={64} className="mb-4 opacity-50" />
                            <p>Select a doctor to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Chat;
