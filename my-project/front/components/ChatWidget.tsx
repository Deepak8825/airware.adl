import React, { useState } from 'react';

const MessageSender = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const baseUrl = 'http://localhost:3000';

  const sendMessage = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Message sent successfully:', data);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again later.');
    }
  };

  return (
    <div>
      <h1>Send a Message</h1>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
      />
      <button onClick={sendMessage}>Send Message</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default MessageSender;