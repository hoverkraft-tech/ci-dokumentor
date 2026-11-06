# Releasing

The [Release workflow](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/.github/workflows/release.yml) publishes `@ci-dokumentor/cli`.
It runs manually and weekly from `main`.

## Setup

1. Install the release GitHub App on this repository. Supply
   `CI_BOT_APP_CLIENT_ID` as an Actions variable and `CI_BOT_APP_PRIVATE_KEY` as
   an Actions secret, either directly or through organization access. The App
   needs contents/actions write and pull requests read permissions. Branch and
   tag rules must permit its version commits and tags; when PRs are required,
   configure an Always allow bypass for this App.
2. Configure npm trusted publishing for `@ci-dokumentor/cli` with organization/user
   `hoverkraft-tech`, repository `ci-dokumentor`, workflow filename `release.yml`,
   and no environment restriction. Publication uses GitHub OIDC; npm tokens are
   not used by this workflow.
3. Optionally set `CHANGELOG_SUMMARY` to the complete JSON configuration supported
   by [ci-github-publish release/create](https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/create),
   including provider credentials when needed. Leaving it unset keeps generated
   release notes without an AI summary.

## Run a release

Run **Actions > Release > Run workflow** on `main`. Leave `force` unchecked for
normal version planning. Check it to release even without changes; unchanged
versions receive a patch bump. Schedules never force a release.

Preparation updates package versions and the lockfile, commits them to `main`,
and creates the release tags before dispatching this workflow at the prepared
tag. HoverKraft selects the version from Conventional Commits and preserves the existing bare version tags.
With no changes, preparation ends successfully and skips building and publishing.

The tag run calls the same shared validation as pull requests. Package discovery
selects public workspaces automatically. CI builds, packs, validates entry points,
runs consumer smoke tests, and checks npm publication in dry-run mode. Release
then publishes those exact tarballs with provenance and creates GitHub release
notes and tarball assets. It does not rebuild or repack them, and does not write
source changelog files.

## Recovery

Rerun failed jobs, or dispatch **Release** at its original prepared tag. A tag run
resumes that version; it does not plan another one. Already published npm
versions are recovered from the registry and are never overwritten. For a source
fix, merge the fix and prepare a new release from `main`.

See the [shared release guide](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/.github/workflows/release.md)
for configuration overrides and recovery details.

## Other distribution channels

Shared CI continues to build and test the Docker image and GitHub Action.
The release tag run signs the versioned image. Main CI keeps image cleanup,
documentation generation, and GitHub Pages deployment. npm publication belongs
only to `release.yml`.

The separate `.github/workflows/prepare-release.yml` labels pull requests through
ci-github-publish. It runs when a PR opens or changes, including title edits.
Package version updates and publication remain in `.github/workflows/release.yml`.
