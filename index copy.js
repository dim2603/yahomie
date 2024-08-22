const { app, BrowserWindow, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let isQuiting = false;
let configFilePath = path.join(app.getPath('userData'), 'config.json');
let config = {
  useColoredIcon: true, // По умолчанию цветная иконка
  autoLaunch: false,    // По умолчанию автозапуск выключен
};

// Загрузка конфигурационного файла
function loadConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath);
      config = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Сохранение конфигурационного файла
function saveConfig() {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Установка автозапуска
function setAutoLaunch(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: app.getPath('exe'),
  });
}

// Установка иконки трея в зависимости от настроек
function setTrayIcon() {
  const iconPath = config.useColoredIcon
    ? path.join(__dirname, 'assets/yandex_colored.ico')
    : path.join(__dirname, 'assets/yandex.ico');
  tray.setImage(iconPath);
}

// Создание окна приложения
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 400, // Ширина окна
    height: 500, // Высота окна
    x: width - 400, // Расположение окна по горизонтали
    y: height - 500, // Расположение окна по вертикали
    frame: false, // Убрать бордеры
    transparent: true, // Сделать окно прозрачным
    alwaysOnTop: true, // Окно всегда поверх остальных
    resizable: false, // Запретить изменение размера окна
    show: false, // Скрыть окно при создании
    skipTaskbar: true, // Не отображать окно в панели задач
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL('https://yandex.ru/quasar/iot/');

  mainWindow.once('ready-to-show', () => {
    mainWindow.hide(); // Скрыть окно после его полной загрузки
  });

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// Создание меню трея
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/yandex_colored.ico'));
  setTrayIcon();

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'YaHomie',
      icon: nativeImage.createFromPath(__dirname + '/assets/yandex_colored.ico').resize({width:16}),
      type: 'normal',
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Toggle App',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Refresh',
      click: () => {
        mainWindow.reload(); // Обновление страницы
      },
    },
    {
      type: 'separator'
    },
    {
      label: 'Use Colored Icon',
      type: 'checkbox',
      checked: config.useColoredIcon,
      click: (menuItem) => {
        config.useColoredIcon = menuItem.checked;
        setTrayIcon();
        saveConfig();
      },
    },
    {
      label: 'Enable Auto Launch',
      type: 'checkbox',
      checked: config.autoLaunch,
      click: (menuItem) => {
        config.autoLaunch = menuItem.checked;
        setAutoLaunch(menuItem.checked);
        saveConfig();
      },
    },
    {
      label: 'Quit',
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(trayMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// Основная функция
app.on('ready', () => {
  loadConfig();
  setAutoLaunch(config.autoLaunch); // Установка автозапуска на основе конфигурации
  createMainWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});