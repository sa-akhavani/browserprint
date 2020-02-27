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
    for (report of finalReport) {
        if (report.addedFeatures)
            console.log(`${report.browser}: isUnique: ${report.isUnique} AllFeaturesSize: ${report.features.size} AddedFeaturesSize: ${report.addedFeatures.size}  RemovedFeaturesSize: ${report.removedFeatures.size}`);
        else
            console.log(`${report.browser}: isUnique: ${report.isUnique} AllFeaturesSize: ${report.features.size} AddedFeaturesSize: 0  RemovedFeaturesSize: 0`);
        console.log('---------------')
    }
}

async function main() {
    repDir = reportsDir + chromeDir;
    // repDir = reportsDir + firefoxDir; // For firefox!

    let browserReportFileList = fs.readdirSync(repDir)
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



main();