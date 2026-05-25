# Code Review Principles

## Overview

This document defines all principles and criteria that must be evaluated during a code review. Instead of generically "acting as a Senior Developer", this power specifies the exact characteristics, criteria and mental models that a senior-level reviewer applies.

---

## 0. PRAGMATISM — The Most Important Rule

> **A review that is not pragmatic becomes a nitpick hell. This section overrides all others in terms of tone and judgment.**

### Classification of Comments

Every finding MUST be classified into one of these four levels. Do NOT mix them:

| Level | Label | Meaning | Example |
|-------|-------|---------|---------|
| **Critical** | 🚨 Problem | Blocks merge. Security flaw, data loss, crash, incorrect behavior. | SQL injection, null pointer in production path |
| **Recommended** | ⚠️ Improvement | Should be fixed in this PR. Maintainability/quality concern. | Missing error handling, high coupling |
| **Optional** | 💡 Suggestion | Nice-to-have. Can be addressed in a follow-up. | Better naming, extract method |
| **Personal** | 🤷 Preference | DO NOT POST. Personal taste. Not actionable. | "I'd use a ternary here" |

### Pragmatism Rules

1. **Never comment on personal preferences** — If two approaches are equally valid, say nothing.
2. **Never comment on style if a linter/formatter handles it** — If ESLint/Prettier/Biome is configured, style is not your problem.
3. **Never comment on things outside the PR scope** — If pre-existing code is bad, that's tech debt, not a PR issue.
4. **Always ask: "Does this actually cause a problem?"** — If the answer is "not really", don't comment.
5. **Limit green/suggestion comments** — Max 5-7 per PR. More than that is overwhelming.
6. **Be specific, not vague** — Bad: "This could be better." Good: "This N+1 query will cause latency at 1000+ users."
7. **Provide the WHY** — Every comment must explain the real-world impact.
8. **Offer a concrete fix** — Don't just criticize, show how to improve.

### Anti-Patterns in Reviews (DO NOT DO)

- ❌ "Why didn't you use X pattern?" (without explaining the benefit)
- ❌ "I would have done this differently" (personal preference)
- ❌ "Can you add a comment here?" (if the code is self-explanatory)
- ❌ Bikeshedding variable names that are already clear enough
- ❌ Requesting refactors that don't relate to the PR's purpose
- ❌ Flagging "issues" that are just different from your style

---

## 1. Security (OWASP Top 10)

### Critical Checks

| Vulnerability | What to Look For |
|---------------|-----------------|
| **Injection (SQL, NoSQL, OS, LDAP)** | Unsanitized user input in queries, commands, or expressions |
| **Broken Authentication** | Weak password policies, exposed credentials, missing MFA considerations |
| **Sensitive Data Exposure** | Unencrypted sensitive data, secrets in code, PII in logs |
| **XML External Entities (XXE)** | Unvalidated XML input, disabled entity processing |
| **Broken Access Control** | Missing authorization checks, IDOR vulnerabilities, privilege escalation |
| **Security Misconfiguration** | Default configs, unnecessary features enabled, missing security headers |
| **Cross-Site Scripting (XSS)** | Unescaped output, innerHTML usage, dangerouslySetInnerHTML |
| **Insecure Deserialization** | Untrusted data deserialization without validation |
| **Using Components with Known Vulnerabilities** | Outdated dependencies, unpatched libraries |
| **Insufficient Logging & Monitoring** | Missing audit trails, no error logging, silent failures |

### Security Patterns to Flag

- Hardcoded secrets, API keys, or tokens
- Missing input validation/sanitization
- SQL queries built with string concatenation
- Missing CSRF protection
- Insecure random number generation
- Missing rate limiting on sensitive endpoints
- Overly permissive CORS configurations
- Missing Content-Security-Policy headers
- Eval() or dynamic code execution with user input
- Missing encryption for data at rest or in transit

---

## 2. SOLID Principles

### S - Single Responsibility Principle (SRP)

**Check**: Does each class/module/function have exactly one reason to change?

**Red flags**:
- Classes with many unrelated methods
- Functions doing multiple things (fetch + transform + save)
- God objects/classes
- Mixed concerns (business logic + UI + data access)

### O - Open/Closed Principle (OCP)

**Check**: Is the code open for extension but closed for modification?

**Red flags**:
- Long switch/if-else chains that need modification for new cases
- Missing abstractions/interfaces
- Hardcoded behavior that should be configurable

### L - Liskov Substitution Principle (LSP)

