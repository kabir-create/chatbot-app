import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useUserId } from '@nhost/react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

const GET_CHATS = gql`
  query GetChats($userId: uuid!) {
    chats(where: { user_id: { _eq: $userId } }, order_by: { updated_at: desc }) {
      id
      title
      created_at
      updated_at
      messages(limit: 1, order_by: { created_at: desc }) {
        content
        is_bot
      }
    }
  }
`;

const CREATE_CHAT = gql`
  mutation CreateChat($title: String!, $userId: uuid!) {
    insert_chats_one(object: { title: $title, user_id: $userId }) {
      id
      title
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

export function ChatList({ selectedChatId, onSelectChat }) {
  const userId = useUserId();

  // ✅ skip query if userId is not ready
  const { data, loading, error, refetch } = useQuery(GET_CHATS, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network', // 👈 makes list refresh quickly
  });

  const [createChat] = useMutation(CREATE_CHAT);
  const [deleteChat] = useMutation(DELETE_CHAT);

  const handleCreateChat = async () => {
    if (!userId) return; // 👈 guard
    try {
      const title = `Chat ${new Date().toLocaleString()}`;
      const { data: newChatData } = await createChat({
        variables: { title, userId },
      });

      if (newChatData?.insert_chats_one) {
        onSelectChat(newChatData.insert_chats_one.id);
        refetch();
      }
    } catch (err) {
      console.error('Error creating chat:', err);
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
    }
  };

  if (!userId) return <div className="chat-list loading">Loading user...</div>;
  if (loading) return <div className="chat-list loading">Loading chats...</div>;
  if (error) return <div className="chat-list error">Error loading chats</div>;

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <button onClick={handleCreateChat} className="new-chat-button">
          <Plus size={20} />
          New Chat
        </button>
      </div>

      <div className="chat-list-items">
        {data?.chats?.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="chat-item-content">
              <div className="chat-item-header">
                <MessageSquare size={16} />
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

        {(!data?.chats || data.chats.length === 0) && (
          <div className="empty-state">
            <MessageSquare size={48} />
            <p>No chats yet</p>
            <p>Create a new chat to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
