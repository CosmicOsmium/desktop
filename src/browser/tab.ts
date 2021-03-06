import { BrowserView, app, ipcMain } from 'electron';
import { parse as parseUrl } from 'url';
import { getViewMenu } from './menus/view';
import { AppWindow } from './windows';
import { IHistoryItem, IBookmark } from '~/interfaces';
import { WEBUI_BASE_URL } from '~/constants/files';
import { NEWTAB_URL } from '~/constants/tabs';
import {
  ZOOM_FACTOR_MIN,
  ZOOM_FACTOR_MAX,
  ZOOM_FACTOR_INCREMENT,
} from '~/constants/web-contents';
import { TabEvent } from '~/interfaces/tabs';
import { Queue } from '~/utils/queue';
import { Application } from './application';
import { hookTabEvents } from './tab-events';
import { extensions } from './extensions';
import { ICON_WINDOW } from '~/renderer/constants';

interface IAuthInfo {
  url: string;
}

export class Tab {
  public browserView: BrowserView;

  public favicon = '';

  public errorURL = '';

  public bounds: any;

  public lastHistoryId: string;

  public bookmark: IBookmark;

  public findInfo = {
    occurrences: '0/0',
    text: '',
  };

  public requestedAuth: IAuthInfo;
  public requestedPermission: any;

  public windowId: number;

  private historyQueue = new Queue();

  private lastUrl = '';

