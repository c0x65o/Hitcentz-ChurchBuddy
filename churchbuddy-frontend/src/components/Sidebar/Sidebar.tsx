import React, { useState, useMemo } from 'react';
import styles from './Sidebar.module.css';
import SearchBar from '../SearchBar/SearchBar';
import { ISong } from '../../types/ISong';
import { ISermon } from '../../types/ISermon';

interface SidebarProps {
  /** Current active module */
  activeModule: 'presentation' | 'songs' | 'sermons' | 'asset-decks';
  /** Optional callback when an item is selected */
  onSelectItem?: (item: string) => void;
  /** Optional callback when Make New is clicked */
  onMakeNew?: () => void;
  /** Optional callback when an item is deleted */
  onDeleteItem?: (item: string) => void;
  /** Optional callback when background is selected for an item */
  onSelectBackground?: (item: string) => void;
  /** Optional callback when background is removed from an item */
  onRemoveBackground?: (item: string) => void;
  /** Optional custom songs list to override default */
  customSongsList?: ISong[];
  /** Optional custom sermons list to override default */
  customSermonsList?: ISermon[];
  /** Optional list of items that have backgrounds set */
  itemsWithBackgrounds?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, 
  onSelectItem, 
  onMakeNew, 
  onDeleteItem,
  onSelectBackground,
  onRemoveBackground,
  customSongsList,
  customSermonsList,
  itemsWithBackgrounds = []
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Module-specific data
  const moduleData = useMemo(() => {
    switch (activeModule) {
      case 'songs':
        return {
          title: 'Songs',
          items: customSongsList ? customSongsList : [
            { id: 'default-1', title: 'Amazing Grace' },
            { id: 'default-2', title: 'How Great Thou Art' },
            { id: 'default-3', title: 'It Is Well' },
            { id: 'default-4', title: 'Great Is Thy Faithfulness' },
            { id: 'default-5', title: 'What A Friend We Have In Jesus' },
            { id: 'default-6', title: 'Holy Holy Holy' },
            { id: 'default-7', title: 'Blessed Assurance' },
            { id: 'default-8', title: 'When I Survey The Wondrous Cross' }
          ],
          placeholder: 'Search songs...'
        };
      case 'sermons':
        return {
          title: 'Sermons',
          items: customSermonsList ? customSermonsList : [
            { id: 'default-1', title: 'The Good Shepherd' },
            { id: 'default-2', title: 'Walking in Faith' },
            { id: 'default-3', title: 'Grace and Mercy' },
            { id: 'default-4', title: 'Love One Another' },
            { id: 'default-5', title: 'The Great Commission' },
            { id: 'default-6', title: 'Forgiveness' },
            { id: 'default-7', title: 'Hope in Christ' },
            { id: 'default-8', title: 'Living Water' }
          ],
          placeholder: 'Search sermons...'
        };
      case 'asset-decks':
        return {
          title: 'Asset Decks',
          items: [
            { id: 'asset-1', title: 'Christmas Collection' },
            { id: 'asset-2', title: 'Easter Slides' },
            { id: 'asset-3', title: 'Worship Backgrounds' },
            { id: 'asset-4', title: 'Scripture Verses' },
            { id: 'asset-5', title: 'Announcement Templates' },
            { id: 'asset-6', title: 'Youth Ministry' },
            { id: 'asset-7', title: 'Children\'s Church' },
            { id: 'asset-8', title: 'Holiday Graphics' }
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
  }, [activeModule, customSongsList, customSermonsList]);

  const filtered = moduleData.items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleItemClick = (item: any) => {
    onSelectItem?.(item.title);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    onDeleteItem?.(item.title);
  };

  const handleBackgroundClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const hasBackground = itemsWithBackgrounds.includes(item.title);
    if (hasBackground) {
      onRemoveBackground?.(item.title);
    } else {
      onSelectBackground?.(item.title);
    }
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
          <button className={styles.makeNewButton} onClick={onMakeNew}>
            + Make New
          </button>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={moduleData.placeholder}
          />
          <ul className={styles.list}>
            {filtered.map((item) => (
              <li 
                key={item.id} 
                className={styles.item}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span className={styles.itemText}>{item.title}</span>
                {hoveredItem === item.title && (
                  <div className={styles.hoverIcons}>
                    <button
                      className={styles.iconButton}
                      onClick={(e) => handleBackgroundClick(e, item)}
                      title={itemsWithBackgrounds.includes(item.title) ? 'Remove background' : 'Add background'}
                    >
                      {itemsWithBackgrounds.includes(item.title) ? '❌' : '🖼️'}
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={(e) => handleDeleteClick(e, item)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
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