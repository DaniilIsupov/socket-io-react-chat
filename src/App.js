import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

import './App.css';

function App() {
    const [userName, setUserName] = useState(null);
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const messagesRef = useRef(null)

    // mount
    useEffect(() => {
        const user_name = localStorage.getItem('user_name');
        if (user_name) {
            setUserName(user_name);
        }

        // returned function will be called on component unmount 
        return () => { }
    }, [])

    // after change userName
    useEffect(() => {
        if (userName && !socket) {
            setSocket(io('http://localhost:3000', { query: `user_name=${userName}` }));
        }
    }, [userName]);

    // after socket connect
    useEffect(() => {
        if (socket) {
            socket.on('connect', () => {
                console.log('connect');
            });
            socket.on('disconnect', () => {
                console.log('disconnect');
            });
            socket.on('chat_message', (opts) => {
                setMessages(m => [...m, { type: 'chat_message', date: new Date(), user: opts.user, msg: opts.msg }]);
            });
            socket.on('user_connected', (opts) => {
                setMessages(m => [...m, { type: 'user_connected', date: new Date(), msg: `User "${opts.user}" connected` }]);
            });
            socket.on('user_disconnected', (opts) => {
                setMessages(m => [...m, { type: 'user_disconnected', date: new Date(), msg: `User "${opts.user}" disconnected` }]);
            });
        }
    }, [socket]);

    // scroll to last message
    useEffect(() => {
        if (messagesRef.current) {
            const messageList = messagesRef.current;
            const scrollHeight = messageList.scrollHeight;
            const height = messageList.clientHeight;
            const maxScrollTop = scrollHeight - height;
            messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
        }
    }, [messages]);

    const getMessageContent = (message) => {
        switch (message.type) {
            case 'chat_message':
                return `[${new Date(message.date).toLocaleString()}] ${message.user}: ${message.msg}`;
            case 'user_connected':
                return `[${new Date(message.date).toLocaleString()}] ${message.msg}`;
            case 'user_disconnected':
                return `[${new Date(message.date).toLocaleString()}] ${message.msg}`;
            default:
                return ``;
        }

    }

    return (
        <div className="App">
            <h1>Socket IO Chat</h1>

            {userName &&
                <div className="chat-wrapper">
                    <div className="messages" ref={messagesRef}>
                        {
                            messages.map((message, i) => (
                                <p key={i} className={[message.self ? "bold" : null, message.type === 'chat_message' ? "left" : "center"].join(' ')}>
                                    {getMessageContent(message)}
                                </p>
                            ))
                        }
                    </div>
                    <div className="actions">
                        <form
                            onSubmit={event => {
                                event.preventDefault();
                                const msg = event.target.elements.msg.value;
                                socket.emit('chat_message', msg);
                                event.target.reset();
                                setMessages(m => [...m, { type: 'chat_message', date: new Date(), user: userName, msg: msg, self: true }]);
                            }}
                        >
                            <input
                                type="text"
                                name="msg"
                                placeholder="Please enter message"
                                minLength={1}
                            />
                            <button type="submit">Send</button>
                        </form>
                    </div>
                </div>
            }

            {!userName &&
                <div className="change-name">
                    <form
                        onSubmit={event => {
                            event.preventDefault();
                            const newUserName = event.target.elements.user_name.value;
                            setUserName(newUserName);
                            localStorage.setItem('user_name', newUserName);
                        }}
                    >
                        <input
                            type="text"
                            name="user_name"
                            placeholder="Please enter your username"
                            minLength={4}
                        />
                        <button type="submit">Save</button>
                    </form>
                </div>
            }

        </div>
    );
}

export default App;
