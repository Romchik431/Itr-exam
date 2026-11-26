#!/usr/bin/env bash
# Build the SDK-only application in a clean temporary directory.
set -euo pipefail
export LC_ALL=C.UTF-8 TZ=UTC
here=$(cd "$(dirname "$0")/.." && pwd)
sdk=${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK}
bt=${EXAM_BUILD_TOOLS:-"$sdk/build-tools/35.0.0"}
api=${EXAM_PLATFORM:-"$sdk/platforms/android-35/android.jar"}
dest=${1:-"$here/build/ExamPro.apk"}
bank=${EXAM_BANK:-"$here/assets/builtin.json"}
test -f "$bank"
dest=$(realpath -m "$dest")
mkdir -p "$(dirname "$dest")"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/gen" "$work/classes" "$work/dex" "$work/assets"
for part in core.js ui.js index.html style.css; do cp "$here/assets/$part" "$work/assets/$part"; done
cp "$bank" "$work/assets/builtin.json"
node -e 'const fs=require("fs"), e=require(process.argv[1]); e.checkBank(JSON.parse(fs.readFileSync(process.argv[2])));' "$here/assets/core.js" "$bank"
"$bt/aapt2" compile --dir "$here/res" -o "$work/resources.zip"
"$bt/aapt2" link -I "$api" --manifest "$here/AndroidManifest.xml" --java "$work/gen" -A "$work/assets" -o "$work/base.apk" "$work/resources.zip"
mapfile -t sources < <(find "$here/src" "$work/gen" -name '*.java' -type f | sort)
java -m jdk.compiler/com.sun.tools.javac.Main -encoding UTF-8 -Xlint:-options -source 8 -target 8 -bootclasspath "$bt/core-lambda-stubs.jar:$api" -d "$work/classes" "${sources[@]}"
(cd "$work/classes" && zip -q -X -r "$work/classes.jar" .)
java -cp "$bt/lib/d8.jar" com.android.tools.r8.D8 --release --min-api 28 --lib "$api" --output "$work/dex" "$work/classes.jar"
python3 - "$work/base.apk" "$work/dex/classes.dex" "$work/package.apk" <<'PY'
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import sys
with ZipFile(sys.argv[1]) as base,ZipFile(sys.argv[3],"w") as out:
    entries=[(i.filename,base.read(i),i.compress_type) for i in base.infolist()]
    entries.append(("classes.dex",Path(sys.argv[2]).read_bytes(),ZIP_DEFLATED))
    for name,payload,compression in sorted(entries):
        info=ZipInfo(name,(2009,1,1,0,0,0))
        info.compress_type=compression
        info.external_attr=0o644<<16
        out.writestr(info,payload)
PY
"$bt/zipalign" -f -p 4 "$work/package.apk" "$work/aligned.apk"
: "${EXAM_KEYSTORE:?Set EXAM_KEYSTORE to the release PKCS12 path}"
: "${EXAM_PASS_FILE:?Set EXAM_PASS_FILE to a password file}"
java -jar "$bt/lib/apksigner.jar" sign --ks "$EXAM_KEYSTORE" --ks-key-alias "${EXAM_KEY_ALIAS:-exampro}" --ks-pass "file:$EXAM_PASS_FILE" --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false --out "$work/signed.apk" "$work/aligned.apk"
java -jar "$bt/lib/apksigner.jar" verify --verbose --print-certs "$work/signed.apk"
"$bt/zipalign" -c -p 4 "$work/signed.apk"
cp "$work/signed.apk" "$dest"
sha256sum "$dest"

