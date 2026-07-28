import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function GoogleSignInButton() {
    const buttonRef = useRef(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!window.google || !buttonRef.current) return;

        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google`, {
                        credential: response.credential
                    });
                    login(res.data.user, res.data.token);
                    navigate('/');
                } catch (err) {
                    console.error('Google sign-in failed:', err);
                    alert('Google sign-in failed. Please try again.');
                }
            }
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            text: 'continue_with'
        });
    }, [login, navigate]);

    return <div ref={buttonRef} />;
}

export default GoogleSignInButton;
