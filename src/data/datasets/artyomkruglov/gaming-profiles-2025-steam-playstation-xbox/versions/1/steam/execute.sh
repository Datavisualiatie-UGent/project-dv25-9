#!/bin/bash

INPUT="reviews.csv"
PREFIX="reviews_"
MAXSIZE=$((90*1024*1024))  # 100MB
HEADER=$(head -n 1 "$INPUT")
COUNT=1
FILENAME="${PREFIX}part_${COUNT}.csv"

# Initialize output file with header
echo "$HEADER" > "$FILENAME"

# Use awk for buffered splitting
tail -n +2 "$INPUT" | awk -v maxsize="$MAXSIZE" -v header="$HEADER" -v prefix="$PREFIX" '
BEGIN {
    part = 1
    filename = prefix "part_" part ".csv"
    print header > filename
    size = length(header) + 1  # newline
}
{
    line = $0
    size += length(line) + 1
    if (size >= maxsize) {
        part++
        filename = prefix "part_" part ".csv"
        print header > filename
        size = length(header) + length(line) + 2
    }
    print line >> filename
}
'
