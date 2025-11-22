#!/usr/bin/env python3
"""
PRD Validation Script

Validates that a Product Requirements Document contains all required sections
and provides a completeness report.

Usage:
    python validate_prd.py <path-to-prd.md>
"""

import sys
import re
from pathlib import Path
from typing import List, Tuple, Dict

# Required sections in a complete PRD
REQUIRED_SECTIONS = [
    "Product Vision & Goals",
    "Target Users",
    "Feature Overview",
    "Epic Breakdown",
    "Non-Functional Requirements",
    "Success Metrics",
    "Release Planning",
    "Assumptions & Dependencies",
    "Constraints & Risks",
    "Out of Scope"
]

# Recommended subsections
RECOMMENDED_SUBSECTIONS = {
    "Product Vision & Goals": ["Vision Statement", "Product Goals", "Success Metrics"],
    "Target Users": ["Primary Persona"],
    "Epic Breakdown": ["User Stories", "Acceptance Criteria"],
    "Non-Functional Requirements": ["Performance", "Security", "Scalability"],
}


def validate_prd(file_path: str) -> Dict:
    """Validate PRD structure and content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)

    results = {
        "file": file_path,
        "total_sections": len(REQUIRED_SECTIONS),
        "found_sections": [],
        "missing_sections": [],
        "warnings": [],
        "epic_count": 0,
        "story_count": 0,
        "has_acceptance_criteria": False
    }

    # Check for required sections
    for section in REQUIRED_SECTIONS:
        # Look for section headers (## or ###)
        pattern = rf'^###+\s*\d*\.?\s*{re.escape(section)}'
        if re.search(pattern, content, re.MULTILINE | re.IGNORECASE):
            results["found_sections"].append(section)
        else:
            results["missing_sections"].append(section)

    # Count epics (look for "Epic:" patterns)
    epic_pattern = r'^###?\s*Epic.*:'
    results["epic_count"] = len(re.findall(epic_pattern, content, re.MULTILINE | re.IGNORECASE))

    # Count user stories (look for "As a" pattern)
    story_pattern = r'\*\*As a\*\*'
    results["story_count"] = len(re.findall(story_pattern, content, re.IGNORECASE))

    # Check for acceptance criteria
    if "acceptance criteria" in content.lower():
        results["has_acceptance_criteria"] = True

    # Generate warnings
    if results["epic_count"] == 0:
        results["warnings"].append("No epics found in Epic Breakdown section")
    
    if results["story_count"] == 0:
        results["warnings"].append("No user stories found (no 'As a' statements)")
    
    if not results["has_acceptance_criteria"]:
        results["warnings"].append("No acceptance criteria found in any stories")

    # Check for empty sections
    for section in results["found_sections"]:
        pattern = rf'^###+\s*\d*\.?\s*{re.escape(section)}\s*$(.*?)(?=^##|\Z)'
        match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
        if match:
            section_content = match.group(1).strip()
            # Check if section has minimal content (less than 50 chars excluding whitespace)
            if len(section_content.replace('\n', '').replace(' ', '')) < 50:
                results["warnings"].append(f"Section '{section}' appears to be empty or incomplete")

    return results


def print_report(results: Dict):
    """Print validation report."""
    print("\n" + "="*70)
    print("PRD VALIDATION REPORT")
    print("="*70)
    print(f"\nFile: {results['file']}\n")

    # Section completeness
    found_count = len(results["found_sections"])
    total_count = results["total_sections"]
    completeness = (found_count / total_count) * 100

    print(f"Section Completeness: {found_count}/{total_count} ({completeness:.1f}%)")
    
    if results["found_sections"]:
        print("\n✅ Found Sections:")
        for section in results["found_sections"]:
            print(f"   • {section}")

    if results["missing_sections"]:
        print("\n❌ Missing Sections:")
        for section in results["missing_sections"]:
            print(f"   • {section}")

    # Content statistics
    print(f"\n📊 Content Statistics:")
    print(f"   • Epics: {results['epic_count']}")
    print(f"   • User Stories: {results['story_count']}")
    print(f"   • Has Acceptance Criteria: {'Yes' if results['has_acceptance_criteria'] else 'No'}")

    # Warnings
    if results["warnings"]:
        print("\n⚠️  Warnings:")
        for warning in results["warnings"]:
            print(f"   • {warning}")

    # Overall status
    print("\n" + "-"*70)
    if completeness == 100 and not results["warnings"]:
        print("✅ PRD VALIDATION PASSED - Document appears complete!")
    elif completeness >= 80:
        print("⚠️  PRD VALIDATION PARTIAL - Most sections present but review warnings")
    else:
        print("❌ PRD VALIDATION FAILED - Critical sections missing")
    print("-"*70 + "\n")

    return completeness >= 80 and len(results["warnings"]) == 0


def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_prd.py <path-to-prd.md>")
        print("\nExample:")
        print("  python validate_prd.py my-product-prd.md")
        sys.exit(1)

    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)

    results = validate_prd(file_path)
    success = print_report(results)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
