const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const fs = require("fs");

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "2f06348d19c57f973aa82aeecb95b3d7", // Replace with your actual 2Captcha API key
    },
    visualFeedback: true,
  })
);

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.goto(
      "https://portal.galvestoncountytx.gov/Portal/Home/Dashboard/29"
    );

    await page.solveRecaptchas();
    await page.type("#caseCriteria_SearchCriteria", "24-EV02-0150");
    await page.waitForSelector('input[type="submit"][value="Submit"]');
    await page.click('input[type="submit"][value="Submit"]');
    await page.waitForNavigation();

    const caseLinkSelector = 'a.caseLink[data-caseid="0"]';
    const targetUrl = await page.$eval(caseLinkSelector, el => el.getAttribute('data-url'));
    await page.goto(targetUrl);

    

    await page.screenshot({ path: "error-screenshot.png" });
    await page.waitForSelector("#divCaseInformation_body");
    const caseInformation = await page.evaluate(() => {
      const info = {};
      const caseNumber = document
        .querySelector(
          "#divCaseInformation_body .row:nth-child(3) .col-md-4:nth-child(1) p"
        )
        .innerText.split("\n")[1];
      const court = document
        .querySelector(
          "#divCaseInformation_body .row:nth-child(3) .col-md-4:nth-child(2) p"
        )
        .innerText.split("\n")[1];
      const judicialOfficer = document
        .querySelector(
          "#divCaseInformation_body .row:nth-child(3) .col-md-4:nth-child(3) p"
        )
        .innerText.split("\n")[1];
      const fileDate = document
        .querySelector(
          "#divCaseInformation_body .row:nth-child(4) .col-md-4:nth-child(1) p"
        )
        .innerText.split("\n")[1];
      const caseType = document
        .querySelector(
          "#divCaseInformation_body .row:nth-child(4) .col-md-4:nth-child(2) p"
        )
        .innerText.split("\n")[1];
      const caseStatus = document
        .querySelector(
          "#divCaseInformation_body .row:nth-child(4) .col-md-4:nth-child(3) p"
        )
        .innerText.split("\n")[1];

      info["Case Number"] = caseNumber;
      info["Court"] = court;
      info["Judicial Officer"] = judicialOfficer;
      info["File Date"] = fileDate;
      info["Case Type"] = caseType;
      info["Case Status"] = caseStatus;

      return info;
    });

    console.log(caseInformation);
  })
  .catch((err) => console.error(err));
