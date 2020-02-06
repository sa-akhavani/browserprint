const fs = require('fs')
const reportsDir = ('../reports')


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

async function parseFile(filePath) {
    // console.log('parsing file:', filePath)
    fileContentString = fs.readFileSync(filePath, 'utf-8');
    fileContent = JSON.parse(fileContentString)
    featuresList = fileContent.features.globalObject;
    return featuresNames = Object.keys(featuresList)
}

async function main() {
    let reportsList = fs.readdirSync(reportsDir)
    let allFeatures = new Set();
    let uniqueFeatures = new Set();
    let commonFeatures = new Set();
    let uncommonFeatures = new Set();
    for (let i = 0; i < reportsList.length; i++) {
        const reportFile = reportsList[i];
        let featuresNames = await parseFile(reportsDir + '/' + reportFile)
        for (feature of featuresNames) {
            if (allFeatures.has(feature)) {
                uniqueFeatures.delete(feature);
            } else {
                allFeatures.add(feature);
                uniqueFeatures.add(feature);
            }
            if (i == 0)
                commonFeatures.add(feature);
        }        
        commonFeatures = intersection(commonFeatures, featuresNames);
        uncommonFeatures = difference(allFeatures, commonFeatures);
    }
    // console.log(commonFeatures);
    console.log(uncommonFeatures);
    // console.log(allFeatures);
    // console.log(uniqueFeatures);
}



main();