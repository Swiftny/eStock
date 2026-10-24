"""Check changed paths against the team's work areas; no files are modified."""
import argparse
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SCOPES = json.loads((ROOT / "scripts/work-scopes.json").read_text())


def matches(path, pattern):
    if pattern.endswith("/**"):
        return path.startswith(pattern[:-2])
    return path == pattern


def git_paths(*args):
    result = subprocess.run(
        ["git", *args], cwd=ROOT, check=True, capture_output=True
    )
    return result.stdout.decode("utf-8", errors="surrogateescape").split("\0")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scope", choices=sorted(SCOPES))
    parser.add_argument("--base", help="Compare a branch against its merge base with this ref")
    parser.add_argument("--files", nargs="+", help="Check explicit repository-relative paths")
    args = parser.parse_args()
    if args.files and args.base:
        parser.error("Choose --files or --base, not both")
    try:
        if args.files:
            paths = args.files
        else:
            paths = git_paths("diff", "--name-only", "--no-renames", "-z", "HEAD", "--")
            paths += git_paths("ls-files", "--others", "--exclude-standard", "-z")
            if args.base:
                paths += git_paths("diff", "--name-only", "--no-renames", "-z", args.base + "...HEAD", "--")
    except subprocess.CalledProcessError as error:
        print(error.stderr.decode(errors="replace"), file=sys.stderr)
        return 2
    blocked = []
    paths = sorted(set(path for path in paths if path))
    for path in paths:
        if not any(matches(path, pattern) for pattern in SCOPES[args.scope]):
            areas = [name for name, patterns in SCOPES.items()
                     if any(matches(path, pattern) for pattern in patterns)]
            blocked.append((path, ", ".join(areas) or "shared / integration"))
    if blocked:
        print(f"FAIL: {args.scope} includes changes outside its area:")
        for path, area in blocked:
            print(f"  {path} -> {area}")
        print("Separate this change or coordinate a shared integration task; do not discard others' work.")
        return 1
    print(f"PASS: {len(paths)} path(s) within {args.scope}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