  public constructor(session: Electron.Session, windowId: number) {
    this.windowId = windowId;

    this.browserView = new BrowserView({
      webPreferences: {
        //preload: `${app.getAppPath()}/build/view-preload.bundle.js`,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        enableRemoteModule: false,
        plugins: true,
        nativeWindowOpen: true,
        webSecurity: true,
        session,
        javascript: true,
      },
    });

    // USER-AGENT:
    this.webContents.userAgent = this.webContents.userAgent
      .replace(/ Wexond\\?.([^\s]+)/g, '')
      .replace(/ Electron\\?.([^\s]+)/g, '')
      .replace(/Chrome\\?.([^\s]+)/g, 'Chrome/80.0.3987.162');

    // TODO: sandbox
    // this.webContents.session.webRequest.onBeforeSendHeaders(
    //   (details, callback) => {
    //     const { object: settings } = Application.instance.settings;
    //     if (settings.doNotTrack) details.requestHeaders['DNT'] = '1';
    //     callback({ requestHeaders: details.requestHeaders });
    //   },
    // );

    ipcMain.handle(`get-error-url-${this.id}`, async (e) => {
      return this.errorURL;
    });

    this.browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false,
    });

    this.webContents.on('context-menu', (e, params) => {
      Application.instance.contextMenus.popup([
        {
          type: 'normal',
          title: 'New window',
          accelerator: 'Ctrl+N',
          icon: ICON_WINDOW,
        },
        {
          type: 'normal',
          title: 'New incognito window',
          accelerator: 'Ctrl+Shift+N',
        },
        {
          type: 'separator',
        },
        {
          type: 'normal',
          title: 'Submenu 1',
          submenu: [
            {
              type: 'normal',
              title: 'Test item 1',
            },
            {
              type: 'normal',
              title: 'Test item dsfdfsfsdfsd',
            },
            {
              type: 'normal',
              title: 'Test item 3',
            },
            {
              type: 'normal',
              title: 'Test item 4',
            },
            {
              type: 'normal',
              title: 'Test item 5',
            },
            {
              type: 'normal',
              title: 'Test item 6',
            },
            {
              type: 'normal',
              title: 'Test item 7',
            },
          ],
        },
        {
          type: 'normal',
          title: 'Submenu 2',
          submenu: [
            {
              type: 'normal',
              title: 'Test item',
              accelerator: 'Ctrl+S',
            },
            {
              type: 'normal',
              title: 'Test item',
              accelerator: 'Ctrl+S',
            },
            {
              type: 'normal',
              title: 'Test item',
              accelerator: 'Ctrl+S',
            },
            {
              type: 'normal',
              title: 'Test item',
              accelerator: 'Ctrl+S',
            },
          ],
        },
        {
          type: 'normal',
          title: 'Submenu 3',
          submenu: [
            {
              type: 'normal',
              title: 'Test item',
              accelerator: 'Ctrl+S',
            },
            {
              type: 'normal',
              title: 'Test item',
            },
            {
              type: 'normal',
              title: 'Sub menu',
              submenu: [
                {
                  type: 'normal',
                  title: 'Test',
                },
              ],
            },
          ],
        },
      ]);
    });
    
    hookTabEvents(this);
  }

  public get webContents() {
    return this.browserView.webContents;
  }

  public get url() {
    return this.webContents.getURL();
  }

  public get title() {
    return this.webContents.getTitle();
  }

  public get id() {
    return this.webContents.id;
  }

  public get isSelected() {
    return this.id === this.window.viewManager.selectedId;
  }

  public updateNavigationState() {
    if (this.browserView.isDestroyed()) return;

    if (this.window.viewManager.selectedId === this.id) {
      this.window.send('update-navigation-state', {
        canGoBack: this.webContents.canGoBack(),
        canGoForward: this.webContents.canGoForward(),
      });
    }
  }

  public destroy() {
    this.browserView.destroy();
    this.browserView = null;
  }

  public async updateCredentials() {
    if (!process.env.ENABLE_AUTOFILL || this.browserView.isDestroyed()) return;

    const item = await Application.instance.storage.findOne<any>({
      scope: 'formfill',
      query: {
        url: this.hostname,
      },
    });

    this.emitEvent('credentials', item != null);
  }

  public async addHistoryItem(url: string, inPage = false) {
    if (
      url !== this.lastUrl &&
      !url.startsWith(WEBUI_BASE_URL) &&
      !url.startsWith('wexond-error://') &&
      !this.incognito
    ) {
      const historyItem: IHistoryItem = {
        title: this.title,
        url,
        favicon: this.favicon,
        date: new Date().getTime(),
      };

      await this.historyQueue.enqueue(async () => {
        this.lastHistoryId = (
          await Application.instance.storage.insert<IHistoryItem>({
            scope: 'history',
            item: historyItem,
          })
        )._id;

        historyItem._id = this.lastHistoryId;

        Application.instance.storage.history.push(historyItem);
      });
    } else if (!inPage) {
      await this.historyQueue.enqueue(async () => {
        this.lastHistoryId = '';
      });
    }
  }

  public updateURL = (url: string) => {
    this.emitEvent('url-updated', url);

    if (this.lastUrl === url) return;

    this.lastUrl = url;

    this.updateData();

    if (process.env.ENABLE_AUTOFILL) this.updateCredentials();

    this.updateBookmark();
  };

  public updateBookmark() {
    this.bookmark = Application.instance.storage.bookmarks.find(
      (x) => x.url === this.url,
    );

    if (!this.isSelected) return;

    this.window.send('is-bookmarked', !!this.bookmark);
  }

  public async updateData() {
    if (!this.incognito) {
      const id = this.lastHistoryId;
      if (id) {
        const { title, url, favicon } = this;

        this.historyQueue.enqueue(async () => {
          await Application.instance.storage.update({
            scope: 'history',
            query: {
              _id: id,
            },
            value: {
              title,
              url,
              favicon,
            },
            multi: false,
          });

          const item = Application.instance.storage.history.find(
            (x) => x._id === id,
          );

          if (item) {
            item.title = title;
            item.url = url;
            item.favicon = favicon;
          }
        });
      }
    }
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  public get hostname() {
    return parseUrl(this.url).hostname;
  }

  public emitEvent(event: TabEvent, ...args: any[]) {
    this.window.send('tab-event', event, this.id, args);
  }
}
