const fs = require('fs')
const reportsDir = ('../reports')
const firefoxDir = ('/firefox')
const chromeDir = ('/chrome')
const operaDir = ('/opera')
const mobileDir = ('/mobile')
const fingerprintingApis = require('../../dataset/fingerprint-api.js')
stack = [];
CHROME_START_VERSION = 49
CHROME_END_VERSION = 81
FIREFOX_START_VERSION = 45
FIREFOX_END_VERSION = 75
OPERA_START_VERSION = 36
OPERA_END_VERSION = 68


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
                if (isNameKey(field)) {
                    stack.push(Object.keys(feature))
                    stack.push(field.replace('.name', ''));
                } else if (typeof feature[field] === 'object')
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
    return finalReport;
}

async function printResults(finalReport) {
    console.log('Browser, FeaturesSize, FingerprintingApiSize, AddedFeatureSize, RemovedFeatureSize, UniqueFeatureSize, isUnique')
    for (report of finalReport) {
        if (report.addedFeatures)
            console.log(`${report.browser}, ${report.features.size}, ${report.fingerprintApis.size}, ${report.addedFeatures.size}, ${report.removedFeatures.size}, ${report.differentFeatures.size}, ${report.isUnique}`)
        else
            console.log(`${report.browser}, ${report.features.size}, ${report.fingerprintApis.size}, 0, 0, ${report.differentFeatures.size}, ${report.isUnique}`)
    }
}

async function printFeatureResults(finalReport) {
    // console.log('feature, chromeCategory, firefoxCategory, isCommon')
    // for (report of finalReport) {
    // console.log(`${report.feature}, ${report.chromeCategory}, ${report.firefoxCategory}, ${report.isCommon}`)
    // }
    console.log('browser, permanentlyAdded, permanentlyRemoved, experimental')
    ffadded = 0
    ffremoved = 0
    ffexperimental = 0
    chadded = 0
    chremoved = 0
    chexperimental = 0
    opadded = 0
    opremoved = 0
    opexperimental = 0
    isCommonChFf = 0
    isCommonChOp = 0
    isCommonFfOp = 0
    for (const report of finalReport) {
        if (report.firefoxCategory == 'permanently added')
            ffadded++
        if (report.firefoxCategory == 'permanently removed')
            ffremoved++
        if (report.firefoxCategory == 'experimental')
            ffexperimental++
        if (report.chromeCategory == 'permanently added')
            chadded++
        if (report.chromeCategory == 'permanently removed')
            chremoved++
        if (report.chromeCategory == 'experimental')
            chexperimental++
        if (report.operaCategory == 'permanently added')
            opadded++
        if (report.operaCategory == 'permanently removed')
            opremoved++
        if (report.operaCategory == 'experimental')
            opexperimental++
        if (report.isCommonChFf)
            isCommonChFf++
        if (report.isCommonChOp)
            isCommonChOp++
        if (report.isCommonFfOp)
            isCommonFfOp++
    }
    console.log(`firefox, ${ffadded}, ${ffremoved}, ${ffexperimental}`)
    console.log(`chrome, ${chadded}, ${chremoved}, ${chexperimental}`)
    console.log(`opera, ${opadded}, ${opremoved}, ${opexperimental}`)
    console.log(`isCommonChFf: ${isCommonChFf} --- isCommonChOp: ${isCommonChOp} --- isCommonFfOp: ${isCommonFfOp}`);
}


async function determineFeatureCategory(browserList, browserType) {
    list = []
    for (let b of browserList) {
        b = b.replace('.json', '')
        b = b.replace('firefox-', '')
        b = b.replace('chrome-', '')
        b = b.replace('opera-', '')
        b = parseInt(b)
        list.push(b)
    }
    const sorted = list.sort((a, b) => {
        return a - b
    })

    if (sorted.length < 1)
        return null
    if (sorted.length == 1) {
        if (browserType === 'chrome' && sorted[0] === CHROME_END_VERSION) {
            return 'permanently added'
        } else if (browserType === 'firefox' && sorted[0] === FIREFOX_END_VERSION) {
            return 'permanently added'
        } else if (browserType === 'opera' && sorted[0] === OPERA_END_VERSION) {
            return 'permanently added'
        }
        return 'experimental'
    }
    if (browserType == 'chrome') {
        if (sorted[sorted.length - 1] != CHROME_END_VERSION) {
            if (sorted[sorted.length - 2])
                if (sorted[sorted.length - 2] != CHROME_END_VERSION - 1)
                    return 'permanently removed'
        } else {
            if (sorted.length == CHROME_END_VERSION - sorted[0] + 1)
                return 'permanently added'
        }
        return 'experimental'
    } else if (browserType == 'firefox') {
        if (sorted[sorted.length - 1] != FIREFOX_END_VERSION) {
            if (sorted[sorted.length - 2])
                if (sorted[sorted.length - 2] != FIREFOX_END_VERSION - 1)
                    return 'permanently removed'
        } else {
            if (sorted.length == FIREFOX_END_VERSION - sorted[0] + 1)
                return 'permanently added'
        }
        return 'experimental'
    } else if (browserType == 'opera') {
        if (sorted[sorted.length - 1] != OPERA_END_VERSION) {
            if (sorted[sorted.length - 2])
                if (sorted[sorted.length - 2] != OPERA_END_VERSION - 1)
                    return 'permanently removed'
        } else {
            // opera 59 and 61 do not exist!
            let offset = 0;
            if (sorted[0] < 59 && sorted[sorted.length - 1] > 61)
                offset += 2;
            if (sorted[0] > 59 && sorted[0] < 61 && sorted[sorted.length - 1] > 61)
                offset += 1;
            if (sorted[0] < 59 && sorted[sorted.length - 1] < 61 && sorted[sorted.length - 1] > 59)
                offset += 1;
            if (sorted.length + offset == OPERA_END_VERSION - sorted[0] + 1)
                return 'permanently added'
        }
        return 'experimental'
    }

    //unknown browser type
    return null
}

