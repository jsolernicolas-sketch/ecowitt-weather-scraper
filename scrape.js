const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeWeatherData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://www.ecowitt.net/home/share?authorize=dnka51&device_id=SXZibTVxY3JwMjk0eTIxa3Z3ZUpTQT09');
    await page.waitForTimeout(5000);

    const weatherData = await page.evaluate(() => {
      function getValueAfterLabel(labelText) {
        const labels = Array.from(document.querySelectorAll('.item-label'));
        const label = labels.find(l => l.textContent.trim() === labelText);
        if (label) {
          const parent = label.closest('.item-text');
          if (parent) {
            const value = parent.querySelector('.item-value');
            return value ? value.textContent.trim() : null;
          }
        }
        return null;
      }

      return {
        temperatura: getValueAfterLabel('Temperature'),
        humedad: getValueAfterLabel('Humidity'),
        viento: getValueAfterLabel('Wind'),
        presion: getValueAfterLabel('Pressure'),
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
