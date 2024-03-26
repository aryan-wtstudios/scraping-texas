const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const { supabase } = require("./utils");


const caseid = 248100073519;

puppeteer
  .use(StealthPlugin())
  .launch({ headless: true })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.goto(
      `https://jpwebsite.harriscountytx.gov/CaseInfo/GetCaseInfo?case=${caseid}`
    );

    await page.waitForNetworkIdle();

    const allPageData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).reduce((acc, el) => {
        if (el.offsetHeight > 0 && el.offsetWidth > 0) {
          acc[el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '')] = el.innerText;
        }
        return acc;
      }, {});
    });
    const pageDataString = JSON.stringify(allPageData);

    const { data, error } = await supabase
      .from('rawdata')
      .insert([
        { case_id: caseid.toString(), county: 'Harris', raw_data: pageDataString }
      ]);

    if (error) {
      console.error('Error inserting data into Supabase:', error);
    } else {
      console.log('Data inserted successfully:', data);
    }

    await page.close();
  

    // const data = await page.evaluate(() => {
    //   const iterateLabelsAndValues = (labels, values) => {
    //     const pairs = {};
    //     for (let i = 0; i < labels.length; i++) {
    //       if (labels[i].textContent.trim() === "Court Info:") {
    //         const value = values[i].querySelector("a").href;

    //         const label = labels[i].textContent.trim().replaceAll(/\s+/g, " ");
    //         pairs[label] = JSON.stringify(value);
    //         continue;
    //       }
    //       const label = labels[i].textContent.trim().replaceAll(/\s+/g, " ");
    //       const value = values[i].textContent.trim().replaceAll(/\s+/g, " ");

    //       pairs[label] = value;
    //     }
    //     return pairs;
    //   };

    //   const labels_category = document.querySelectorAll(
    //     ".categoryDisplay .label"
    //   );
    //   const values_category = document.querySelectorAll(
    //     ".categoryDisplay .value"
    //   );
    //   const labels_partyInfo = document.querySelectorAll(
    //     ".partyInfo .label"
    //   );
    //   const values_partyInfo = document.querySelectorAll(
    //     ".partyInfo .value"
    //   );
    //   const labels_eventInfo = document.querySelectorAll(
    //     ".eventInfo .label"
    //   );
    //   const values_eventInfo = document.querySelectorAll(
    //     ".eventInfo .value"
    //   );
    //   const labels_fillingInfo = document.querySelectorAll(
    //     ".fillingInfo .label"
    //   );
    //   const values_fillingInfo = document.querySelectorAll(
    //     ".fillingInfo .value"
    //   );

    //   const pairs_category = iterateLabelsAndValues(
    //     labels_category,
    //     values_category
    //   );
    //   const pairs_partyInfo = iterateLabelsAndValues(
    //     labels_partyInfo,
    //     values_partyInfo
    //   );
    //   const pairs_eventInfo = iterateLabelsAndValues(
    //     labels_eventInfo,
    //     values_eventInfo
    //   );
      
    //   const pairs_fillingInfo = iterateLabelsAndValues(
    //     labels_fillingInfo,
    //     values_fillingInfo
    //   );

    //   // Merge all the pairs
    //   const pairs = Object.assign({}, pairs_category, pairs_partyInfo, pairs_eventInfo, pairs_fillingInfo);


    //   return pairs;
    // });

    // await browser.close();

    // const labels = Object.keys(data);
    // const values = Object.values(data);

    // // Construct CSV rows
    // let csvContent = `"${labels.join('","')}"\n"${values.join('","')}"\n`;

    // // Output CSV
    // console.log(csvContent);
  });
