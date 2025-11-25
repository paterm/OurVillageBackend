#!/bin/sh
# wait-for-it.sh

set -e

host="$1"
port="$2"
timeout="${3:-30}"

echo "Waiting for $host:$port with timeout $timeout seconds..."

for i in `seq $timeout` ; do
  if nc -z "$host" "$port" > /dev/null 2>&1 ; then
    echo "$host:$port is available!"
    exit 0
  fi
  echo "Waiting for $host:$port... ($i/$timeout)"
  sleep 1
done

echo "Timeout waiting for $host:$port" >&2
exit 1