**Check**: Can derived classes substitute base classes without breaking behavior?

**Red flags**:
- Subclasses that throw unexpected exceptions
- Override methods that change the contract
- Type checking with instanceof before method calls

### I - Interface Segregation Principle (ISP)

**Check**: Are interfaces focused and not forcing implementations of unused methods?

**Red flags**:
- Fat interfaces with many methods
- Implementations with empty/stub methods
- Clients depending on methods they don't use

### D - Dependency Inversion Principle (DIP)

**Check**: Do high-level modules depend on abstractions, not concrete implementations?

**Red flags**:
- Direct instantiation of dependencies (new Service())
- Missing dependency injection
- Tight coupling to specific implementations
- Import of concrete classes instead of interfaces

---

## 3. KISS (Keep It Simple, Stupid)

### What to Look For

- **Over-engineering**: Complex patterns for simple problems
- **Premature optimization**: Optimizing before measuring
- **Unnecessary abstraction layers**: Interfaces with single implementation
- **Complex one-liners**: Clever code that's hard to read
- **Over-use of design patterns**: Patterns without justification
- **Deeply nested conditionals**: More than 3 levels of nesting
- **Unnecessary generics/templates**: When simple types would suffice

### Questions to Ask

- Could this be done more simply?
- Will a new team member understand this in 5 minutes?
- Is this complexity justified by the requirements?
- Are there simpler alternatives that achieve the same result?

---

## 4. DRY (Don't Repeat Yourself)

### What to Look For

- **Copy-pasted code blocks**: Same logic in multiple places
- **Similar functions with minor differences**: Candidates for parameterization
- **Repeated constants/magic numbers**: Should be extracted to named constants
- **Duplicated validation logic**: Should be centralized
- **Repeated error handling patterns**: Should use middleware/decorators
- **Identical queries**: Should be abstracted to repository/service layer

### Important Note

DRY is about **knowledge duplication**, not just code duplication. Sometimes similar-looking code represents different concepts and SHOULD remain separate (see: WET - Write Everything Twice when appropriate).

---

## 5. Clean Code

### Naming

- **Variables**: Descriptive, intention-revealing names
- **Functions**: Verb-based, describing what they do
- **Classes**: Noun-based, representing concepts
- **Booleans**: Use is/has/can/should prefixes
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Avoid**: Single-letter variables (except loop counters), abbreviations, misleading names

### Functions

- **Small**: Ideally 5-20 lines, max 30-40
- **Single purpose**: Do one thing well
- **Few parameters**: Ideally 0-2, max 3-4
- **No side effects**: Or clearly documented
- **Consistent abstraction level**: Don't mix high and low level
- **Command-Query Separation**: Either do something OR return something

### Comments

- **Good**: Explain WHY, not WHAT
- **Bad**: Comments that restate the code
- **Necessary**: Legal comments, warnings, TODO with ticket numbers
- **Unnecessary**: Commented-out code (use version control), journal comments

### Error Handling

- **Don't return null**: Use Optional, Maybe, or throw
- **Don't pass null**: Validate early, fail fast
- **Use exceptions for exceptional cases**: Not for flow control
- **Provide context**: Error messages should be actionable
- **Handle or propagate**: Never swallow exceptions silently

### Code Organization

- **Vertical ordering**: Caller above callee
- **Horizontal formatting**: Consistent indentation, line length
- **Grouping**: Related code together, blank lines between concepts
- **File size**: Single files shouldn't exceed 300-500 lines

---

## 6. Performance

### Common Issues to Flag

- **N+1 queries**: Database queries inside loops
- **Missing indexes**: Queries on unindexed fields
- **Memory leaks**: Unremoved event listeners, unclosed connections, growing caches
- **Unnecessary re-renders**: Missing memoization in React/Vue
- **Blocking operations**: Synchronous I/O in async contexts
- **Large payloads**: Fetching more data than needed
- **Missing pagination**: Loading entire datasets
- **Expensive computations in hot paths**: Without caching
- **String concatenation in loops**: Use StringBuilder/join
- **Unoptimized regex**: Catastrophic backtracking potential

### Stack-Specific Checks

- **Frontend**: Bundle size, lazy loading, image optimization, virtual scrolling
- **Backend**: Connection pooling, query optimization, caching strategies
- **API**: Response size, compression, pagination, field selection

---

## 7. Error Handling & Resilience

### What to Check

