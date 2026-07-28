import { useState, useRef } from 'react';

function MessageInput({ onSend, onTypingStart, onTypingStop }) {
    const [content, setContent] = useState('');
    const typingTimeoutRef = useRef(null);

    const handleChange = (e) => {
        setContent(e.target.value);

        if (!typingTimeoutRef.current) {
            onTypingStart();
        } else {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            onTypingStop();
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        onSend(content);
        setContent('');

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            onTypingStop();
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
        <input
        type="text"
        value={content}
        onChange={handleChange}
        placeholder="Type a message..."
        style={styles.input}
        />
        <button type="submit" style={styles.sendBtn}>Send</button>
        </form>
    );
}

const styles = {
    form: {
        display: 'flex',
        gap: '0.6rem',
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
    },
    input: {
        flex: 1,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 1rem',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        outline: 'none'
    },
    sendBtn: {
        background: 'var(--accent)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 1.25rem',
        fontWeight: 600,
        fontSize: '0.9rem'
    }
};

export default MessageInput;
