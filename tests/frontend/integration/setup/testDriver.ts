import { Builder, By, WebDriver, WebElement, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';

const DEFAULT_TIMEOUT = 5000;

export async function createDriver(): Promise<WebDriver> {
  const chromeOptions = new ChromeOptions();

  // Use CHROME_BIN env var if set (for Docker/CI with Chromium)
  if (process.env.CHROME_BIN) {
    chromeOptions.setChromeBinaryPath(process.env.CHROME_BIN);
  }

  // Headless mode for CI - comment out for debugging
  chromeOptions.addArguments('--headless=new');

  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--disable-gpu');
  chromeOptions.addArguments('--window-size=1920,1080');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();

  // Set implicit wait (keep short to avoid slow failures)
  await driver.manage().setTimeouts({ implicit: 1000 });

  return driver;
}

export async function quitDriver(driver: WebDriver | null): Promise<void> {
  if (driver) {
    await driver.quit();
  }
}

export async function waitForElement(
  driver: WebDriver,
  selector: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<WebElement> {
  return driver.wait(until.elementLocated(By.css(selector)), timeout);
}

export async function waitForElementNotPresent(
  driver: WebDriver,
  selector: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<boolean> {
  try {
    await driver.wait(async () => {
      const elements = await driver.findElements(By.css(selector));
      return elements.length === 0;
    }, timeout);
    return true;
  } catch {
    return false;
  }
}

export async function findElements(
  driver: WebDriver,
  selector: string
): Promise<WebElement[]> {
  return driver.findElements(By.css(selector));
}

export async function clickElement(
  driver: WebDriver,
  selector: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<void> {
  const element = await waitForElement(driver, selector, timeout);
  await element.click();
}

export async function typeIntoElement(
  driver: WebDriver,
  selector: string,
  text: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<void> {
  const element = await waitForElement(driver, selector, timeout);
  await element.clear();
  await element.sendKeys(text);
}

export async function getElementText(
  driver: WebDriver,
  selector: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  const element = await waitForElement(driver, selector, timeout);
  return element.getText();
}

export async function elementExists(
  driver: WebDriver,
  selector: string
): Promise<boolean> {
  const elements = await driver.findElements(By.css(selector));
  return elements.length > 0;
}

export async function waitForPageLoad(driver: WebDriver): Promise<void> {
  await driver.wait(async () => {
    const readyState = await driver.executeScript('return document.readyState');
    return readyState === 'complete';
  }, DEFAULT_TIMEOUT);
}
