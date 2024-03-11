import puppeteer from 'puppeteer';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
    let browser;
    try {
        const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        const userDataDir = '/Users/mitz/Library/Application Support/Google/Chrome/Mith Patel'

        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9223'
        });
        const page = await browser.newPage();

        // Replace these with your actual Canvas credentials
        const canvasUsername = "mpp59";
        const canvasPassword = "Home2516*";

        await page.goto('https://canvas.cornell.edu/login/saml');

        // Replace '#username' and '#password' with the actual selectors from Canvas login page
        if (await page.$('#username') === null || 
            await page.$('#password') === null) {
            throw new Error("Login selectors not found on page");
        }

        await page.type('#username', canvasUsername);
        await page.type('#password', canvasPassword);

        // Replace '#login-button' with the actual selector for the login button
        // await page.click('#_elementID_');
        await page.waitForNavigation();

        const courseId = '63085';
        await page.goto(`https://canvas.cornell.edu/courses/${courseId}`);

        // Update this selector to the actual one for downloadable content
        await page.waitForSelector('selector-for-downloadable-content');

        const downloadLinks = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a'))
                .map(link => link.href)
                .filter(href => href.includes('/download'))
        );

        const downloadDir = `./downloads/${courseId}`;
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        for (const link of downloadLinks) {
            try {
                const viewSource = await page.goto(link);
                if (viewSource) {
                    await page.waitForTimeout(1000);
                    const buffer = await viewSource.buffer();
                    const fileName = link.split('/').pop();
                    fs.writeFileSync(`${downloadDir}/${fileName}`, buffer);
                }
            } catch (downloadError) {
                console.error(`Error downloading file from ${link}:`, downloadError);
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
