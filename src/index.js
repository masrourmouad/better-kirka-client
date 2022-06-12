const {app, BrowserWindow, clipboard, ipcMain, dialog} = require('electron');
const shortcuts = require('electron-localshortcut');
const Store = require('electron-store');
const {autoUpdater} = require('electron-updater');

let updateLoaded = false;
let updateNow = false;

const clientId = '984501931273752577';
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({transport: 'ipc'});

DiscordRPC.register(clientId);

Store.initRenderer();

const settings = new Store();

if (!settings.get('fpsCap')) {
    app.commandLine.appendSwitch('disable-frame-rate-limit');
    app.commandLine.appendSwitch('disable-gpu-vsync');
}

app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.allowRendererProcessReuse = true;


ipcMain.on('docs', (event) => event.returnValue = app.getPath('documents'));

const createWindow = () => {
    let win = new BrowserWindow({
        width: 1900,
        height: 1000,
        title: `Better Kirka Client`,
        backgroundColor: '#000000',
        icon: __dirname + "/icon.ico",
        webPreferences: {
            preload: __dirname + '/preload/ingame.js',
            nodeIntegration: false,
            enableRemoteModule: false
        },
    });
    win.removeMenu();

    if (settings.get('fullScreen') === undefined) settings.set('fullScreen', true);

    win.setFullScreen(settings.get('fullScreen'));

    shortcuts.register(win, "Escape", () => win.webContents.executeJavaScript('document.exitPointerLock()', true));
    shortcuts.register(win, "F4", () => win.loadURL('https://kirka.io/'));
    shortcuts.register(win, "F5", () => win.reload());
    shortcuts.register(win, "F6", () => win.loadURL(clipboard.readText()));
    shortcuts.register(win, 'F11', () => {
        win.setFullScreen(!win.isFullScreen());
        settings.set('fullScreen', win.isFullScreen());
    });
    shortcuts.register(win, 'F12', () => win.webContents.openDevTools());


    win.loadURL('https://kirka.io/');

    win.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        win.loadURL(url);
    });

    win.on('page-title-updated', (e) => {
        e.preventDefault();
    });

    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {

        const options = {
            title: "Client Update",
            buttons: ["Now", "Later"],
            message: "Client Update available, do you want to install it now or after the next restart?",
            icon: __dirname + "/icon.ico"
        }

        dialog.showMessageBox(options).then((result) => {
            if (result.response === 0) {
                updateNow = true;
                if (updateLoaded) {
                    autoUpdater.quitAndInstall();
                }
            }
        });

    });

    autoUpdater.on('update-downloaded', () => {
        updateLoaded = true;
        if (updateNow) {
            autoUpdater.quitAndInstall();
        }
    });


}

app.on('ready', createWindow);

app.on('window-all-closed', app.quit);

let startTime = Date.now();

async function setActivity() {
    if (!RPC) return;
    await RPC.setActivity({
        startTimestamp: startTime,
        largeImageKey: `rosenowhite`,
        largeImageText: 'BKC',
        buttons: [
            {
                label: `Download`,
                url: `https://github.com/42infi/better-kirka-client/releases`
            },
            {
                label: `Discord`,
                url: `https://discord.gg/cNwzjsFHpg`
            }
        ]
    });
}

RPC.on('ready', async () => {
    await setActivity();

    setInterval(() => {
        setActivity();
    }, 30 * 1000);
});

RPC.login({clientId}).catch(err => console.error(err));