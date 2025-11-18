# CLAUDE-docs Organization Plans

This document provides a comparison of four different organizational approaches for the CLAUDE-docs folder, each optimized for different LLM traversal patterns.

## Quick Comparison

| Aspect | Plan 1: Page-Centric | Plan 2: Architectural Layer | Plan 3: Feature-Module | Plan 4: Mirror Codebase |
|--------|----------------------|----------------------------|------------------------|-------------------------|
| **Primary organization** | By UI pages/routes | By architectural layers | By business features | By src/ folder structure |
| **Best for** | Feature-focused work | Architectural refactoring | Vertical slice development | Code-doc alignment |
| **Mirrors** | User mental model | System architecture | `src/features/` structure | **Exact `src/` structure** |
| **Discovery pattern** | "Working on X page" | "Working on Y layer" | "Working on Z feature" | "Working on src/path/file.js" |
| **Cognitive load** | Low (page-centric) | Medium (requires architectural knowledge) | Low-Medium (feature-centric) | **Minimal (1:1 mapping)** |
| **Cross-cutting concerns** | May duplicate | Grouped by layer | Shared in System/ | In `_system/` folder |
| **Code alignment** | Medium | Low | High | **Perfect (100%)** |

## Plan 1: Page-Centric Organization

**File**: [hierarchy1.md](./hierarchy1.md)

### Philosophy
Organize documentation by user-facing pages and routes. When working on a specific page, all related documentation is in one place.

### Structure Highlights
```
CLAUDE-docs/
├── Stack/
├── Conventions/
├── SSO-Auth/
├── Pages/
│   ├── Home/
│   ├── Matters/
│   ├── Upload/
│   │   ├── FileProcessing/
│   │   ├── Terminology/
│   │   ├── Components/
│   │   └── Composables/
│   ├── Documents/
│   │   ├── DocumentTable/
│   │   ├── DocumentViewer/
│   │   └── AIAnalysis/
│   └── Categories/
├── Data/
├── Workflows/
└── Testing/
```

### When to Choose This Plan
- ✅ Most tasks are scoped to specific pages
- ✅ Team thinks in terms of user-facing features
- ✅ New developers learn the app page-by-page
- ✅ Bug reports reference specific pages

### Example LLM Query Patterns
- "I'm working on the Documents page, show me all related docs"
- "How does the Upload page handle file processing?"
- "What components are used on the Categories page?"

## Plan 2: Architectural Layer Organization

**File**: [hierarchy2.md](./hierarchy2.md)

### Philosophy
Organize documentation by architectural concerns (Frontend, State, Data, Business Logic). When understanding system-wide patterns, all related docs are grouped by layer.

### Structure Highlights
```
CLAUDE-docs/
├── Architecture/
├── Frontend/
│   ├── Framework/
│   ├── UI-Components/
│   ├── Styling/
│   └── Views/
├── State/
│   ├── Pinia-Stores/
│   └── Composables/
├── Data/
│   ├── Firestore/
│   ├── FirebaseStorage/
│   └── Security/
├── Business-Logic/
│   ├── FileProcessing/
│   ├── Deduplication/
│   ├── AI/
│   └── Categories/
├── Authentication/
└── Testing/
```

### When to Choose This Plan
- ✅ Frequent architectural refactoring
- ✅ Team has specialized roles (frontend, backend, data)
- ✅ Need to find all state management patterns
- ✅ System-wide upgrades (e.g., Vue 3 → Vue 4)

### Example LLM Query Patterns
- "Show me all state management documentation"
- "I'm refactoring the data layer, what docs should I review?"
- "What are the frontend component patterns?"

## Plan 3: Feature-Module Organization

**File**: [hierarchy3.md](./hierarchy3.md)

### Philosophy
Organize documentation by business features/modules, mirroring the `src/features/` structure. All documentation for a feature (UI, state, data, logic) is grouped together as a vertical slice.

