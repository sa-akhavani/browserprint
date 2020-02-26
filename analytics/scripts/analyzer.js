const fs = require('fs')
const reportsDir = ('../reports')

stack = [];

function intersection(setA, setB) {
    let _intersection = new Set();
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return _intersection
}

function difference(setA, setB) {
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
        } else {
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
    for(f of featuresList) {
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

async function main() {
    let browserReportFileList = fs.readdirSync(reportsDir)
    let finalReport = [];
    for (let browserFile of browserReportFileList) {
        let featuresObject = await parseFile(reportsDir + '/' + browserFile);
        let {featuresList, featuresSet} = await extractFeatureNames(featuresObject);
        let browserFeatureData = {
            browser: browserFile,
            featuresSet: featuresSet,
            featuresList: featuresList
        };
        finalReport.push(browserFeatureData);
    }
    console.log(JSON.stringify(finalReport))
}



main();