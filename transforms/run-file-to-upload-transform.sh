#!/bin/bash

# File → Upload Terminology Transformation Script
# Runs jscodeshift transformation on all affected files

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TRANSFORM_SCRIPT="$SCRIPT_DIR/file-to-upload.transform.js"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  File → Upload Terminology Transformation                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if jscodeshift is available
if ! command -v jscodeshift &> /dev/null && ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: jscodeshift not found and npx not available${NC}"
    echo ""
    echo "Please install jscodeshift globally:"
    echo "  npm install -g jscodeshift"
    echo ""
    echo "Or ensure npx is available (comes with npm 5.2+)"
    exit 1
fi

# Determine which command to use
if command -v jscodeshift &> /dev/null; then
    JSCODESHIFT_CMD="jscodeshift"
else
    JSCODESHIFT_CMD="npx jscodeshift"
fi

# Parse command line arguments
DRY_RUN=""
if [[ "$1" == "--dry" ]] || [[ "$1" == "-d" ]]; then
    DRY_RUN="--dry"
    echo -e "${YELLOW}🔍 DRY RUN MODE - No files will be modified${NC}"
    echo ""
fi

# All affected files from the renaming plan
FILES=(
    # Phase 1: Types & Utilities
    "src/features/organizer/types/viewer.types.js"
    "src/features/organizer/utils/fileUtils.js"
    "src/utils/columnConfig.js"

    # Phase 2: Services
    "src/features/organizer/services/fileProcessingService.js"
    "src/features/organizer/services/aiProcessingService.js"

    # Phase 3: Stores
    "src/features/organizer/stores/organizerCore.js"

    # Phase 4: Composables
    "src/features/organizer/composables/useFilePreview.js"
    "src/features/organizer/composables/useFileViewer.js"

    # Phase 5: Components
    "src/features/organizer/components/FileListItemContent.vue"
    "src/features/organizer/components/FileItem.vue"
    "src/features/organizer/views/NewViewDocument2.vue"
)

echo -e "${BLUE}📋 Files to transform: ${#FILES[@]}${NC}"
echo ""

# Check if all files exist
MISSING_FILES=()
for file in "${FILES[@]}"; do
    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: ${#MISSING_FILES[@]} file(s) not found:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "   ${YELLOW}•${NC} $file"
    done
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
fi

# Build the file list (only existing files)
EXISTING_FILES=()
for file in "${FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        EXISTING_FILES+=("$PROJECT_ROOT/$file")
    fi
done

echo -e "${GREEN}🚀 Starting transformation...${NC}"
echo ""

# Run jscodeshift
cd "$PROJECT_ROOT"
$JSCODESHIFT_CMD -t "$TRANSFORM_SCRIPT" $DRY_RUN "${EXISTING_FILES[@]}"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Transformation completed successfully!${NC}"
    echo ""

    if [ -z "$DRY_RUN" ]; then
        echo -e "${BLUE}📝 Next steps:${NC}"
        echo ""
        echo "1. Review changes:"
        echo -e "   ${YELLOW}git diff${NC}"
        echo ""
        echo "2. Run linter:"
        echo -e "   ${YELLOW}npm run lint${NC}"
        echo ""
        echo "3. Run tests:"
        echo -e "   ${YELLOW}npm run test:run${NC}"
        echo ""
        echo "4. Check development server:"
        echo -e "   ${YELLOW}npm run dev${NC}"
        echo ""
        echo "5. Search for any remaining old references:"
        echo -e "   ${YELLOW}npx grep -r 'getFileExtension\\|\\bfiles\\b' src/${NC}"
    else
        echo -e "${YELLOW}To apply changes, run without --dry flag:${NC}"
        echo -e "   ${YELLOW}bash transforms/run-file-to-upload-transform.sh${NC}"
    fi
else
    echo -e "${RED}❌ Transformation failed with exit code $EXIT_CODE${NC}"
    exit $EXIT_CODE
fi
