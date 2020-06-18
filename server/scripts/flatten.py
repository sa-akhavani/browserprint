#!/usr/bin/env python3
import json
import sys


def flatten_obj_json(node):
    for key, value in node.items():
        if key in ("id", "cycle"):
            continue
        elif isinstance(value, dict):
            assert len(value.items()) == 1, "malformed complex value"
            subkey, subvalue = next(iter(value.items()))
            if subkey != "cycle":
                yield from flatten_obj_json(subvalue)
        else:
            yield (key, value)


def main(argv):
    try:
        file = open(argv[1])
    except IndexError:
        file = sys.stdin

    stuff = json.load(file)
    print(f"brid={stuff['brid']}", file=sys.stderr)
    print(f"compat={stuff['compat']}", file=sys.stderr)
    print("-" * 60, file=sys.stderr)
    for key, value in flatten_obj_json(stuff["features"]["globalObject"]):
        print(key, value)


if __name__ == "__main__":
    main(sys.argv)
