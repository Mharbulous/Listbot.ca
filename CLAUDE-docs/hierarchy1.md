# CLAUDE-docs Hierarchy Plan 1: Page-Centric Organization

**Philosophy**: Organize documentation by UI pages/routes. When an LLM is working on a specific page feature, all relevant documentation is grouped together.

**Optimization**: Best for feature-focused work where tasks are scoped to specific user-facing pages.

## JSON Structure

```json
{
  "CLAUDE-docs": {
    "description": "Root documentation folder for LLM guidance",
    "structure": {

      "Stack": {
        "description": "Technology stack and framework documentation",
        "files": [
          "vue3-composition-api.md",
          "vuetify3-components.md",
          "vite-build-system.md",
          "firebase-services.md",
          "pinia-state-management.md",
          "tailwind-styling.md",
          "vitest-testing.md"
        ]
      },

      "Conventions": {
        "description": "Coding standards and best practices",
        "files": [
          "typescript-ref-typing.md",
          "component-naming.md",
          "file-organization.md",
          "commit-messages.md",
          "design-system.md"
        ]
      },

      "SSO-Auth": {
        "description": "Multi-app SSO authentication system",
        "files": [
          "auth-state-machine.md",
          "solo-firm-architecture.md",
          "route-guards.md",
          "firebase-auth-integration.md",
          "multi-app-session-sync.md"
        ],
        "subdirs": {
          "Components": {
            "files": ["LoginForm.md", "AppSwitcher.md"]
          },
          "Stores": {
            "files": ["authStore.md", "teamStore.md"]
          }
        }
      },

      "Pages": {
        "description": "Documentation organized by user-facing pages/routes",

        "Home": {
          "description": "Home/About page documentation",
          "files": [
            "overview.md",
            "home-tabs.md",
            "first-app-setup.md"
          ]
        },

        "Matters": {
          "description": "Matter management pages",
          "files": [
            "matters-list.md",
            "matter-detail.md",
            "new-matter.md",
            "edit-matter.md",
            "import-matters.md",
            "solo-firm-matters-architecture.md"
          ],
          "subdirs": {
            "Components": {
              "files": ["matter-table.md", "matter-form.md"]
            },
            "Stores": {
              "files": ["matterStore.md", "matterView.md"]
            }
          }
        },

        "Upload": {
          "description": "File upload interface (legacy and new)",
          "files": [
            "upload-overview.md",
            "old-upload-page.md",
            "new-upload-page-testing-route.md",
            "upload-workflow.md"
          ],
          "subdirs": {
            "FileProcessing": {
              "description": "File processing logic and deduplication",
              "files": [
                "file-lifecycle.md",
                "3-phase-time-estimation.md",
                "deduplication-strategy.md",
                "blake3-hashing.md",
                "web-worker-hashing.md",
                "hardware-calibration-h-factor.md",
                "path-parsing-optimization.md"
              ]
            },
            "Terminology": {
              "description": "Critical file lifecycle terminology",
              "files": [
                "file-states.md",
                "deduplication-terms.md"
              ]
            },
            "Components": {
              "files": [
                "FileUpload-component.md",
                "upload-queue.md",
                "progress-tracking.md"
              ]
            },
            "Composables": {
              "files": [
                "useUploadAdapter.md",
                "useDeduplication.md",
                "useFileHashing.md"
              ]
            }
          }
        },

        "Documents": {
          "description": "Document table and document viewer",
          "files": [
            "documents-overview.md",
            "document-table-architecture.md",
            "4-column-data-sources.md"
          ],
          "subdirs": {
            "DocumentTable": {
              "files": [
                "virtual-scrolling.md",
                "column-system.md",
                "cell-tooltips.md",
                "document-peek.md",
                "sorting-filtering.md"
              ]
            },
            "DocumentViewer": {
              "files": [
                "viewer-overview.md",
                "pdf-rendering.md",
                "thumbnail-panel.md",
                "metadata-panel.md",
                "navigation-bar.md"
              ]
            },
            "AIAnalysis": {
              "files": [
                "ai-analysis-tab.md",
                "metadata-extraction.md",
                "ai-review-workflow.md"
              ]
            },
            "Components": {
              "files": [
                "DocumentTable.md",
                "DocumentNavigationBar.md",
                "PdfViewerArea.md",
                "PdfThumbnailPanel.md",
                "DocumentMetadataPanel.md"
              ]
            },
            "Stores": {
              "files": ["documentView.md"]
            }
          }
        },

        "Categories": {
          "description": "Category/tag management system",
          "files": [
            "category-manager.md",
            "category-creation-wizard.md",
            "category-edit-wizard.md",
            "tag-architecture.md"
          ],
          "subdirs": {
            "Components": {
              "files": ["EditableTag.md", "category-forms.md"]
            }
          }
        },

        "Profile": {
          "description": "User profile and settings",
          "files": [
            "profile-page.md",
            "settings-page.md",
            "user-preferences.md"
          ]
        }
      },

      "Data": {
        "description": "Data structures and Firestore schema",
        "files": [
          "firestore-collections.md",
          "document-metadata-schema.md",
          "matter-schema.md",
          "category-schema.md",
          "user-schema.md",
          "firm-schema.md"
        ],
        "subdirs": {
          "Storage": {
            "files": [
              "firebase-storage-architecture.md",
              "storage-paths.md",
              "file-naming.md"
            ]
          },
          "Security": {
            "files": [
              "firestore-security-rules.md",
              "storage-security-rules.md",
              "team-based-isolation.md"
            ]
          }
        }
      },

      "Workflows": {
        "description": "End-to-end user workflows",
        "files": [
          "document-processing-workflow.md",
          "firm-workflows.md",
          "evidence-list-workflow.md"
        ]
      },

      "DevOps": {
        "description": "Development and deployment",
        "files": [
          "local-dev-setup.md",
          "sso-development-setup.md",
          "build-process.md",
          "deployment-promotion.md",
          "hosting-tips.md"
        ]
      },

      "Testing": {
        "description": "Testing strategies and setup",
        "files": [
          "vitest-setup.md",
          "unit-testing.md",
          "component-testing.md",
          "sso-e2e-testing.md",
          "performance-testing.md"
        ]
      },

      "TechnicalDebt": {
        "description": "Known issues and improvements needed",
        "files": [
          "build-debt.md",
          "refactoring-todos.md"
        ]
      },

      "AgentInstructions": {
        "description": "Special instructions for Claude Code agents",
        "files": [
          "file-relocator.md",
          "beautifier.md",
          "test-engineer.md"
        ]
      }
    }
  }
}
```

## Key Advantages

1. **Feature-focused discovery**: When working on the Upload page, all related docs (processing, deduplication, components) are nested under `Pages/Upload/`
2. **Intuitive navigation**: Mirrors user's mental model of the application
3. **Minimal cognitive load**: "I'm working on Documents page" → look in `Pages/Documents/`
4. **Clear scope boundaries**: Each page folder contains everything needed for that feature

## Potential Drawbacks

1. **Cross-cutting concerns**: Shared components or patterns may be duplicated across page folders
2. **Architectural changes**: System-wide refactors require visiting multiple page folders
3. **Code reuse**: Harder to find reusable patterns when they're scoped to specific pages

## Best Use Cases

- Feature development tasks ("Add filter to Documents table")
- Bug fixes on specific pages ("Fix upload progress bar")
- Page-specific refactoring ("Redesign Categories UI")
- New developer onboarding focused on specific features
