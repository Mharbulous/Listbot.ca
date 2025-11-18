# DevOps Documentation

Firebase configuration, deployment workflows, hosting setup, and local development environment for the ListBot application.

## Available Documentation

@firebase-project-setup.md - Initial Firebase project configuration and setup steps
@firebase-add-user-steps.md - Adding new users to Firebase project
@firebase-permissions-status.md - Current permission structure and access levels
@deployment-promotion.md - Deployment workflow and branch promotion process
@promotion-improvements.md - Enhancements to promotion workflow
@hosting-tips.md - Firebase Hosting tips and best practices

## Quick Reference

**For initial setup:** See @firebase-project-setup.md
**For deployment:** See @deployment-promotion.md for branch promotion workflow
**For adding users:** See @firebase-add-user-steps.md
**For hosting:** See @hosting-tips.md

## Key Concepts

**Multi-App SSO**: All apps (ListBot, Intranet, Files) share a single Firebase project configuration for seamless SSO.

**Branch Strategy**: Development on feature branches, promotion through staging to production.

**Local Development**: Use `npm run dev:files` (files.localhost:3002) for SSO testing across multiple apps.

## Related Documentation

- Authentication setup: @docs/Features/Authentication/CLAUDE.md
- Data security rules: @docs/Data/Security/CLAUDE.md
- System architecture: @docs/System/CLAUDE.md