- **Missing try/catch** around I/O operations
- **Empty catch blocks** that swallow errors
- **Generic error messages** that don't help debugging
- **Missing error boundaries** (React) or global error handlers
- **Unhandled promise rejections** (async/await without try/catch)
- **Missing timeout configurations** for external calls
- **No retry logic** for transient failures
- **Missing circuit breaker** for external service calls
- **Race conditions** in concurrent operations
- **Missing graceful degradation** strategies

---

## 8. Testing Considerations

### What to Flag

- **No tests for new logic**: Critical paths should have tests
- **Untestable code**: Tight coupling, hidden dependencies
- **Missing edge cases**: Null, empty, boundary values
- **Fragile tests**: Tests coupled to implementation details
- **Missing integration tests**: For external interactions
- **No error path testing**: Only happy path tested
- **Hardcoded test data**: Should use factories/builders
- **Test pollution**: Tests that depend on execution order

---

## 9. API Design

### REST API Checks

- **Proper HTTP methods**: GET for reads, POST for creation, etc.
- **Meaningful status codes**: Not everything is 200 or 500
- **Consistent naming**: Plural nouns for collections
- **Proper pagination**: Limit/offset or cursor-based
- **Version strategy**: URL or header versioning
- **Error response format**: Consistent structure
- **Missing validation**: Request body/params validation
- **Over-fetching/Under-fetching**: Response granularity

### GraphQL Checks

- **N+1 problem**: Missing DataLoader
- **Missing pagination**: Unbounded lists
- **Over-exposure**: Exposing internal models directly
- **Missing rate limiting**: Query complexity analysis

---

## 10. Concurrency & Async

### What to Check

- **Race conditions**: Shared mutable state without synchronization
- **Deadlocks**: Circular lock dependencies
- **Missing await**: Promises that float without handling
- **Callback hell**: Deeply nested callbacks (refactor to async/await)
- **Missing error handling in async**: Unhandled rejections
- **Thread safety**: Shared resources without proper locking
- **Missing cancellation**: Long operations without abort signal

---

## 11. Architecture & Design — The "True Senior" Section

> This is where the real senior-level thinking happens. Generic reviewers miss these. A senior evaluates the **design decisions**, not just the syntax.

### 11.1 Cohesion

**Check**: Does each module/class/file group related behavior together?

**Indicators of low cohesion:**
- A class with methods that don't share internal state
- A file mixing HTTP handler + business logic + database queries
- A module that "does a little bit of everything"
- Utilities files that are actually dumping grounds

**Question to ask:** "If I remove one method from this class, do the others still make sense together?"

### 11.2 Coupling

**Check**: Can components change independently without breaking each other?

**Red flags:**
- Direct imports between layers that should be decoupled (e.g., controller imports repository directly)
- Shared mutable state across modules
- Circular dependencies
- Feature A requires knowledge of Feature B's internals
- Changes in one module cascade into 5+ other files

**Assessment:** "If I swap the database from PostgreSQL to MongoDB, how many files need to change?" (answer should be: only the repository/data layer)

### 11.3 Separation of Responsibilities

**Check**: Are concerns separated into distinct layers/modules?

**Expected layers (varies by architecture):**
- Presentation / Controller / Handler
- Application / Use Case / Service
- Domain / Business Logic / Model
- Infrastructure / Repository / External Services

**Red flags:**
- Business logic inside controllers
- Database queries inside UI components
- Authentication checks scattered everywhere instead of centralized
- Logging mixed with business computation
- HTTP/framework concerns leaking into domain layer

### 11.4 Adherence to Project Architecture

**Check**: Does the PR follow the patterns already established in the project?

**This is critical.** If the project uses Clean Architecture and the PR adds business logic in the controller, that's a RED finding — even if the code "works."

**Questions:**
- Does this follow the same pattern as similar existing features?
- Does it respect the directory structure conventions?
- Are dependencies flowing in the right direction?
- Is the naming consistent with existing modules?

### 11.5 Unnecessary Complexity (Over-engineering)

**Check**: Is the solution proportional to the problem?

**Classic over-engineering signals:**
- Abstract Factory for something that's instantiated once
- Strategy pattern for two simple if/else branches
- Event system for purely synchronous local operations
- Microservice for something that could be a function
- Generic types with 4+ type parameters
- 5 layers of abstraction for a CRUD operation
- "Enterprise" patterns in a 500-line project

**Senior mindset:** "Is this complexity earning its keep? Does it solve a real current problem or just a hypothetical future one?"

### 11.6 Scalability Assessment

