const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const fs = require("node:fs");
const {supabase} = require('./utils')

let caseid = [ "E24-0118J5"];

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false })
  .then(async (browser) => {
    for (let id of caseid) {
      const page = await browser.newPage();
      await page.goto(
        "https://justice1.dentoncounty.gov/PublicAccess/Search.aspx?ID=200"
      );

      await page.waitForSelector(
        "a.ssSearchHyperlink[href=\"javascript:LaunchSearch('Search.aspx?ID=200', false, true, sbxControlID2)\"]"
      );
      await page.click(
        "a.ssSearchHyperlink[href=\"javascript:LaunchSearch('Search.aspx?ID=200', false, true, sbxControlID2)\"]"
      );

      await page.waitForSelector(
        'input[type="radio"][name="SearchBy"][value="0"]'
      );
      await page.click('input[type="radio"][name="SearchBy"][value="0"]');

      await page.type("#CaseSearchValue", id);

      await page.click(
        'input[type="submit"][name="SearchSubmit"][value="Search"]'
      );

      const caseLinkSelector = 'a[href^="CaseDetail.aspx?CaseID="]';
      await page.waitForSelector(caseLinkSelector);
      const caseDetailUrl = await page.evaluate((selector) => {
        return document.querySelector(selector).getAttribute("href");
      }, caseLinkSelector);
      await page.goto(
        `https://justice1.dentoncounty.gov/PublicAccess/${caseDetailUrl}`,{timeout: 60000}
      );

      await page.waitForNetworkIdle();
      await page.screenshot({ path: `${id}_denton.png` });

      const allPageContent = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).reduce((acc, el) => {
          if (el.offsetHeight > 0 && el.offsetWidth > 0) {
            acc[el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '')] = el.innerText;
          }
          return acc;
        }, {});
      });
      const pageContentString = JSON.stringify(allPageContent);

      const { data, error } = await supabase
        .from('case_details')
        .insert([
          { case_id: id, county: 'Denton', raw_data: pageContentString }
        ]);

      if (error) {
        console.error('Error inserting data into Supabase:', error);
      } else {
        console.log('Data inserted successfully:', data);
      }

      await page.close()
    }
  });
