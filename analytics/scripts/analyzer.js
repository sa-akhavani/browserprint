const fs = require('fs')
const reportsDir = ('../reports')
const firefoxDir = ('/firefox')
const chromeDir = ('/chrome')

stack = [];

async function union(setA, setB) {
    let _union = new Set(setA);
    for (let elem of setB)
        _union.add(elem);
    return _union;
}

async function intersection(setA, setB) {
    let _intersection = new Set();
    for (let elem of setB) {
        if (setA.has(elem))
            _intersection.add(elem)
    }
    return _intersection
}

async function difference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
        if (_difference.has(elem))
            _difference.delete(elem)
    }
    return _difference
}

async function isSame(setA, setB) {
    if (setA.size !== setB.size)
        return false;
    for (elem of setA) {
        if (!setB.has(elem))
            return false;
    }
    return true;
}

function isNameKey(keyName) {
    if (keyName.includes(".name"))
        return true;
    else
        return false;
}

async function doreBatel(featuresObject) {
    for (const featureField in featuresObject) {
        if (typeof featuresObject[featureField] === 'object') {
            let feature = featuresObject[featureField];
            for (let field in feature) {
                if (isNameKey(field))
                    stack.push(field.replace('.name', ''));
                else if (typeof feature[field] === 'object')
                    await doreBatel(feature[field])
            }
        } else {
            if (isNameKey(featureField))
                stack.push(featureField.replace('.name', ''));
        }
    }
}

async function extractFeatureNames(featuresObject) {
    stack = [];
    await doreBatel(featuresObject);
    let featuresList = stack;
    featuresSet = new Set()
    for (let f of featuresList) {
        featuresSet.add(f);
    }
    return featuresSet;
}

async function parseFile(filePath) {
    fileContentString = fs.readFileSync(filePath, 'utf-8');
    fileContent = JSON.parse(fileContentString)
    featuresList = fileContent.features.globalObject;
    return featuresList;
}

async function commonUncommonFeatures(finalReport) {
    let allFeaturesSet = new Set();
    let commonFeaturesSet = new Set();
    let uncommonFeaturesSet = new Set();

    for (let report of finalReport) {
        for (let feature of report.featuresList) {
            allFeaturesSet.add(feature);
            if (commonFeaturesSet.has(feature)) {
                commonFeaturesSet.delete(feature);
            } else {
                commonFeaturesSet.add(feature);
            }
        }
    }
    uncommonFeaturesSet = await difference(allFeaturesSet, commonFeaturesSet);
    return {
        commonFeaturesSet,
        uncommonFeaturesSet
    };
}

async function generateComparisonResults(finalReport) {
    for (let i = 0; i < finalReport.length; i++) {
        let A = finalReport[i].features;
        finalReport[i].isUnique = true;
        let allFeaturesExceptMe = new Set();
        for (let j = 0; j < finalReport.length; j++) {
            if (i === j)
                continue;
            let addedFeatures = new Set();
            let removedFeatures = new Set();
            let B = finalReport[j].features;
            if (j === i + 1) {
                addedFeatures = await difference(B, A);
                removedFeatures = await difference(A, B);
                finalReport[j].addedFeatures = addedFeatures;
                finalReport[j].removedFeatures = removedFeatures;
                finalReport[j].addedFeaturesSize = addedFeatures.size;
                finalReport[j].removedFeaturesSize = removedFeatures.size;
            }
            allFeaturesExceptMe = await union(B, allFeaturesExceptMe);
            if (await isSame(A, B))
                finalReport[i].isUnique = false;
        }

        let C = await difference(A, allFeaturesExceptMe);
        let D = await difference(allFeaturesExceptMe, A);
        let differentFeaturesSet = await union(D, C);
        finalReport[i].differentFeatures = differentFeaturesSet;
        finalReport[i].differentFeaturesSize = differentFeaturesSet.size;
    }
}