**Check**: Will this solution break under realistic growth?

**Questions:**
- What happens at 10x the current traffic?
- Are there O(n²) or worse operations on datasets that could grow?
- Is there state that prevents horizontal scaling?
- Are there single points of failure?
- Is the data model flexible enough for known future requirements?

**Important:** Only flag scalability issues that are **realistic** given the project context. Don't demand distributed systems for a startup MVP.

### 11.7 Extensibility

**Check**: Can new features be added without modifying existing code?

**Good signs:**
- Plugin/middleware architecture
- Configuration over hardcoding
- Well-defined extension points
- Open/Closed principle applied where it matters

**Bad signs:**
- Adding a new payment method requires modifying 15 files
- New entity types require changing the core logic
- Features are interleaved instead of composed

### 11.8 Readability & Domain Clarity

**Check**: Does the code communicate its intent clearly?

**Evaluate:**
- Can you understand the business flow by reading the function names?
- Do class names reflect domain concepts (not technical jargon)?
- Is the "what" clear without reading the "how"?
- Would a new team member understand the intent within 5 minutes?
- Is the code at a consistent abstraction level within each function?

### 11.9 Naming (Domain-Driven)

**Beyond basic Clean Code naming, evaluate:**
- Do names reflect the **ubiquitous language** of the domain?
- Are business concepts named consistently across the codebase?
- Would a domain expert recognize the terminology?
- Avoid technical names for business concepts (e.g., `processPayment` not `executeTransaction`)

### 11.10 Maintainability

**The ultimate question:** "Will someone enjoy working on this code in 6 months?"

**Check:**
- Can you modify one feature without risk of breaking others?
- Are there clear boundaries between modules?
- Is the test coverage sufficient to refactor with confidence?
- Is the code self-documenting (minimal need for comments)?
- Are error states explicit and handled consistently?

---

## 12. Documentation & Maintainability

### What to Check

- **Missing JSDoc/docstrings**: For public APIs
- **Outdated comments**: Comments that don't match the code
- **Missing README updates**: When behavior changes
- **Missing changelog entries**: For notable changes
- **Magic numbers/strings**: Should be named constants
- **Complex business rules**: Not documented
- **Missing migration guides**: For breaking changes

---

## 13. Git & PR Hygiene

### What to Observe

- **Commit message quality**: Descriptive, conventional commits
- **PR size**: Large PRs are harder to review (flag if >500 lines)
- **Mixed concerns**: PR includes unrelated changes
- **Missing description**: No context for reviewers
- **Debug code left in**: Console.log, debugger statements
- **Commented-out code**: Should be removed
- **Unresolved TODOs**: Without ticket references


---

## 14. Stack-Specific Best Practices

> **Generic reviews are superficial.** A truly valuable review applies knowledge specific to the tech stack in use. This section instructs the reviewer to apply stack-aware best practices based on what `detect_project_stack` identifies.

### CRITICAL INSTRUCTION

When reviewing code, you MUST apply the best practices specific to the detected stack. A review of a Spring Boot service that only checks "naming" and "DRY" is worthless. You must check Spring-specific patterns, Java-specific idioms, and infrastructure-specific concerns.

---

### Java / Spring Boot

- Proper use of `@Transactional` (scope, propagation, rollback rules)
- Constructor injection over field injection (`@Autowired` on fields = red flag)
- DTO separation (never expose entities directly in controllers)
- Proper exception handling with `@ControllerAdvice`
- Bean lifecycle awareness (singleton vs prototype scope)
- Lazy loading pitfalls (N+1 in JPA/Hibernate)
- Thread safety of `@Service` beans (stateless?)
- Proper use of `Optional<T>` (never as method parameter)
- Stream API usage (parallel streams only when measured)
- Immutability where possible (records, final fields)
- Proper logging levels (INFO/WARN/ERROR semantics)

### .NET / C#

- Proper async/await usage (no `.Result`, no `async void` except event handlers)
- Dependency injection via constructor (IServiceCollection patterns)
- Entity Framework: tracking vs no-tracking queries
- Proper use of `IDisposable` / `IAsyncDisposable`
- Middleware pipeline ordering
- Configuration binding patterns (Options pattern)
- Null reference handling (nullable reference types)
- LINQ performance (deferred execution awareness)
- Proper exception hierarchy

### Node.js / TypeScript

