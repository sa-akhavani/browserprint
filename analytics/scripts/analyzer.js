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
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return _intersection
}

async function difference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem)
        }
    }
    return _difference
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
                    stack.push(field.replace('.name', ''));
                } else if (typeof feature[field] === 'object') {
                    await doreBatel(feature[field])
                }
            }
        }
        else {
            if (isNameKey(featureField)) {
                stack.push(featureField.replace('.name', ''));
            }
        }
    }
}

async function extractFeatureNames(featuresObject) {
    stack = [];
    await doreBatel(featuresObject);
    let featuresList = stack;
    // console.dir(featuresList, { maxArrayLength: null });
    featuresSet = new Set()
    for(let f of featuresList) {
        featuresSet.add(f);
    }
    return {featuresList, featuresSet};
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
            }
            else {
                commonFeaturesSet.add(feature);
            }
        }
    }
    uncommonFeaturesSet = await difference(allFeaturesSet, commonFeaturesSet);
    return {commonFeaturesSet, uncommonFeaturesSet};
}

async function generateComparisonResults(finalReport) {
    // let {commonFeaturesSet, uncommonFeaturesSet} = await commonUncommonFeatures(finalReport);
    for (let i = 0; i < finalReport.length; i++) {
        let A = finalReport[i].featuresSet;
        let allFeaturesExceptMe = new Set();
        for (let j = 0; j < finalReport.length; j++) {
            if (i === j)
                continue;
            let featuresAdded = new Set();
            let featuresRemoved = new Set();
            let commonFeatures = new Set();
            let B = finalReport[j].featuresSet;
            if (j === i + 1) {
                featuresAdded = await difference(B, A);
                featuresRemoved = await difference(A, B);
                commonFeatures = await intersection(B, A)
                finalReport[j].featuresAddedSize = featuresAdded.size;
                finalReport[j].featuresRemovedSize = featuresRemoved.size;
                finalReport[j].featuresAdded = featuresAdded;
                finalReport[j].featuresRemoved = featuresRemoved;
            }
            allFeaturesExceptMe = await union(B, allFeaturesExceptMe);
        }
        let report = finalReport[i];
        let C = await difference(A, allFeaturesExceptMe);
        let D = await difference(allFeaturesExceptMe, A);
        let uniqueSet = await union(D, C);
        finalReport[i].uniqueFeatures = uniqueSet;
        finalReport[i].uniqueFeaturesSize = uniqueSet.size;
        // if (report.featuresAdded)
        //     console.log(`${report.browser}: All: ${report.featuresSet.size} added: ${report.featuresAdded.size}  removed: ${report.featuresRemoved.size} (This-All): ${C.size} (All-This): ${D.size}`);
        // else
        //     console.log(`${report.browser}: All: ${report.featuresSet.size} added: 0  removed: 0 (This-All): ${C.size} (All-This): ${D.size}`);
        // console.log('---------------')
    }
}

async function main() {
    repDir = reportsDir + chromeDir;
    // repDir = reportsDir + firefoxDir; // For firefox!
    let browserReportFileList = fs.readdirSync(repDir)
    let finalReport = [];
    for (let browserFile of browserReportFileList) {
        let featuresObject = await parseFile(repDir + '/' + browserFile);
        let {featuresList, featuresSet} = await extractFeatureNames(featuresObject);
        let browserFeatureData = {
            browser: browserFile,
            featuresSet: featuresSet,
            featuresList: featuresList,
        };
        finalReport.push(browserFeatureData);
    }
    await generateComparisonResults(finalReport);
    console.log(finalReport)
}



main();