import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

function ChatRoom() {
    const { socket, connected } = useSocket();
    const { user, logout } = useAuth();

    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    // Load message history whenever the selected room changes,
    // and tell the server (via socket) we're now watching this room
    useEffect(() => {
        if (!selectedRoomId || !socket) return;

        setMessages([]);
        setTypingUsers([]);

        api.get(`/rooms/${selectedRoomId}/messages`)
        .then((res) => setMessages(res.data.messages))
        .catch((err) => console.error('Failed to load messages:', err));

        socket.emit('join-room', selectedRoomId);
    }, [selectedRoomId, socket]);

    // Listen for incoming real-time events — set up once when the socket exists
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            // Only append if it belongs to the room currently being viewed
            setMessages((prev) => {
                if (message.room_id !== selectedRoomId) return prev;
                return [...prev, message];
            });
        };

        const handleUserTyping = ({ userId, roomId }) => {
            if (roomId !== selectedRoomId) return;
            setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        };

        const handleUserStoppedTyping = ({ userId, roomId }) => {
            if (roomId !== selectedRoomId) return;
            setTypingUsers((prev) => prev.filter((id) => id !== userId));
        };

        socket.on('receive-message', handleReceiveMessage);
        socket.on('user-typing', handleUserTyping);
        socket.on('user-stopped-typing', handleUserStoppedTyping);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
            socket.off('user-typing', handleUserTyping);
            socket.off('user-stopped-typing', handleUserStoppedTyping);
        };
    }, [socket, selectedRoomId]);

    const handleSend = useCallback(
        (content) => {
            if (!socket || !selectedRoomId) return;
            socket.emit('send-message', { roomId: selectedRoomId, content });
        },
        [socket, selectedRoomId]
    );

    const handleTypingStart = useCallback(() => {
        if (!socket || !selectedRoomId) return;
        socket.emit('typing-start', { roomId: selectedRoomId });
    }, [socket, selectedRoomId]);

    const handleTypingStop = useCallback(() => {
        if (!socket || !selectedRoomId) return;
        socket.emit('typing-stop', { roomId: selectedRoomId });
    }, [socket, selectedRoomId]);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar selectedRoomId={selectedRoomId} onSelectRoom={setSelectedRoomId} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
        <span>{connected ? '🟢 Connected' : '🔴 Disconnected'} — {user.username}</span>
        <button onClick={logout}>Log Out</button>
        </div>

        {selectedRoomId ? (
            <>
            <MessageList messages={messages} />
            {typingUsers.length > 0 && (
                <div style={{ padding: '0 1rem', fontSize: '0.8rem', color: '#888' }}>
                Someone is typing...
                </div>
            )}
            <MessageInput
            onSend={handleSend}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            />
            </>
        ) : (
            <div style={{ padding: '2rem', color: '#888' }}>Select a room to start chatting</div>
        )}
        </div>
        </div>
    );
}

export default ChatRoom;
