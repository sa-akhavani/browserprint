#!/usr/bin/env python3
from collections import defaultdict
import json
import os
import pprint
import sys


def load_txt_results(filename):
    with open(filename) as fd:
        user_agent = next(fd).strip()
        features_found = list(filter(None, map(str.strip, fd)))
        return user_agent, features_found


def load_json_results(filename):
    with open(filename) as fd:
        data = json.load(fd)
        return data['userAgent'], data['featuresFound']


def load_result_file(filename):
    _, ext = os.path.splitext(filename)
    if ext == ".txt":
        return load_txt_results(filename)
    elif ext == ".json":
        return load_json_results(filename)
    else:
        raise ValueError("Unknown result file extension '{0}' (.txt and .json supported)".format(ext))


def main(argv):
    files = argv[1:]

    unique_features = set()
    feature_map = defaultdict(set)
    agent_map = {}
    for f in files:
        user_agent, features_found = load_result_file(f)
        agent_map[user_agent] = os.path.splitext(os.path.basename(f))[0]
        for feature in features_found:
            unique_features.add(feature)
            feature_map[feature].add(user_agent)
   
    buckets = defaultdict(list)
    for feature, user_agents in feature_map.items():
        key = frozenset(map(agent_map.__getitem__, user_agents))
        buckets[key].append(feature)

    data = {
        'browserFeatures': list(sorted(unique_features)),
        'browserClusters': { '/'.join(sorted(cluster)) if len(cluster) < len(files) else '*' : list(sorted(features)) for cluster, features in buckets.items() }
    }

    json.dump(data, sys.stdout)


if __name__ == "__main__":
    main(sys.argv)