async function generateFeatureResults() {
    let allFeaturesSet = new Set();
    let browserFeatureList = [];

    let chDir = reportsDir + chromeDir;
    let ffDir = reportsDir + firefoxDir;
    let opDir = reportsDir + operaDir;

    let chReportFileList = fs.readdirSync(chDir);
    let ffReportFileList = fs.readdirSync(ffDir);
    let opReportFileList = fs.readdirSync(opDir);

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

    for (let browserFile of opReportFileList) {
        let featuresObject = await parseFile(opDir + '/' + browserFile);
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
        let operaList = [];
        for (let browser of browserFeatureList) {
            if (browser.features.has(feature)) {
                if (browser.browser.includes('chrome'))
                    chromeList.push(browser.browser);
                else if (browser.browser.includes('firefox'))
                    firefoxList.push(browser.browser)
                else if (browser.browser.includes('opera'))
                    operaList.push(browser.browser)
            }
        }

        chromeCategory = await determineFeatureCategory(chromeList, 'chrome');
        firefoxCategory = await determineFeatureCategory(firefoxList, 'firefox');
        operaCategory = await determineFeatureCategory(operaList, 'opera');
        let isCommonChFf = false;
        let isCommonChOp = false;
        let isCommonFfOp = false;

        //todo check here
        if (chromeCategory && firefoxCategory)
            isCommonChFf = true
        if (chromeCategory && operaCategory)
            isCommonChOp = true
        if (firefoxCategory && operaCategory)
            isCommonFfOp = true
        finalReport.push({
            'feature': feature,
            'chromelist': chromeList,
            'firefoxlist': firefoxList,
            'chromeCategory': chromeCategory,
            'firefoxCategory': firefoxCategory,
            'operaCategory': operaCategory,
            'isCommonChFf': isCommonChFf,
            'isCommonChOp': isCommonChOp,
            'isCommonFfOp': isCommonFfOp,
        })
    }

    printFeatureResults(finalReport);
}


async function isSimilar(api, feature) {
    let f = feature.replace(' ', '.')
    f = f.replace('.prototype', '')
    let featureParts = f.split('.')
    let apiParts = api.split('.')

    for (let part of apiParts) {
        if (featureParts.includes(part))
            continue
        else
            return false;
    }
    return true
}

async function extractFingerprintableApis(featuresSet) {
    let apis = new Set();

    for (let api of fingerprintingApis) {
        for (let f of featuresSet) {
            if (await isSimilar(api, f))
                apis.add(api);
        }
    }
    return apis
}

async function generateBrowserResults(browserType = 'chrome') {
    if (browserType == 'chrome')
        repDir = reportsDir + chromeDir;
    else if (browserType == 'firefox')
        repDir = reportsDir + firefoxDir;
    else if (browserType == 'opera')
        repDir = reportsDir + operaDir;
    else if (browserType == 'mobile')
        repDir = reportsDir + mobileDir;
    let browserReportFileList = fs.readdirSync(repDir);
    let finalReport = [];
    for (let browserFile of browserReportFileList) {
        let featuresObject = await parseFile(repDir + '/' + browserFile);
        let featuresSet = await extractFeatureNames(featuresObject);
        let fingerprintApisSet = await extractFingerprintableApis(featuresSet);
        let browserFeatureData = {
            browser: browserFile,
            features: featuresSet,
            fingerprintApis: fingerprintApisSet,
        };
        finalReport.push(browserFeatureData);
    }
    finalReport = await generateComparisonResults(finalReport);
    await printResults(finalReport);
}


async function main() {
    // await generateBrowserResults('chrome');
    // await generateBrowserResults('firefox');
    // await generateBrowserResults('opera');
    // await generateBrowserResults('mobile');
    await generateFeatureResults();
}


main();