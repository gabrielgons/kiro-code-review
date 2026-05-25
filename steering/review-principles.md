# Code Review Principles

## Overview

This document defines all principles and criteria that must be evaluated during a code review. The reviewer should act as a Senior Developer with deep knowledge of software engineering best practices.

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

## 11. Architecture & Design Patterns

### What to Evaluate

- **Separation of concerns**: Layers properly separated
- **Dependency direction**: Dependencies flow inward (Clean Architecture)
- **Appropriate patterns**: Factory, Strategy, Observer used correctly
- **Anti-patterns**: God class, Spaghetti code, Golden Hammer
- **Coupling**: Classes/modules too tightly coupled
- **Cohesion**: Related functionality grouped together
- **Consistency**: Similar problems solved similarly

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