- Proper error handling in async/await (no floating promises)
- Event loop blocking detection (CPU-intensive operations)
- Memory leak patterns (closures holding references, unremoved listeners)
- TypeScript strictness (`strict: true`, no `any` abuse)
- Module system consistency (ESM vs CJS)
- Dependency injection patterns (without over-engineering)
- Proper stream usage for large data
- Environment variable validation at startup
- Graceful shutdown handling (SIGTERM/SIGINT)
- Connection pool management

### React

- Component composition over prop drilling
- Custom hooks for shared logic (not utility functions with state)
- Memoization usage (`useMemo`, `useCallback` — only when needed, not everywhere)
- State management choice appropriateness (local vs context vs external)
- Key prop usage in lists (not array index for dynamic lists)
- Effect cleanup (unsubscribe, abort controllers)
- Render performance (unnecessary re-renders detection)
- Accessibility (a11y) basics
- Error boundaries for graceful failure

### Vue.js

- Composition API patterns (composables for shared logic)
- Reactive vs ref usage appropriateness
- Computed vs methods (caching behavior)
- Watch vs watchEffect (explicit vs automatic dependencies)
- Props validation (proper types, required fields)
- Event emission patterns (emit vs provide/inject)
- Lifecycle hook correct usage
- Template vs render functions decision

### Python / Django / FastAPI

- Type hints usage (Python 3.9+ native types)
- Context managers for resource management
- Django: N+1 queries (`select_related`, `prefetch_related`)
- Django: Fat models vs fat views (business logic placement)
- FastAPI: Pydantic models for validation
- FastAPI: Dependency injection patterns
- Async vs sync decision (don't mix without reason)
- Exception handling patterns (custom exceptions, not bare `except`)
- Import organization (stdlib / third-party / local)

### Go

- Error handling patterns (`if err != nil` is fine, wrapping is better)
- Goroutine lifecycle management (context cancellation)
- Channel usage (buffered vs unbuffered, direction)
- Interface placement (define where used, not where implemented)
- Package organization (avoid circular imports)
- Defer usage and ordering
- Struct embedding appropriateness
- Table-driven tests
- Proper use of `context.Context` propagation

### PostgreSQL / Databases

- Index usage verification (explain plan awareness)
- Transaction isolation level appropriateness
- Migration safety (no locks on large tables, backward compatible)
- Connection pool sizing
- Query complexity (JOINs count, subquery vs CTE)
- Data type choices (varchar vs text, timestamp vs timestamptz)
- Constraint usage (CHECK, UNIQUE, FK with proper cascade)
- Pagination strategy (OFFSET vs cursor-based for large datasets)

### Kubernetes / Cloud Infrastructure

- Resource limits and requests defined
- Health checks (liveness vs readiness vs startup probes)
- ConfigMap/Secret usage (not hardcoded in deployment)
- Image tag pinning (never `latest` in production)
- Horizontal Pod Autoscaler configuration
- Network policies for pod-to-pod communication
- Proper namespace isolation
- Rolling update strategy configuration

### AWS

- IAM least privilege principle
- VPC/Security Group rules (not 0.0.0.0/0 to production)
- S3 bucket policies and encryption
- Lambda cold start awareness
- RDS Multi-AZ for production
- CloudWatch alarms and metrics
- Cost optimization (instance sizing, reserved vs on-demand)
- Proper use of managed services vs self-hosted

### General Infrastructure

- Environment separation (dev/staging/prod config management)
- Secrets management (never in code, use vault/secrets manager)
- Logging structure (structured JSON logs, correlation IDs)
- Monitoring and alerting (SLI/SLO awareness)
- CI/CD pipeline considerations (test gates, deployment strategies)
- Feature flags for risky deployments
- Backward compatibility for APIs (versioning strategy)

---

## 15. Review Mindset Summary

### What a Senior Reviewer Actually Does

A senior reviewer does NOT:
- Flag every possible style preference
- Demand perfection in every PR
- Rewrite the PR in their own style
- Block on cosmetic issues
- Ignore project context in favor of "best practices"

A senior reviewer DOES:
- **Protect production** — Catch bugs before they ship
- **Share knowledge** — Explain the WHY, teach, not just criticize
- **Maintain architecture** — Guard design decisions and consistency
- **Be proportional** — Critical review for critical code, light review for config changes
- **Consider context** — Startup MVP? Enterprise? Open source? The standard varies.
- **Accelerate the team** — Reviews should unblock, not block. Suggest, don't demand for non-critical items.
- **Focus on the diff** — Review what changed, not what was already there
- **Recognize good work** — Positive reinforcement matters
