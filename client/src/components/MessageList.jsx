import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../hooks/usePresence';

function PresenceDot({ userId }) {
    const online = usePresence(userId);
    return (
        <span
        style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: online ? 'var(--success)' : 'var(--text-muted)',
            marginRight: '5px'
        }}
        title={online ? 'Online' : 'Offline'}
        />
    );
}

function MessageList({ messages }) {
    const { user } = useAuth();
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div style={styles.container}>
        {messages.map((msg) => {
            const isOwnMessage = msg.sender_id === user.id;
            return (
                <div
                key={msg.id}
                style={{
                    ...styles.row,
                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                }}
                >
                <div style={{ maxWidth: '65%' }}>
                <div
                style={{
                    ...styles.sender,
                    textAlign: isOwnMessage ? 'right' : 'left'
                }}
                >
                {!isOwnMessage && msg.sender_id && <PresenceDot userId={msg.sender_id} />}
                {msg.sender_username || 'Deleted User'}
                </div>
                <div
                style={{
                    ...styles.bubble,
                    ...(isOwnMessage ? styles.bubbleOwn : styles.bubbleOther)
                }}
                >
                {msg.content}
                </div>
                </div>
                </div>
            );
        })}
        <div ref={bottomRef} />
        </div>
    );
}

const styles = {
    container: {
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem'
    },
    row: {
        display: 'flex',
        width: '100%'
    },
    sender: {
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        marginBottom: '0.25rem',
        display: 'flex',
        alignItems: 'center'
    },
    bubble: {
        padding: '0.55rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem',
        lineHeight: 1.4,
        wordBreak: 'break-word'
    },
    bubbleOwn: {
        background: 'var(--accent)',
        color: 'white',
        borderBottomRightRadius: '4px'
    },
    bubbleOther: {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        borderBottomLeftRadius: '4px'
    }
};

export default MessageList;
