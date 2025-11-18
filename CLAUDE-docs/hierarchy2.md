# CLAUDE-docs Hierarchy Plan 2: Architectural Layer Organization

**Philosophy**: Organize documentation by architectural concerns (Frontend, Backend, State, Data). When an LLM needs to understand system-wide patterns, all related documentation is grouped by layer.

**Optimization**: Best for architectural work, refactoring, and understanding system-wide patterns.

## JSON Structure

```json
{
  "CLAUDE-docs": {
    "description": "Root documentation folder for LLM guidance",
    "structure": {

      "Architecture": {
        "description": "High-level system architecture",
        "files": [
          "overview.md",
          "multi-app-sso-architecture.md",
          "solo-firm-architecture.md",
          "data-flow.md"
        ]
      },

      "Frontend": {
        "description": "All frontend/UI layer documentation",

        "Framework": {
          "description": "Core framework and build tools",
          "files": [
            "vue3-composition-api.md",
            "vite-configuration.md",
            "router-setup.md",
            "route-guards.md"
          ]
        },

        "UI-Components": {
          "description": "Component library and patterns",
          "files": [
            "vuetify3-integration.md",
            "base-components.md",
            "feature-components.md",
            "component-naming-conventions.md"
          ],
          "subdirs": {
            "Layout": {
              "files": ["AppHeader.md", "AppSideBar.md", "page-layouts.md"]
            },
            "Tables": {
              "files": [
                "DocumentTable-architecture.md",
                "virtual-scrolling.md",
                "column-system.md",
                "cell-tooltips.md",
                "sorting-filtering.md"
              ]
            },
            "Forms": {
              "files": ["matter-forms.md", "category-forms.md", "form-validation.md"]
            },
            "Upload": {
              "files": [
                "FileUpload-component.md",
                "upload-queue-ui.md",
                "progress-indicators.md"
              ]
            },
            "DocumentViewer": {
              "files": [
                "pdf-viewer.md",
                "thumbnail-panel.md",
                "metadata-panel.md",
                "navigation-controls.md"
              ]
            }
          }
        },

        "Styling": {
          "description": "CSS and design system",
          "files": [
            "tailwind-configuration.md",
            "vuetify-tailwind-integration.md",
            "design-guidelines.md",
            "responsive-design.md"
          ]
        },

        "Views": {
          "description": "Page-level view documentation",
          "files": [
            "Home.md",
            "Matters.md",
            "Documents.md",
            "Upload.md",
            "Categories.md",
            "Profile.md",
            "Settings.md"
          ]
        }
      },

      "State": {
        "description": "State management layer",

        "Pinia-Stores": {
          "description": "All Pinia store documentation",
          "files": [
            "store-architecture.md",
            "authStore.md",
            "teamStore.md",
            "matterStore.md",
            "documentView.md",
            "matterView.md"
          ]
        },

        "Composables": {
          "description": "Reusable composition functions",
          "files": [
            "composables-overview.md",
            "useMatters.md",
            "useUsers.md",
            "useFirmMembers.md",
            "useAIAnalysis.md",
            "useDocumentPeek.md",
            "useVirtualTable.md",
            "useColumnResize.md",
            "useColumnSort.md",
            "useColumnVisibility.md"
          ],
          "subdirs": {
            "Upload": {
              "files": [
                "useUploadAdapter.md",
                "useDeduplication.md",
                "useFileHashing.md",
                "useFileQueue.md"
              ]
            }
          }
        }
      },

      "Data": {
        "description": "Data layer and persistence",

        "Firestore": {
          "description": "Firestore database",
          "files": [
            "collections-overview.md",
            "document-schema.md",
            "matter-schema.md",
            "category-schema.md",
            "user-schema.md",
            "firm-schema.md",
            "query-patterns.md"
          ]
        },

        "FirebaseStorage": {
          "description": "Firebase Storage for files",
          "files": [
            "storage-architecture.md",
            "path-structure.md",
            "file-naming.md",
            "upload-strategies.md"
          ]
        },

        "Security": {
          "description": "Security rules and data isolation",
          "files": [
            "firestore-security-rules.md",
            "storage-security-rules.md",
            "team-based-isolation.md",
            "security-testing.md"
          ]
        }
      },

      "Business-Logic": {
        "description": "Core business logic and algorithms",

        "FileProcessing": {
          "description": "File upload and processing",
          "files": [
            "file-lifecycle.md",
            "file-lifecycle-terminology.md",
            "3-phase-processing.md",
            "time-estimation-formulas.md",
            "hardware-calibration.md"
          ]
        },

        "Deduplication": {
          "description": "File deduplication system",
          "files": [
            "deduplication-strategy.md",
            "deduplication-terminology.md",
            "blake3-hashing.md",
            "size-prefilter.md",
            "hash-as-id.md",
            "web-worker-implementation.md"
          ]
        },

        "AI": {
          "description": "AI-powered features",
          "files": [
            "ai-analysis-system.md",
            "metadata-extraction.md",
            "ai-review-workflow.md",
            "ai-requirements.md"
          ]
        },

        "Categories": {
          "description": "Category/tagging system",
          "files": [
            "category-architecture.md",
            "tag-system.md",
            "category-workflows.md"
          ]
        }
      },

      "Authentication": {
        "description": "Multi-app SSO authentication",
        "files": [
          "auth-state-machine.md",
          "firebase-auth-v9.md",
          "route-guards.md",
          "session-persistence.md",
          "multi-app-sync.md"
        ],
        "subdirs": {
          "Components": {
            "files": ["LoginForm.md", "AppSwitcher.md"]
          }
        }
      },

      "Workflows": {
        "description": "End-to-end business workflows",
        "files": [
          "document-processing-workflow.md",
          "firm-workflows.md",
          "upload-to-review-flow.md",
          "matter-creation-flow.md"
        ]
      },

      "Testing": {
        "description": "Testing strategy and implementation",
        "files": [
          "testing-overview.md",
          "vitest-configuration.md",
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
          "build-process.md",
          "deployment-promotion.md",
          "hosting-tips.md"
        ]
      },

      "TechnicalDebt": {
        "description": "Known issues and refactoring needs",
        "files": [
          "build-debt.md",
          "refactoring-priorities.md"
        ]
      },

      "Conventions": {
        "description": "Coding standards and best practices",
        "files": [
          "typescript-conventions.md",
          "vue-best-practices.md",
          "component-organization.md",
          "naming-conventions.md",
          "commit-messages.md"
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

1. **System-wide understanding**: Easy to find all state management patterns in `State/`
2. **Architectural refactoring**: When refactoring data layer, everything is in `Data/`
3. **Pattern discovery**: Find all composables in one place to identify reuse opportunities
4. **Layer-specific expertise**: Frontend devs can focus on `Frontend/`, backend on `Data/`
5. **Cross-cutting concerns**: Shared patterns are obvious (e.g., all security in `Data/Security/`)

## Potential Drawbacks

1. **Feature fragmentation**: Working on Upload feature requires visiting `Frontend/`, `State/`, `Business-Logic/FileProcessing/`
2. **Mental overhead**: Must understand where each concern lives architecturally
3. **Duplicate references**: Some docs may need to reference multiple layers

## Best Use Cases

- Architectural refactoring ("Migrate all stores to new pattern")
- State management work ("Optimize Pinia store performance")
- Data layer changes ("Update Firestore schema")
- Security audits ("Review all security rules")
- Framework upgrades ("Update Vue 3 usage patterns")
- New team members learning system architecture
