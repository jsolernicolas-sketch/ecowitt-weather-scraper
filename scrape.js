const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeWeatherData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://www.ecowitt.net/home/share?authorize=dnka51&device_id=SXZibTVxY3JwMjk0eTIxa3Z3ZUpTQT09');
    await page.waitForTimeout(8000); // Esperar más tiempo para que cargue completamente

    const weatherData = await page.evaluate(() => {
      // Buscar el elemento que contiene "Temperature" y luego obtener el valor grande (13.7)
      const tempElements = Array.from(document.querySelectorAll('*'));
      const tempLabel = tempElements.find(el => el.textContent.trim() === 'Temperature');
      let temperatura = null;
      if (tempLabel) {
        // Buscar el siguiente elemento que contiene el valor numérico grande
        const parent = tempLabel.closest('div');
        if (parent) {
          const valueElements = Array.from(parent.querySelectorAll('*'));
          for (const el of valueElements) {
            const text = el.textContent.trim();
            // Buscar un número decimal (ej: 13.7)
            if (/^\d+\.\d+$/.test(text)) {
              temperatura = text + '°C';
              break;
            }
          }
        }
      }

      // Buscar humedad
      const humLabel = tempElements.find(el => el.textContent.trim() === 'Humidity');
      let humedad = null;
      if (humLabel) {
        const parent = humLabel.closest('div');
        if (parent) {
          const valueElements = Array.from(parent.querySelectorAll('*'));
          for (const el of valueElements) {
            const text = el.textContent.trim();
            // Buscar solo número (ej: 75)
            if (/^\d+$/.test(text) && text.length <= 3) {
              humedad = text + '%';
              break;
            }
          }
        }
      }

      // Buscar viento (Wind) - La etiqueta "Wind" aparece dos veces, necesitamos buscar en todas
      const windLabels = tempElements.filter(el => el.textContent.trim() === 'Wind');
      let viento = null;
      for (const windLabel of windLabels) {
        const parent = windLabel.closest('div');
        if (parent) {
          const valueElements = Array.from(parent.querySelectorAll('*'));
          for (const el of valueElements) {
            const text = el.textContent.trim();
            // Buscar número con o sin decimal (ej: 0, 0.0, 1.8)
            if (/^\d+(\.\d+)?$/.test(text)) {
              viento = text + ' km/h';
              break;
            }
          }
          if (viento) break; // Si ya encontramos el viento, salir del loop
        }
      }
      // Buscar presión (Pressure - Relative)
      const pressLabel = tempElements.find(el => el.textContent.trim() === 'Relative');
      let presion = null;
      if (pressLabel) {
        const parent = pressLabel.closest('div');
        if (parent) {
          const valueElements = Array.from(parent.querySelectorAll('*'));
          for (const el of valueElements) {
            const text = el.textContent.trim();
            // Buscar número grande con decimal (ej: 1013.5)
            if (/^\d{4}\.\d+$/.test(text)) {
              presion = text + ' hPa';
              break;
            }
          }
        }
      }

      return {
        temperatura: temperatura,
        humedad: humedad,
        viento: viento,
        presion: presion,
        timestamp: new Date().toISOString()
      };
    });

    console.log('Weather data scraped:', weatherData);

    fs.writeFileSync('weather-data.json', JSON.stringify(weatherData, null, 2));
    console.log('Data saved to weather-data.json');

  } catch (error) {
    console.error('Error scraping weather data:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrapeWeatherData();
