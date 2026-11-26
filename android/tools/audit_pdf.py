"""Verify the shipped ITR bank against two independent Poppler text layouts.
Usage: python3 tools/audit_pdf.py original.pdf assets/builtin.json [original.html]
"""
from pathlib import Path
import collections
import hashlib
import json
import re
import subprocess
import sys
pdf, data = map(Path, sys.argv[1:3])
bank = json.loads(data.read_text(encoding="utf-8"))["questions"]
def extracted(mode):
    return subprocess.check_output(["pdftotext", mode, str(pdf), "-"]).decode("utf-8")
def normalize(value):
    return re.sub(r"[\s_]+", "", value)
raw, layout = extracted("-raw"), extracted("-layout")
parts = re.split(r"В\s*О\s*П\s*Р\s*О\s*С\s+(\d+)", raw)
heads = list(re.finditer(r"(?m)^\s*В\s*О\s*П\s*Р\s*О\s*С\s+(\d+)\s*$", layout))
numbers = list(range(1,370))
assert [q["no"] for q in bank] == [int(x) for x in parts[1::2]] == [int(h[1]) for h in heads] == numbers
assert len(layout.rstrip("\f").split("\f")) == 72
for q, text, head in zip(bank, parts[2::2], heads):
    n = q["no"]
    assert q["id"] == str(n)
    assert q["page"] == layout[:head.start(1)].count("\f")+1
    assert [o["id"] for o in q["options"]] == [str(i+1) for i in range(len(q["options"]))]
    original = q["sourceKeys"]
    assert len(original) == (0 if n == 31 else 1)
    assert all(key in {o["id"] for o in q["options"]} for key in original)
    assert q["keys"] == (["1"] if n == 31 else [] if n == 322 else original)
    labels = [str(i) + ("" if i == 1 and n in (125,270,280) else ".") for i in range(1,len(q["options"])+1)]
    body = q["text"]+"".join(label+o["text"] for label,o in zip(labels,q["options"]))
    body += ("N="+original[0] if original else "") + q.get("sourceNote","")
    assert normalize(body) == normalize(text), f"Source mismatch at {n}"
if len(sys.argv)>3:
    html = Path(sys.argv[3]).read_text(encoding="utf-8")
    former = json.loads(html.split("const bank=",1)[1].split(";\nconst auditRows=",1)[0])
    assert len(former) == len(bank)
    for old,new in zip(former,bank):
        assert old["q"] == new["text"] and old["a"] == [o["text"] for o in new["options"]]
        assert old["k"] == (int(new["sourceKeys"][0])-1 if new["sourceKeys"] else None)
        assert old["note"] == new["sourceNote"] and old["page"] == new["page"]
groups=collections.defaultdict(list)
for q in bank: groups[q["text"]].append(q["no"])
print("PDF SHA-256",hashlib.sha256(pdf.read_bytes()).hexdigest())
print("pages=72 questions=",len(bank),"options=",sum(len(q["options"]) for q in bank),
      "source_keys=",sum(bool(q["sourceKeys"]) for q in bank),"notes=",sum(bool(q["sourceNote"]) for q in bank),
      "graded=",sum(bool(q["keys"]) for q in bank),"dated_review=",sum(bool(q.get("reviewed")) for q in bank))
print("Option counts",dict(collections.Counter(len(q["options"]) for q in bank)))
print("Duplicate prompts",[ids for ids in groups.values() if len(ids)>1])

