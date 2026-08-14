# Contributing to FlowTrack

Thank you for your interest in contributing! 🎉

## Getting Started

1. Fork the repository
2. Follow the [development setup guide](docs/development/setup.md)
3. Create a feature branch: `git checkout -b feat/my-feature`
4. Make your changes
5. Run tests and lint
6. Open a Pull Request against `main`

## Branch Naming

| Type | Pattern |
|---|---|
| Feature | `feat/short-description` |
| Bug fix | `fix/short-description` |
| Docs | `docs/short-description` |
| Refactor | `refactor/short-description` |

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add weekly heatmap to dashboard
fix: prevent duplicate sessions on rapid window switch
docs: add Raspberry Pi deployment notes
chore: upgrade Go to 1.23
```

## Pull Request Guidelines

- Keep PRs focused and small
- Write descriptive PR descriptions
- Link related issues with `Closes #123`
- Ensure all CI checks pass
- Update `CHANGELOG.md` under `[Unreleased]`

## Code Style

**Go:**
- Run `gofmt` and `golangci-lint`
- Use structured logging

**TypeScript/React:**
- Run `eslint` and `tsc --noEmit`
- Prefer functional components with hooks

**Rust:**
- Run `cargo fmt` and `cargo clippy`

## Reporting Bugs

Open a [GitHub Issue](https://github.com/flowtrack-app/flowtrack/issues) with:
- FlowTrack version
- Operating system
- Steps to reproduce
- Expected vs actual behavior

## Security

See [SECURITY.md](SECURITY.md) for responsible disclosure.