async function printResults(finalReport) {

    // Browser-Feature
    for (report of finalReport) {
        console.log(`${report.browser}, ${report.features.size}, ${report.addedFeaturesSize}, ${report.removedFeaturesSize}`)
    }

    // console.log(finalReport)
    //    for (report of finalReport) {
    // console.log(report);
    // if (report.addedFeatures)
    //     console.log(`${report.browser}: isUnique: ${report.isUnique} AllFeaturesSize: ${report.features.size} AddedFeaturesSize: ${report.addedFeatures.size}  RemovedFeaturesSize: ${report.removedFeatures.size}`);
    // else
    //     console.log(`${report.browser}: isUnique: ${report.isUnique} AllFeaturesSize: ${report.features.size} AddedFeaturesSize: 0  RemovedFeaturesSize: 0`);
    // console.log('---------------')
    //    }
}

async function printFeatureResults(finalReport) {
    // feature,numOfAppearance,chromeList,chromeFirst,chromeLast,firefoxList,firefoxFirst,firefoxLast
    for (report of finalReport) {
        console.log(`${report.feature},${report.chromelist.length + report.firefoxlist.length},[${report.chromelist}],${report.chromelist[0]},${report.chromelist[report.chromelist.length-1]},[${report.firefoxlist}],${report.firefoxlist[0]},${report.firefoxlist[report.firefoxlist.length-1]}`)
    }
}

async function generateFeatureResults() {
    let allFeaturesSet = new Set();
    let browserFeatureList = [];

    let chDir = reportsDir + chromeDir;
    let ffDir = reportsDir + firefoxDir;

    let chReportFileList = fs.readdirSync(chDir);
    let ffReportFileList = fs.readdirSync(ffDir);

    let finalReport = [];

    for (let browserFile of chReportFileList) {
        let featuresObject = await parseFile(chDir + '/' + browserFile);
        let featuresSet = await extractFeatureNames(featuresObject);
        allFeaturesSet = await union(allFeaturesSet, featuresSet);
        let browserFeatureData = {
            browser: browserFile,
            features: featuresSet,
        };
        browserFeatureList.push(browserFeatureData);
    }

    for (let browserFile of ffReportFileList) {
        let featuresObject = await parseFile(ffDir + '/' + browserFile);
        let featuresSet = await extractFeatureNames(featuresObject);
        allFeaturesSet = await union(allFeaturesSet, featuresSet);
        let browserFeatureData = {
            browser: browserFile,
            features: featuresSet,
        };
        browserFeatureList.push(browserFeatureData);
    }

    for (let feature of allFeaturesSet) {
        let firefoxList = [];
        let chromeList = [];
        for (let browser of browserFeatureList) {
            if (browser.features.has(feature)) {
                if (browser.browser.includes('chrome'))
                    chromeList.push(browser.browser);
                else if (browser.browser.includes('firefox'))
                    firefoxList.push(browser.browser)
            }
        }
        finalReport.push({
            'feature': feature,
            'chromelist': chromeList,
            'firefoxlist': firefoxList,
        })
    }

    printFeatureResults(finalReport);
}

async function generateBrowserResults(browserType = 'chrome') {
    if (browserType == 'chrome')
        repDir = reportsDir + chromeDir;
    else if (browserType == 'firefox')
        repDir = reportsDir + firefoxDir;

    let browserReportFileList = fs.readdirSync(repDir);
    let finalReport = [];
    for (let browserFile of browserReportFileList) {
        let featuresObject = await parseFile(repDir + '/' + browserFile);
        let featuresSet = await extractFeatureNames(featuresObject);
        let browserFeatureData = {
            browser: browserFile,
            features: featuresSet,
        };
        finalReport.push(browserFeatureData);
    }
    await generateComparisonResults(finalReport);
    await printResults(finalReport);
}


async function main() {
    // await generateBrowserResults('chrome');
    await generateBrowserResults('firefox');
    // await generateFeatureResults();
}


main();