const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disable-gpu');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 256,
    height: 256,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      offscreen: true,
    },
  });

  const svgPath = path.resolve(__dirname, '../public/favicon.svg');
  await win.loadURL('file:///' + svgPath.replace(/\\/g, '/'));

  setTimeout(async () => {
    try {
      const img = await win.capturePage();
      const pngBuf = img.toPNG();

      const publicDir = path.resolve(__dirname, '../public');
      fs.writeFileSync(path.join(publicDir, 'icon.png'), pngBuf);

      // Create valid Windows 256x256 ICO file containing the PNG stream
      const icoHeader = Buffer.alloc(22);
      icoHeader.writeUInt16LE(0, 0); // reserved
      icoHeader.writeUInt16LE(1, 2); // icon type (1)
      icoHeader.writeUInt16LE(1, 4); // number of images (1)
      icoHeader.writeUInt8(0, 6);    // width: 0 = 256px
      icoHeader.writeUInt8(0, 7);    // height: 0 = 256px
      icoHeader.writeUInt8(0, 8);    // color palette: 0
      icoHeader.writeUInt8(0, 9);    // reserved
      icoHeader.writeUInt16LE(1, 10); // color planes
      icoHeader.writeUInt16LE(32, 12); // bits per pixel (32-bit RGBA)
      icoHeader.writeUInt32LE(pngBuf.length, 14); // image size in bytes
      icoHeader.writeUInt32LE(22, 18); // offset to image data

      const icoBuf = Buffer.concat([icoHeader, pngBuf]);
      fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuf);
      fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

      console.log('ICON_GENERATED_SUCCESSFULLY');
    } catch (err) {
      console.error('Error generating icon:', err);
    } finally {
      app.quit();
    }
  }, 600);
});
