# Browserprint: An Analysis of the Impact of Browser Features on Fingerprintability and Web Privacy

This repository contains the datasets and source code related to the [paper](https://par.nsf.gov/servlets/purl/10325808): "Browserprint: An Analysis of the Impact of Browser Features on Fingerprintability and Web Privacy". More information about the paper could be accessed [here](https://link.springer.com/chapter/10.1007/978-3-030-91356-4_9).

## Citation
If you are planning to use the datasets or results of this project, you can cite this paper using the following BibTEX template:
```
@InProceedings{isc2021browserprint,
title="Browserprint: an Analysis of the Impact of Browser Features on Fingerprintability and Web Privacy",
author="Akhavani, Seyed Ali and Jueckstock, Jordan and Su, Junhua and Kapravelos, Alexandros and Kirda, Engin and Lu, Long",
booktitle="Information Security",
pages="161--176",
year="2021",
editor="Liu, Joseph K. and Katsikas, Sokratis and Meng, Weizhi and Susilo, Willy and Intan, Rolly",
publisher="Springer International Publishing",
isbn="978-3-030-91356-4"
}
```

## Datasets
All the datasets and reports generated in our research could be found in the [dataset](./dataset) directory.

### Fingerprinting APIs List
List of all suspicious fingerprinting APIs discussed in the paper. Access it [here](./dataset/fingerprinting-apis.py) or go to ```dataset/fingerprinting-apis.py```

### Browsers Fingerprinting Report
List of all browser versions and number of fingerprinting APIs, total features, added features, and removed features are included in this report. It could be accessed via [feature-fingerprinting-report.csv](./dataset/feature-fingerprinting-report.csv)

### Feature Reports
Detailed feature report for each Chrome, Firefox, and Opera version could be accessed in [feature-reports](./dataset/feature-reports) directory.

### Feature Categories
Feature category ratios in Chrome, Firefox, and Opera. Accessed via [featureCategoriesReport.csv](./dataset/featureCategoriesReport.csv)


## Contributors
Seyed Ali Akhavani, Jordan Jueckstock, Junhua Su, Alexandros Kapravelos, Engin Kirda, Long Lu