### Structure Highlights
```
CLAUDE-docs/
├── System/
│   ├── Architecture/
│   ├── Stack/
│   ├── Conventions/
│   └── Shared/
├── Features/
│   ├── Authentication/
│   ├── Upload/
│   │   ├── UI/
│   │   ├── Processing/
│   │   ├── Deduplication/
│   │   ├── Workers/
│   │   ├── Composables/
│   │   └── Storage/
│   ├── Organizer/
│   │   ├── DocumentTable/
│   │   ├── DocumentViewer/
│   │   ├── Categories/
│   │   └── AIAnalysis/
│   ├── Matters/
│   └── Profile/
├── Data/
└── Testing/
```

### When to Choose This Plan
- ✅ Modular architecture with clear feature boundaries
- ✅ Multiple teams own different features
- ✅ Features can be developed/tested independently
- ✅ Code is organized in `src/features/`

### Example LLM Query Patterns
- "I'm working on the Upload feature, show me everything"
- "What's the architecture of the Organizer feature?"
- "How does deduplication work in the Upload module?"

## Plan 4: Mirror Codebase Structure

**File**: [doc-structure4.md](./doc-structure4.md)

### Philosophy
Documentation structure mirrors the `src/` folder structure exactly. Every folder in `src/` has a corresponding documentation folder in `CLAUDE-docs/`. This enables perfect 1:1 alignment between code and documentation.

### Structure Highlights
```
src/                                   CLAUDE-docs/
├── components/                   →    ├── components/
│   ├── base/                     →    │   ├── base/
│   ├── document/                 →    │   ├── document/
│   └── features/                 →    │   └── features/
├── composables/                  →    ├── composables/
├── features/                     →    ├── features/
│   ├── upload/                   →    │   ├── upload/
│   │   ├── components/           →    │   │   ├── components/
│   │   ├── composables/          →    │   │   ├── composables/
│   │   │   ├── deduplication/    →    │   │   │   ├── deduplication/
│   │   │   └── webWorker/        →    │   │   │   └── webWorker/
│   │   ├── utils/                →    │   │   ├── utils/
│   │   └── workers/              →    │   │   └── workers/
│   └── organizer/                →    │   └── organizer/
│       ├── components/           →    │       ├── components/
│       ├── composables/          →    │       ├── composables/
│       ├── services/             →    │       ├── services/
│       ├── stores/               →    │       ├── stores/
│       └── views/                →    │       └── views/
├── stores/                       →    ├── stores/
├── views/                        →    ├── views/
└── ...                           →    ├── ...
                                  →    └── _system/  (cross-cutting docs)
```

### When to Choose This Plan
- ✅ You want **perfect alignment** between code and docs
- ✅ Refactoring code frequently and docs should move with it
- ✅ Team is comfortable with current code organization
- ✅ Want **trivial path translation** for LLMs (src/ → CLAUDE-docs/)
- ✅ IDE navigation between code and docs is important

### Example LLM Query Patterns
- "Working on `src/features/upload/composables/useFileQueue.js`"
  → Navigate to: `CLAUDE-docs/features/upload/composables/useFileQueue.md`
- "Working on `src/components/document/tabs/AIAnalysisTab.vue`"
  → Navigate to: `CLAUDE-docs/components/document/tabs/AIAnalysisTab.md`
- "Need deduplication docs"
  → Navigate to: `CLAUDE-docs/features/upload/composables/deduplication/`

### Key Advantages
1. **Perfect 1:1 Mapping**: Zero mental translation required
2. **Refactoring Sync**: When code moves, docs move identically
3. **Discovery Speed**: Instant doc lookup from any code path
4. **Consistency**: Same organizational principles everywhere

## Decision Framework

### Choose Plan 1 (Page-Centric) if:
1. You think "I'm working on the Upload **page**"
2. Tasks are scoped to specific user-facing pages
3. You want minimal cognitive overhead for LLM queries
4. Your team uses page-based language in planning

### Choose Plan 2 (Architectural Layer) if:
1. You think "I'm refactoring the **state layer**"
2. Frequent system-wide architectural changes
3. Team has specialized architectural roles
4. You need to understand cross-cutting patterns

### Choose Plan 3 (Feature-Module) if:
1. You think "I'm working on the Upload **feature**"
2. Your codebase is organized in `src/features/`
3. Features can be owned by different teams
4. You want vertical slice development

