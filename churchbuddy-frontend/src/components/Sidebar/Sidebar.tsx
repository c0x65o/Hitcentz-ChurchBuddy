import React, { useState, useMemo } from 'react';
import styles from './Sidebar.module.css';
import SearchBar from '../SearchBar/SearchBar';

interface SidebarProps {
  /** Current active module */
  activeModule: 'presentation' | 'songs' | 'sermons' | 'asset-decks';
  /** Optional callback when an item is selected */
  onSelectItem?: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectItem }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  // Module-specific data
  const moduleData = useMemo(() => {
    switch (activeModule) {
      case 'songs':
        return {
          title: 'Songs',
          items: [
            'Amazing Grace',
            'How Great Thou Art',
            'It Is Well',
            'Great Is Thy Faithfulness',
            'What A Friend We Have In Jesus',
            'Holy Holy Holy',
            'Blessed Assurance',
            'When I Survey The Wondrous Cross'
          ],
          placeholder: 'Search songs...'
        };
      case 'sermons':
        return {
          title: 'Sermons',
          items: [
            'The Good Shepherd',
            'Walking in Faith',
            'Grace and Mercy',
            'Love One Another',
            'The Great Commission',
            'Forgiveness',
            'Hope in Christ',
            'Living Water'
          ],
          placeholder: 'Search sermons...'
        };
      case 'asset-decks':
        return {
          title: 'Asset Decks',
          items: [
            'Christmas Collection',
            'Easter Slides',
            'Worship Backgrounds',
            'Scripture Verses',
            'Announcement Templates',
            'Youth Ministry',
            'Children\'s Church',
            'Holiday Graphics'
          ],
          placeholder: 'Search asset decks...',
        };
      default:
        return {
          title: '',
          items: [],
          placeholder: 'Search...'
        };
    }
  }, [activeModule]);

  const filtered = moduleData.items.filter((item) =>
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
          <div className={styles.title}>{moduleData.title}</div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={moduleData.placeholder}
          />
          <button className={styles.makeNewButton}>
            + Make New
          </button>
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