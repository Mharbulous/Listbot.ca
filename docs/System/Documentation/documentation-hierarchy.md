# CLAUDE-docs Hierarchy Plan 3: Feature-Module Organization

**Philosophy**: Organize documentation by business features/modules, mirroring the `src/features/` structure. When an LLM works on a feature, all documentation (UI, state, data, logic) is grouped together as a vertical slice.

**Optimization**: Best for vertical slice development, feature ownership, and modular architecture.

## JSON Structure

```json
{
  "CLAUDE-docs": {
    "description": "Root documentation folder for LLM guidance",
    "structure": {

      "System": {
        "description": "System-wide documentation",

        "Architecture": {
          "files": [
            "overview.md",
            "multi-app-sso.md",
            "solo-firm-architecture.md",
            "data-flow.md"
          ]
        },

        "Stack": {
          "files": [
            "vue3-composition-api.md",
            "vuetify3.md",
            "vite.md",
            "firebase.md",
            "pinia.md",
            "tailwind.md",
            "vitest.md"
          ]
        },

        "Conventions": {
          "files": [
            "coding-standards.md",
            "typescript-best-practices.md",
            "component-naming.md",
            "file-organization.md",
            "commit-messages.md",
            "design-system.md"
          ]
        },

        "Shared": {
          "description": "Shared components and utilities",
          "subdirs": {
            "BaseComponents": {
              "files": [
                "DocumentTable.md",
                "BaseSearchBar.md",
                "HoldToConfirmButton.md",
                "DragHandle.md",
                "SegmentedControl.md"
              ]
            },
            "Layout": {
              "files": ["AppHeader.md", "AppSideBar.md"]
            },
            "Composables": {
              "files": [
                "useVirtualTable.md",
                "useColumnResize.md",
                "useColumnSort.md",
                "useColumnVisibility.md",
                "useDocumentPeek.md",
                "useFirmMembers.md",
                "useMatters.md",
                "useUsers.md"
              ]
            }
          }
        }
      },

      "Features": {
        "description": "Business feature modules (vertical slices)",

        "Authentication": {
          "description": "Multi-app SSO authentication feature",
          "files": [
            "feature-overview.md",
            "auth-state-machine.md",
            "firebase-auth-integration.md",
            "session-management.md"
          ],
          "subdirs": {
            "Components": {
              "files": ["LoginForm.md", "AppSwitcher.md"]
            },
            "Stores": {
              "files": ["authStore.md", "teamStore.md"]
            },
            "Guards": {
              "files": ["auth-guard.md", "matter-guard.md"]
            },
            "Security": {
              "files": [
                "security-rules.md",
                "team-isolation.md"
              ]
            }
          }
        },

        "Upload": {
          "description": "File upload and processing feature",
          "files": [
            "feature-overview.md",
            "old-upload-page.md",
            "new-upload-page-testing-route.md",
            "upload-roadmap.md"
          ],
          "subdirs": {
            "UI": {
              "description": "Upload interface components",
              "files": [
                "FileUpload-component.md",
                "upload-queue.md",
                "progress-tracking.md",
                "drag-drop.md"
              ]
            },
            "Processing": {
              "description": "File processing logic",
              "files": [
                "file-lifecycle.md",
                "file-lifecycle-terminology.md",
                "3-phase-processing.md",
                "time-estimation.md",
                "hardware-calibration.md",
                "path-parsing.md"
              ]
            },
            "Deduplication": {
              "description": "File deduplication system",
              "files": [
                "deduplication-overview.md",
                "deduplication-terminology.md",
                "blake3-hashing.md",
                "size-prefilter.md",
                "hash-as-firestore-id.md",
                "duplicate-vs-copy-vs-redundant.md"
              ]
            },
            "Workers": {
              "description": "Web worker implementation",
              "files": [
                "fileHashWorker.md",
                "worker-communication.md",
                "worker-testing.md"
              ]
            },
            "Composables": {
              "files": [
                "useUploadAdapter.md",
                "useDeduplication.md",
                "useFileHashing.md",
                "useFileQueue.md"
              ]
            },
            "Storage": {
              "files": [
                "firebase-storage-paths.md",
                "upload-strategies.md",
                "file-naming.md"
              ]
            }
          }
        },

        "Organizer": {
          "description": "Document organization and viewing feature (documents, categories, viewer)",
          "files": [
            "feature-overview.md",
            "organizer-architecture.md"
          ],
          "subdirs": {
            "DocumentTable": {
              "description": "Document list/table interface",
              "files": [
                "document-table-architecture.md",
                "4-column-data-sources.md",
                "virtual-scrolling.md",
                "column-system.md",
                "cell-tooltips.md",
                "document-peek.md",
                "sorting-filtering.md"
              ]
            },
            "DocumentViewer": {
              "description": "Document viewing interface",
              "files": [
                "viewer-overview.md",
                "pdf-rendering.md",
                "thumbnail-panel.md",
                "metadata-panel.md",
                "navigation-bar.md",
                "tabs-system.md"
              ]
            },
            "Categories": {
              "description": "Category/tag management",
              "files": [
                "category-system-overview.md",
                "category-manager.md",
                "category-wizard.md",
                "tag-architecture.md",
                "editable-tags.md"
              ]
            },
            "AIAnalysis": {
              "description": "AI-powered document analysis",
              "files": [
                "ai-analysis-overview.md",
                "metadata-extraction.md",
                "ai-review-workflow.md",
                "ai-requirements.md"
              ]
            },
            "Components": {
              "files": [
                "DocumentTable-component.md",
                "DocumentNavigationBar.md",
                "PdfViewerArea.md",
                "PdfThumbnailPanel.md",
                "DocumentMetadataPanel.md",
                "AIAnalysisTab.md",
                "EditableTag.md"
              ]
            },
            "Stores": {
              "files": ["documentView.md"]
            },
            "Data": {
              "files": [
                "document-metadata-schema.md",
                "category-schema.md",
                "firestore-queries.md"
              ]
            }
          }
        },

        "Matters": {
          "description": "Matter/case management feature",
          "files": [
            "feature-overview.md",
            "solo-firm-matters.md",
            "matter-workflows.md"
          ],
          "subdirs": {
            "UI": {
              "description": "Matter management pages",
              "files": [
                "matters-list.md",
                "matter-detail.md",
                "new-matter.md",
                "edit-matter.md",
                "import-matters.md"
              ]
            },
            "Components": {
              "files": ["matter-table.md", "matter-forms.md"]
            },
            "Stores": {
              "files": ["matterStore.md", "matterView.md"]
            },
            "Data": {
              "files": [
                "matter-schema.md",
                "matter-queries.md"
              ]
            }
          }
        },

        "Profile": {
          "description": "User profile and settings",
          "files": [
            "feature-overview.md",
            "profile-page.md",
            "settings-page.md",
            "user-preferences.md"
          ],
          "subdirs": {
            "Data": {
              "files": ["user-schema.md", "firm-schema.md"]
            }
          }
        }
      },

      "Data": {
        "description": "Cross-feature data documentation",
        "files": [
          "firestore-overview.md",
          "collections-map.md",
          "query-patterns.md",
          "data-relationships.md"
        ],
        "subdirs": {
          "Security": {
            "files": [
              "firestore-security-rules.md",
              "storage-security-rules.md",
              "team-based-isolation.md"
            ]
          }
        }
      },

      "Testing": {
        "description": "Testing strategy and tools",
        "files": [
          "testing-overview.md",
          "vitest-setup.md",
          "unit-testing.md",
          "component-testing.md",
          "e2e-testing.md",
          "performance-testing.md",
          "web-worker-testing.md"
        ]
      },

      "DevOps": {
        "description": "Development and deployment",
        "files": [
          "local-development.md",
          "sso-dev-setup.md",
          "multi-app-development.md",
          "build-process.md",
          "deployment-promotion.md",
          "hosting-tips.md"
        ]
      },

      "TechnicalDebt": {
        "description": "Known issues and refactoring",
        "files": [
          "build-debt.md",
          "refactoring-priorities.md"
        ]
      },

      "AgentInstructions": {
        "description": "Claude Code agent guidance",
        "files": [
          "file-relocator.md",
          "beautifier.md",
          "test-engineer.md",
          "docs-engineer.md"
        ]
      }
    }
  }
}
```

## Key Advantages

1. **Feature ownership**: All documentation for a feature is in one place
2. **Vertical slice development**: UI, logic, state, and data docs are grouped together
3. **Code structure alignment**: Mirrors `src/features/` organization
4. **Independent feature work**: Can work on Upload feature without touching Organizer docs
5. **Team scaling**: Different teams can own different feature modules
6. **Modular refactoring**: Easy to refactor or extract features

## Potential Drawbacks

1. **Shared concerns**: Base components and utilities may not fit cleanly into features
2. **Cross-feature patterns**: Patterns used across features may be duplicated
3. **System-wide changes**: Architectural changes may require updating multiple feature folders

## Best Use Cases

- Feature development ("Implement deduplication in Upload feature")
- Feature ownership by teams
- Modular architecture refactoring
- Feature extraction/splitting
- Vertical slice testing
- Feature-specific bug fixes
- New feature planning

## Comparison to src/features/

This organization closely mirrors the codebase structure:
- `Features/Upload/` ↔ `src/features/upload/`
- `Features/Organizer/` ↔ `src/features/organizer/`

This makes it intuitive for developers to find relevant documentation alongside the code they're working on.
