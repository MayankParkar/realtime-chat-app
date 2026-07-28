import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

function MessageList({ messages }) {
    const { user } = useAuth();
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.map((msg) => {
            const isOwnMessage = msg.sender_id === user.id;
            return (
                <div
                key={msg.id}
                style={{
                    marginBottom: '0.75rem',
                    textAlign: isOwnMessage ? 'right' : 'left'
                }}
                >
                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                {msg.sender_username || 'Deleted User'}
                </div>
                <div
                style={{
                    display: 'inline-block',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: isOwnMessage ? '#2b5278' : '#333',
                    maxWidth: '70%'
                }}
                >
                {msg.content}
                </div>
                </div>
            );
        })}
        <div ref={bottomRef} />
        </div>
    );
}

export default MessageList;
