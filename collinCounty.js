const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const fs = require("fs");
const { supabase } = require("./utils");

let caseid = ["04-EV-24-00690", "03-EV-24-00543"];

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "2f06348d19c57f973aa82aeecb95b3d7", // Replace with your actual 2Captcha API key
    },
    visualFeedback: true,
  })
);


for (let i = 0; i < caseid.length; i++) {
  puppeteer
    .use(StealthPlugin())
    .launch({ headless: false })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.solveRecaptchas();

      await page.goto(
        "https://apps2.collincountytx.gov/JudicialOnlineSearch2/case"
      );

      await page.waitForSelector("#MainSearch > div > div > div > input");

      await page.type("#MainSearch > div > div > div > input", caseid[i]);
      await page.waitForNetworkIdle();
      const clickableElementSelector = 'td[data-label="Styled"].mud-table-cell';
      await page.waitForSelector(clickableElementSelector);
      await page.click(clickableElementSelector);
      await page.waitForNetworkIdle();

      const allPageData = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("*")).reduce((acc, el) => {
          if (el.offsetHeight > 0 && el.offsetWidth > 0) {
            acc[
              el.tagName +
                (el.id ? "#" + el.id : "") +
                (el.className ? "." + el.className.split(" ").join(".") : "")
            ] = el.innerText;
          }
          return acc;
        }, {});
      });

      const { data: supabaseData, error } = await supabase
        .from("rawdata")
        .insert([{ case_id: caseid, county: "Collin", raw_data: allPageData }]);

      if (error) {
        console.error("Error inserting data into Supabase:", error);
      } else {
        console.log("Data inserted successfully:", supabaseData);
      }

      await browser.close();

      // const dateElementSelector =
      //   "div.mud-grid-item.mud-grid-item-xs-12.mud-grid-item-md-11.pa-1";
      // await page.waitForSelector(dateElementSelector);
      // const dateText = await page.evaluate((selector) => {
      //   return document.querySelector(selector).innerText;
      // }, dateElementSelector);
      // console.log(`Extracted Date: ${dateText}`);

      // const csvContent = `Date Text\n${dateText}`;
      // fs.writeFile("collinCounty.csv", csvContent, (err) => {
      //   if (err) {
      //     console.error("Error writing to CSV file", err);
      //   } else {
      //     console.log("Successfully wrote data to collinCounty.csv");
      //   }
      // });
    })
    .catch((err) => console.error(err));
}

