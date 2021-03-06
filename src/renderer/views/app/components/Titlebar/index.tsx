import { observer } from 'mobx-react-lite';
import * as React from 'react';
import { ipcRenderer, remote } from 'electron';

import store from '../../store';
import { Tabbar } from '../Tabbar';
import { platform } from 'os';
import { WindowsControls } from 'react-windows-controls';
import { StyledTitlebar, FullscreenExitButton } from './style';
import { NavigationButtons } from '../NavigationButtons';
import { RightButtons } from '../RightButtons';
import { Separator } from '../RightButtons/style';
import { SiteButtons } from '../SiteButtons';

const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
  if (store.addressbarFocused) {
    e.preventDefault();
  }
};

const onCloseClick = () => browser.windows.remove(store.windowId);

const onMaximizeClick = async () => {
  const window = await browser.windows.getCurrent();
  browser.windows.update(window.id, {
    state: window.state === 'maximized' ? 'normal' : 'maximized',
  });
};

const onMinimizeClick = () =>
  browser.windows.update(store.windowId, { state: 'minimized' });

const onFullscreenExit = (e: React.MouseEvent<HTMLDivElement>) => {
  remote.getCurrentWindow().setFullScreen(false);
};

export const Titlebar = observer(() => {
  return (
    <StyledTitlebar
      onMouseDown={onMouseDown}
      isFullscreen={store.isFullscreen}
      isHTMLFullscreen={store.isHTMLFullscreen}
    >
      {/* {store.isCompact && <NavigationButtons />} */}
      <Tabbar />
      {/* {store.isCompact && <RightButtons />} */}

      {platform() !== 'darwin' && (
        <WindowsControls
          style={{
            // height: store.isCompact ? '100%' : 32,
            height: 32,
            WebkitAppRegion: 'no-drag',
            marginLeft: 8,
          }}
          onClose={onCloseClick}
          onMinimize={onMinimizeClick}
          onMaximize={onMaximizeClick}
          // dark={store.theme['toolbar.lightForeground']}
        />
        store.isFullscreen
          ? <FullscreenExitButton
            style={{
              height: store.isCompact ? '100%' : 32,
            }}
            onMouseUp={onFullscreenExit}
            theme={store.theme}
          />
          : <WindowsControls
            style={{
              height: store.isCompact ? '100%' : 32,
              WebkitAppRegion: 'no-drag',
              marginLeft: 8,
            }}
            onClose={onCloseClick}
            onMinimize={onMinimizeClick}
            onMaximize={onMaximizeClick}
            dark={store.theme['toolbar.lightForeground']}
          />
      )}
    </StyledTitlebar>
  );
});
