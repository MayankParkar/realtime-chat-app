import { useState, useRef } from 'react';

function MessageInput({ onSend, onTypingStart, onTypingStop }) {
    const [content, setContent] = useState('');
    const typingTimeoutRef = useRef(null);

    const handleChange = (e) => {
        setContent(e.target.value);

        // Fire typing-start on the first keystroke of a burst
        if (!typingTimeoutRef.current) {
            onTypingStart();
        } else {
            clearTimeout(typingTimeoutRef.current);
        }

        // Reset the "stop typing" timer on every keystroke
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

        // Sending clears any pending typing state immediately
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            onTypingStop();
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid #333' }}>
        <input
        type="text"
        value={content}
        onChange={handleChange}
        placeholder="Type a message..."
        style={{ flex: 1, marginRight: '0.5rem' }}
        />
        <button type="submit">Send</button>
        </form>
    );
}

export default MessageInput;
