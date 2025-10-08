set -euo pipefail

# Config
BASE_URL="https://tcgcsv.com/archive/tcgplayer"
TARGET_DIR="$HOME/bountyhunter/backend/prices/prev"
DAYS_BACK=14  # change this if you want more/less
BACKEND_DIR="$HOME/bountyhunter/backend"

for i in $(seq 1 $((DAYS_BACK))); do
    DATE=$(date -d "-$i day" +%Y-%m-%d)
    ARCHIVE="prices-${DATE}.ppmd.7z"
    ARCHIVE_URL="$BASE_URL/$ARCHIVE"

    echo "========== $DATE =========="

    if [ -d "$TARGET_DIR/bak/$DATE" ]; then
        echo "  Skipping (already exists)"
        continue
    fi

    echo "  Downloading $ARCHIVE_URL..."
    if ! curl -f -s -O "$ARCHIVE_URL"; then
        echo "  Failed to download $ARCHIVE_URL"
        continue
    fi

    TMP_DIR=$(mktemp -d)

    echo "  Extracting '68/'..."
    # Extract quietly: show progress but not file list
    if ! 7z x -y "$ARCHIVE" "*/68/*" -o"$TMP_DIR" -bso0; then
        echo "  Extraction failed for $ARCHIVE"
        rm -rf "$TMP_DIR" "$ARCHIVE"
        continue
    fi

    SRC_DIR="$TMP_DIR/$DATE/68"
    DEST_DIR="$TARGET_DIR/$DATE"

    mkdir -p "$DEST_DIR"
    mv "$SRC_DIR"/* "$DEST_DIR/"

    rm -rf "$TMP_DIR" "$ARCHIVE"

    echo "  ✅ Finished: $DEST_DIR"
    echo

    # python3 "$BACKEND_DIR/manage.py" import_history
done

echo "All done!"