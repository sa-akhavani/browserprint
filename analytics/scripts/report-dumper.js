const request = require('request');
const fs = require('fs');

const serverUrl = 'https://browserprint.lab.kapravelos.com/f76c59afe011dd73ef08c58fccc34acd00704e3eebb7ed82ef0adbdb978ac7c9'
const reportsUrl = 'report'
const reportListFile = '../../dataset/browser-report-list.js';
const reportsFilePath = '../reports'


async function asyncRequest(url) {
  return new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
      if (error) {
        console.error('error:', error);
        reject(error)
      }
      resolve(JSON.parse(body));
    });
  });
}

async function fetchAllReports() {
  return await asyncRequest(serverUrl + '/' + reportsPath);
}

async function main() {
  reportListString = fs.readFileSync(reportListFile, 'utf-8');
  let reportList;
  eval('reportList = ' + reportListString)

  for (report of reportList) {
    let reportData = await asyncRequest(serverUrl + '/' + reportsUrl + '/' + report.uuid);
    let fileName = reportsFilePath + '/' + report.browser + '-' + report.version + '.json';
    fs.writeFileSync(fileName, JSON.stringify(reportData));
  }
}


main()
