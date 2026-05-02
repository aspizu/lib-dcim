use absolute imports like `"./router"`
run `.git/hooks/pre-commit && bun run check` to ensure code quality
whenever you add a feature or fix a bug, add tests and documentation for it (jsdoc)
you may not suppress eslint rules or typescript errors
functions must either be 100% pure, or be 100% side-effectful
if a function returns a value other than undefined, then it must be pure
if a function has side-effects, then it must only return undefined
functions, classes, modules, etc. must be prefixed with `_` if they are internal private API.
JSDoc documentation must be written for all public API, except for internal API, even
if the internal API is exported.
do not check for conditions that are obviously true, or when the caller is responsible
for the condition to be satisfied.
