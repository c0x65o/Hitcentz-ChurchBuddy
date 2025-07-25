import React, { useState } from 'react';
import styles from './BulletinOverlay.module.css';
import { IBulletinMessage } from '../../types/IBulletinMessage';

interface BulletinOverlayProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: IBulletinMessage[];
  onAddMessage: (name: string, messageText: string, messageTitle?: string) => void;
  onLoadMore: () => void;
  hasMoreMessages: boolean;
}

const BulletinOverlay: React.FC<BulletinOverlayProps> = ({
  isOpen,
  onToggle,
  messages,
  onAddMessage,
  onLoadMore,
  hasMoreMessages,
}) => {
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');

  const handleSubmit = () => {
    if (name.trim() && messageText.trim()) {
      onAddMessage(name, messageText);
      setName('');
      setMessageText('');
    } else {
      alert('Please enter your name and message.');
    }
  };

  return (
    <div className={styles.bulletinOverlayContainer}>
      {!isOpen && (
        <button className={styles.reopenButton} onClick={onToggle}>
          💬
        </button>
      )}
      {isOpen && (
        <div className={styles.bulletinPopout}>
          <button className={styles.closeButton} onClick={onToggle}>
            ✖
          </button>
          <div className={styles.messagesContainer}>
            {messages.length > 0 ? (
              <div className={styles.messagesList}>
                {messages.map((msg) => (
                  <div key={msg.id} className={styles.bulletinMessage}>
                    <div className={styles.messageHeader}>
                      <span className={styles.messageName}>{msg.name}</span>
                      {msg.messageTitle && <span className={styles.messageTitle}>{msg.messageTitle}</span>}
                      <span className={styles.messageTimestamp}>{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className={styles.messageText}>{msg.messageText}</p>
                  </div>
                ))}
                {hasMoreMessages && (
                  <button onClick={onLoadMore} className={styles.loadMoreButton}>
                    Load More
                  </button>
                )}
              </div>
            ) : (
              <p className={styles.noMessages}>No bulletins yet...</p>
            )}
          </div>
          <div className={styles.createBulletinForm}>
            <h4>Create New Bulletin</h4>
            <div className={styles.nameAndSendRow}>
              <input
                type="text"
                placeholder="Your Name"
                className={styles.nameInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button className={styles.sendButton} onClick={handleSubmit}>Send</button>
            </div>
            <textarea
              placeholder="Your message..."
              className={styles.messageInput}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            ></textarea>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulletinOverlay; 