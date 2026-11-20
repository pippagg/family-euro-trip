#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p models
B=https://huggingface.co/tphakala/BirdNET-v3.0-Models/resolve/main/regional/indo-gangetic
N=birdnet-v3.0-preview3.1-indo-gangetic
for f in $N-fp32-b1.onnx $N-labels-b1.txt; do
  [ -s models/$f ] || curl -L --fail -o models/$f $B/$f
done
