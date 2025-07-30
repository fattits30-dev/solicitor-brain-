#!/bin/bash
# Install desktop launcher

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo "Installing Solicitor Brain desktop launcher..."

# Copy desktop file to user's applications
mkdir -p ~/.local/share/applications
cp "$APP_DIR/solicitor-brain.desktop" ~/.local/share/applications/

# Update desktop file with correct paths
sed -i "s|Exec=.*|Exec=$APP_DIR/scripts/launch_app.sh|" ~/.local/share/applications/solicitor-brain.desktop
sed -i "s|Icon=.*|Icon=$APP_DIR/assets/icon.png|" ~/.local/share/applications/solicitor-brain.desktop

# Create icon if it doesn't exist
mkdir -p "$APP_DIR/assets"
if [ ! -f "$APP_DIR/assets/icon.png" ]; then
    # Create a simple icon using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 256x256 xc:navy \
            -fill white -pointsize 72 \
            -gravity center -annotate +0+0 'SB' \
            "$APP_DIR/assets/icon.png"
    else
        echo "Note: Install ImageMagick to generate icon"
    fi
fi

# Update desktop database
update-desktop-database ~/.local/share/applications/ 2>/dev/null || true

echo "Desktop launcher installed!"
echo "You can now find 'Solicitor Brain' in your applications menu"