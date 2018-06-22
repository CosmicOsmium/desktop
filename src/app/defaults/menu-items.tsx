import React from 'react';

import { NavigationDrawerItems } from '../enums';

import TabGroups from '../../menu/tabGroups/components/TabGroups';
import History from '../../menu/history/components/History';
import About from '../../menu/about/components/About';

import HistoryStore from '../../menu/history/store';

import db from '../../shared/models/app-database';

const tabGroupsIcon = require('../../shared/icons/tab-groups.svg');
const tabGroupsAddIcon = require('../../shared/icons/add.svg');
const tabGroupsLoadIcon = require('../../shared/icons/load.svg');
const tabGroupsSaveIcon = require('../../shared/icons/save.svg');
const historyIcon = require('../../shared/icons/history.svg');
const clearIcon = require('../../shared/icons/clear.svg');
const bookmarksIcon = require('../../shared/icons/bookmarks.svg');
const settingsIcon = require('../../shared/icons/settings.svg');
const extensionsIcon = require('../../shared/icons/extensions.svg');
const aboutIcon = require('../../shared/icons/info.svg');
const selectAllIcon = require('../../shared/icons/select-all.svg');
const closeIcon = require('../../shared/icons/close.svg');
const trashIcon = require('../../shared/icons/delete.svg');

const history = {
  onSelectAllClick: () => {
    const { selectedItems, sections } = HistoryStore;
    for (const section of sections) {
      for (const item of section.items) {
        item.selected = true;
        selectedItems.push(item);
      }
    }
  },
  onDeselectAllClick: () => {
    const { selectedItems } = HistoryStore;
    for (let i = selectedItems.length - 1; i >= 0; i--) {
      selectedItems[i].selected = false;
      selectedItems.splice(i, 1);
    }
  },
  onDeleteSelectedClick: () => {
    const { selectedItems, sections } = HistoryStore;
    for (let i = selectedItems.length - 1; i >= 0; i--) {
      const selectedItem = selectedItems[i];
      for (let j = sections.length - 1; j >= 0; j--) {
        const section = sections[j];
        const item = section.items.find(x => x.id === selectedItem.id);

        if (item) {
          section.items.splice(section.items.indexOf(item), 1);

          if (section.items.length === 0) {
            sections.splice(j, 1);
          }

          db.history.delete(item.id);

          break;
        }
      }
      selectedItems.splice(i, 1);
    }
  },
};

export default [
  {
    type: NavigationDrawerItems.TabGroups,
    label: 'Tab groups',
    icon: tabGroupsIcon,
    content: <TabGroups />,
    searchVisible: false,
    subItems: [
      {
        label: 'New group',
        icon: tabGroupsAddIcon,
      },
      {
        label: 'Load',
        icon: tabGroupsLoadIcon,
      },
      {
        label: 'Save',
        icon: tabGroupsSaveIcon,
      },
    ],
  },
  {
    type: NavigationDrawerItems.History,
    label: 'History',
    icon: historyIcon,
    content: <History />,
    searchVisible: true,
    subItems: [
      {
        label: 'Clear browsing history',
        icon: clearIcon,
      },
      {
        label: 'Select all',
        icon: selectAllIcon,
        onClick: history.onSelectAllClick,
        visible: true,
      },
      {
        label: 'Deselect all',
        icon: closeIcon,
        onClick: history.onDeselectAllClick,
        visible: false,
      },
      {
        label: 'Remove selected items',
        icon: trashIcon,
        onClick: history.onDeleteSelectedClick,
        visible: false,
      },
    ],
  },
  {
    type: NavigationDrawerItems.Bookmarks,
    label: 'Bookmarks',
    icon: bookmarksIcon,
    content: null,
    searchVisible: false,
    subItems: [],
  },
  {
    type: NavigationDrawerItems.Settings,
    label: 'Settings',
    icon: settingsIcon,
    content: null,
    searchVisible: false,
    subItems: [],
  },
  {
    type: NavigationDrawerItems.Extensions,
    label: 'Extensions',
    icon: extensionsIcon,
    content: null,
    searchVisible: false,
    subItems: [],
  },
  {
    type: NavigationDrawerItems.About,
    label: 'About',
    icon: aboutIcon,
    content: <About />,
    searchVisible: false,
    subItems: [],
  },
];
