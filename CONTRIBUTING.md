# Contributing to Node Bug

## Local Development

### Tests

Tests are written using Chai.js assertions in the [`test/`](test/) directory.

To run the tests, run `npm test`.

## Repo Practices

### Commits

Commit messages should use the following format:

```text
<type>(<ver>): <message>
```

- `type` is one of the following:
  - `feat` for new features
  - `fix` for bug fixes
  - `docs` for documentation changes
  - `style` for code style changes
  - `refactor` for code refactoring
  - `perf` for performance improvements
  - `test` for test changes
  - `build` for build changes
  - `ci` for CI changes
  - `chore` for other changes
- `ver` is the version number of the package
- `message` is a short description of the change

### Pull Requests

Pull requests should be made against the `main` branch. The title should match the commit message format.
