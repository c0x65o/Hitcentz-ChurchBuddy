import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import SearchBar from '../SearchBar/SearchBar';

interface SidebarProps {
  /** Title for the sidebar (e.g., "Songs", "Sermons") */
  title: string;
  /** List of items to display and search */
  items: string[];
  /** Optional callback when an item is selected */
  onSelectItem?: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ title, items, onSelectItem }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = items.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  const handleItemClick = (item: string) => {
    onSelectItem?.(item);
  };

  return (
    <>
      <button
        className={`${styles.toggle} ${collapsed ? styles.toggleCollapsed : ''}`}
        onClick={() => setCollapsed((prev) => !prev)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span>{collapsed ? '»' : '«'}</span>
        <span className={styles.tabLabel}>Library</span>
      </button>

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
      >
      {!collapsed && (
        <div className={styles.content}>
          <div className={styles.title}>{title}</div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={`Search ${title.toLowerCase()}...`}
          />
          <ul className={styles.list}>
            {filtered.map((item) => (
              <li 
                key={item} 
                className={styles.item}
                onClick={() => handleItemClick(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
    </>
  );
};

export default Sidebar; 