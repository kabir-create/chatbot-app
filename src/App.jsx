import React, { useState } from 'react';
import { NhostProvider, useAuthenticationStatus, useSignInEmailPassword, useSignUpEmailPassword, useSignOut, useUserId, useUserData } from '@nhost/react';
import { ApolloProvider, useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { nhost } from './lib/nhost';
import { apolloClient } from './lib/apollo';
import { MessageCircle, Plus, Send, Bot, User, LogOut, Trash2 } from 'lucide-react';
import './App.css';

// GraphQL Queries and Mutations
const GET_CHATS = gql`
  query GetChats($userId: uuid!) {
    chats(where: {user_id: {_eq: $userId}}, order_by: {updated_at: desc}) {
      id
      title
      created_at
      updated_at
      messages(limit: 1, order_by: {created_at: desc}) {
        content
        is_bot
      }
    }
  }
`;

const MESSAGES_SUBSCRIPTION = gql`
  subscription MessagesSubscription($chatId: uuid!) {
    messages(where: {chat_id: {_eq: $chatId}}, order_by: {created_at: asc}) {
      id
      content
      is_bot
      created_at
    }
  }
`;

const CREATE_CHAT = gql`
 mutation CreateChat($title: String!) {
  insert_chats_one(object: { title: $title }) {
    id
    title
    created_at
    user_id
  }
}

`;

const INSERT_MESSAGE = gql`
  mutation InsertMessage($chatId: uuid!, $content: String!, $isBot: Boolean!) {
    insert_messages_one(object: {chat_id: $chatId, content: $content, is_bot: $isBot}) {
      id
      content
      is_bot
      created_at
    }
  }
`;

const DELETE_CHAT = gql`
  mutation DeleteChat($chatId: uuid!) {
    delete_chats_by_pk(id: $chatId) {
      id
    }
  }
`;

const SEND_MESSAGE_ACTION = gql`
  mutation SendMessage($chatId: uuid!, $content: String!) {
    sendMessage(chatId: $chatId, content: $content) {
      success
      message
      response
    }
  }
`;

// Authentication Form Component
function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { signInEmailPassword, isLoading: isSigningIn, error: signInError } = useSignInEmailPassword();
  const { signUpEmailPassword, isLoading: isSigningUp, error: signUpError } = useSignUpEmailPassword();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignUp) {
      await signUpEmailPassword(email, password, {
        displayName: `${firstName} ${lastName}`,
        metadata: { firstName, lastName }
      });
    } else {
      await signInEmailPassword(email, password);
    }
  };

  const error = signInError || signUpError;
  const isLoading = isSigningIn || isSigningUp;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🤖 Chatbot App</h1>
          <p>{isSignUp ? 'Create your account' : 'Sign in to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="auth-input"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="auth-input"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="auth-input"
          />

          {error && (
            <div className="error-message">
              {error.message}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="switch-button"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Chat List Component
function ChatList({ selectedChatId, onSelectChat }) {
  const { user } = useUserData();;
  console.log('Tanish:', user); // Debug log
  const userId = useUserId() || user?.id; // Fixed: Added fallback to user?.id

  console.log('ChatList - userId:', userId); // Debug log

  const { data, loading, error, refetch } = useQuery(GET_CHATS, {
    variables: { userId },
    skip: !userId, // Skip query when userId is undefined
    errorPolicy: 'all'
  });

  const [createChat] = useMutation(CREATE_CHAT, {
    errorPolicy: 'all'
  });
  const [deleteChat] = useMutation(DELETE_CHAT, {
    errorPolicy: 'all'
  });

const handleCreateChat = async () => {
  if (!userId) {
    console.error('Cannot create chat: userId is undefined');
    alert('Cannot create chat: User ID is missing');
    return;
  }

  try {
    const title = `Chat ${new Date().toLocaleString()}`;
    
    const { data: newChatData, error: gqlError } = await createChat({
      variables: { userId, title }
    });

    if (gqlError) {
      console.error('GraphQL Error:', gqlError);
      throw new Error(gqlError.message);
    }

    if (!newChatData?.insert_chats_one) {
      throw new Error('No chat data returned from server');
    }

    console.log('Chat created successfully:', newChatData.insert_chats_one);
    onSelectChat(newChatData.insert_chats_one.id);
    await refetch();
    
  } catch (err) {
    console.error('Error creating chat:', err);
    alert(`Error creating chat: ${err.message}`);
  }
};

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await deleteChat({ variables: { chatId } });
      if (selectedChatId === chatId) {
        onSelectChat(null);
      }
      refetch();
    } catch (err) {
      console.error('Error deleting chat:', err);
      alert(`Error deleting chat: ${err.message}`);
    }
  };

  if (!userId) {
    return (
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Chats</h2>
          <button disabled className="new-chat-button">
            <Plus size={20} />
            Loading...
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Loading user data...
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <button onClick={handleCreateChat} className="new-chat-button">
          <Plus size={20} />
          New Chat
        </button>
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Loading chats...
        </div>
      )}

      {error && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '1rem',
          margin: '1rem',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>🔧 Debug Info:</h4>
          <div>
            <strong>GraphQL Error:</strong>
            <pre style={{ background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="chat-list-items">
        {data?.chats?.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="chat-item-content">
              <div className="chat-item-header">
                <MessageCircle size={16} />
                <span className="chat-title">{chat.title}</span>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="delete-chat-button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {chat.messages?.[0] && (
                <p className="chat-preview">
                  {chat.messages[0].is_bot ? '🤖 ' : '👤 '}
                  {chat.messages[0].content.slice(0, 50)}
                  {chat.messages[0].content.length > 50 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        ))}

        {data && (!data.chats || data.chats.length === 0) && (
          <div className="empty-state">
            <MessageCircle size={48} />
            <p>No chats yet</p>
            <p>Create a new chat to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Chat Window Component
function ChatWindow({ chatId }) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: messagesData, error: messagesError } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chatId },
    skip: !chatId,
    errorPolicy: 'all'
  });

  const [insertMessage] = useMutation(INSERT_MESSAGE, {
    errorPolicy: 'all'
  });

  const [sendMessageAction] = useMutation(SEND_MESSAGE_ACTION, {
    errorPolicy: 'all'
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending || !chatId) return;

    const userMessage = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      // First, insert the user message
      await insertMessage({
        variables: {
          chatId,
          content: userMessage,
          isBot: false
        }
      });

      // Then call the Hasura Action to trigger the chatbot
      console.log('Calling sendMessage action...');
      const { data: actionResult } = await sendMessageAction({
        variables: {
          chatId,
          content: userMessage
        }
      });

      console.log('Action result:', actionResult);

      if (actionResult?.sendMessage?.success) {
        console.log('✅ Chatbot response successful' , actionResult.sendMessage.response);
      } else {
        console.error('❌ Chatbot response failed:', actionResult?.sendMessage?.message);
        // Insert a fallback message if the action fails
        await insertMessage({
          variables: {
            chatId,
            content: "Sorry, I'm having trouble connecting to the AI service right now. Please try again later.",
            isBot: true
          }
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Error sending message: ${error.message}\n\nThis might be due to:\n1. Missing Hasura Action 'sendMessage'\n2. Incorrect permissions\n3. n8n webhook not configured\n\nCheck the debug info for details.`);
      
      // Insert a fallback message
      try {
        await insertMessage({
          variables: {
            chatId,
            content: `Error: ${error.message}. This is likely a configuration issue with the Hasura Action or n8n workflow.`,
            isBot: true
          }
        });
      } catch (fallbackError) {
        console.error('Even fallback message failed:', fallbackError);
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!chatId) {
    return (
      <div className="chat-window empty">
        <div className="empty-chat-state">
          <Bot size={64} />
          <h3>Select a chat or create a new one</h3>
          <p>Start a conversation with our AI chatbot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <Bot size={20} />
        <span>AI Chatbot (Hasura + n8n + OpenRouter)</span>
      </div>

      {messagesError && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '1rem',
          margin: '1rem',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>🔧 Messages Debug Info:</h4>
          <div>
            <strong>GraphQL Error:</strong>
            <pre style={{ background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(messagesError, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="messages-container">
        {messagesData?.messages?.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.is_bot ? 'bot-message' : 'user-message'}`}
          >
            <div className="message-avatar">
              {msg.is_bot ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content">
              <p>{msg.content}</p>
              <span className="message-time">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {isSending && (
          <div className="message bot-message">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="message-input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="message-input"
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

// Main Chat App Component
function ChatApp() {
  const { user } = useUserData();
  const { signOut } = useSignOut();
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Simple debug log
  console.log('ChatApp - user:', user);

  return (
    <div className="chat-app">
      <div className="app-header">
        <div className="header-left">
          <MessageCircle size={24} />
          <h1>Chatbot App</h1>
        </div>
        <div className="header-right">
          <span>Welcome, {user?.displayName || user?.email}</span>
          <button onClick={signOut} className="logout-button">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="chat-container">
        <ChatList 
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />
        <ChatWindow chatId={selectedChatId} />
      </div>
    </div>
  );
}

// Auth Guard Component
function AuthGuard({ children }) {
  const { isLoading, isAuthenticated } = useAuthenticationStatus();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return children;
}

// Main App Component
function App() {
  return (
    <NhostProvider nhost={nhost}>
      <ApolloProvider client={apolloClient}>
        <div className="App">
          <AuthGuard>
            <ChatApp />
          </AuthGuard>
        </div>
      </ApolloProvider>
    </NhostProvider>
  );
}

export default App;