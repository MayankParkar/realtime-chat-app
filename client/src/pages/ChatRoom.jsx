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
        <div style={styles.page}>
        <Sidebar selectedRoomId={selectedRoomId} onSelectRoom={setSelectedRoomId} />

        <div style={styles.main}>
        <div style={styles.header}>
        <div style={styles.headerLeft}>
        <span
        style={{
            ...styles.statusDot,
            background: connected ? 'var(--success)' : 'var(--danger)'
        }}
        />
        <span style={styles.headerText}>{user.username}</span>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Log Out</button>
        </div>

        {selectedRoomId ? (
            <>
            <MessageList messages={messages} />
            <div style={styles.typingArea}>
            {typingUsers.length > 0 && 'Someone is typing...'}
            </div>
            <MessageInput
            onSend={handleSend}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            />
            </>
        ) : (
            <div style={styles.emptyState}>Select a room to start chatting</div>
        )}
        </div>
        </div>
    );
}

const styles = {
    page: {
        display: 'flex',
        height: '100vh',
        background: 'var(--bg-primary)'
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
    },
    header: {
        padding: '0.9rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-secondary)'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    statusDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%'
    },
    headerText: {
        fontSize: '0.9rem',
        fontWeight: 600
    },
    logoutBtn: {
        background: 'transparent',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.4rem 0.85rem',
        fontSize: '0.8rem'
    },
    typingArea: {
        minHeight: '1.5rem',
        padding: '0 1.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        fontStyle: 'italic'
    },
    emptyState: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
    }
};


export default ChatRoom;