### Choose Plan 4 (Mirror Codebase) if:
1. You think "I'm working on `src/features/upload/composables/useFileQueue.js`"
2. You want **zero cognitive load** for finding docs
3. Code structure frequently changes and docs should track automatically
4. You prioritize **perfect alignment** over conceptual grouping
5. You want to enable IDE navigation from code → docs

## Hybrid Approach

You can also combine approaches:
- Use **Plan 3** as the base (feature-module)
- Add cross-references from **Plan 1** (pages) to feature docs
- Use **Plan 2** style for `System/` folder organization

## Recommendation

Based on your codebase analysis:

**Primary Recommendation: Plan 4 (Mirror Codebase)** ⭐

**Reasons:**
1. **Perfect 1:1 mapping**: Every code file has a corresponding doc in the exact same location
2. **Zero cognitive load**: Path translation is trivial (src/ → CLAUDE-docs/, .vue/.js → .md)
3. **Automatic refactoring sync**: When code structure changes, docs follow the same pattern
4. **Comprehensive coverage**: Your codebase has ~288 source files organized in a clear structure
5. **Feature-rich folders**: Upload has 40+ composables, 30+ components with deep nesting (deduplication/, webWorker/)
6. **LLM efficiency**: "Working on X file" → instant doc lookup with zero ambiguity

**Secondary Recommendation: Plan 3 (Feature-Module)**

**Reasons:**
1. Your code is already organized in `src/features/upload/` and `src/features/organizer/`
2. Upload is a self-contained feature with deduplication, workers, and UI
3. Organizer encompasses documents, categories, and viewer as a cohesive feature
4. Good balance between alignment and conceptual grouping
5. Easy for LLMs: "Upload feature" → `Features/Upload/`

**Tertiary Recommendation: Plan 1 (Page-Centric)**

**Reasons:**
1. Your initial sketch followed this pattern
2. Intuitive for task descriptions ("work on Documents page")
3. Low cognitive overhead
4. Good for early-stage development when pages are primary mental model

**Not Recommended: Plan 2 (Architectural Layer)**

**Reasons:**
1. Your app is relatively small and doesn't have specialized architectural teams
2. Most tasks are feature-scoped, not layer-scoped
3. Higher cognitive overhead for typical tasks
4. Better for large enterprise apps with architectural specialists

## Plan 4 vs Plan 3: Key Differences

While both align with code structure, they differ in approach:

| Aspect | Plan 3 (Feature-Module) | Plan 4 (Mirror Codebase) |
|--------|------------------------|--------------------------|
| **Alignment** | Features-level | File-level (exact) |
| **Path translation** | Feature → docs folder | src/ → CLAUDE-docs/ (1:1) |
| **Reorganization** | Groups by business concept | Mirrors exactly |
| **Example** | `Features/Upload/Processing/` | `features/upload/composables/` |
| **Flexibility** | Can reorganize conceptually | Must match src/ structure |
| **Maintenance** | Manual sync | Automatic structural sync |

**Choose Plan 4 if**: You want absolute alignment and minimal translation overhead.
**Choose Plan 3 if**: You want conceptual grouping within features while maintaining overall feature alignment.

## Next Steps

1. **Review all four plans**:
   - [hierarchy1.md](./hierarchy1.md) - Page-Centric
   - [hierarchy2.md](./hierarchy2.md) - Architectural Layer
   - [hierarchy3.md](./hierarchy3.md) - Feature-Module
   - [doc-structure4.md](./doc-structure4.md) - Mirror Codebase
2. **Consider your typical task descriptions**:
   - Do you say "work on Upload **page**"? → Plan 1
   - Do you say "refactor the **state layer**"? → Plan 2
   - Do you say "work on Upload **feature**"? → Plan 3
   - Do you say "working on `src/features/upload/composables/useFileQueue.js`"? → Plan 4
3. **Choose the plan that matches your mental model**
4. **Start organizing with that plan**
5. **Adjust as needed** - documentation structure can evolve

## Migration Path

If you choose a plan and later want to switch:
1. Both structures can coexist during migration
2. Use symlinks or cross-references for transition
3. Update CLAUDE.md `@-imports` to point to new locations
4. Archive old structure once migration is complete
