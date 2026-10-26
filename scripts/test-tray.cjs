const { app, Tray, nativeImage } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const iconPath = path.join(__dirname, '../public/icon.png');
  const img = nativeImage.createFromPath(iconPath);
  console.log('Original image empty:', img.isEmpty(), 'size:', img.getSize());
  
  const resized = img.resize({ width: 16, height: 16 });
  console.log('Resized image empty:', resized.isEmpty(), 'size:', resized.getSize());

  try {
    const tray = new Tray(resized);
    console.log('Tray created successfully!');
    setTimeout(() => {
      app.quit();
    }, 1000);
  } catch (e) {
    console.error('Tray creation failed:', e);
    app.quit();
  }
});
