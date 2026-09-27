"""Re-packages generated .usdz files with Pixar's ARKit packager (needs `pip install usd-core`).
Usage: python scripts/package_usdz.py [file.usdz ...]   (default: every public/models/*.usdz)"""
import glob, os, shutil, sys, tempfile, zipfile
from pxr import UsdUtils

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = sys.argv[1:] or sorted(glob.glob(os.path.join(root, "public", "models", "*.usdz")))
ok = 0
for f in files:
    tmp = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(f) as z:
            z.extractall(tmp)
        out = os.path.join(tmp, "out.usdz")
        good = UsdUtils.CreateNewARKitUsdzPackage(os.path.join(tmp, "model.usda"), out)
        if good and os.path.exists(out):
            shutil.copyfile(out, f)
            ok += 1
            print("OK  ", os.path.basename(f), os.path.getsize(f) // 1024, "KB")
        else:
            print("FAIL", os.path.basename(f))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
print(f"{ok}/{len(files)} packaged")
