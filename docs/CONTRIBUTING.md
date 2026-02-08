# Contributing to NamSev

Thank you for your interest in contributing to NamSev! This document provides guidelines for contributing to the project.

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming community

---

## Getting Started

### 1. Fork the Repository

Fork the repository to your GitHub account.

### 2. Clone Your Fork

```bash
git clone https://github.com/your-username/Namma-sev.git
cd Namma-sev
```

### 3. Set Up Development Environment

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

---

## Development Guidelines

### Code Style

**JavaScript:**
- Use ES6+ syntax
- Use `const` and `let` (no `var`)
- Use async/await for asynchronous operations
- Add JSDoc comments for functions

**React:**
- Functional components with hooks
- PropTypes or TypeScript for type checking
- Meaningful component names

### Naming Conventions

**Files:**
- Controllers: `name.controller.js`
- Routes: `name.routes.js`
- Models: `Name.js` (PascalCase)
- Services: `name.service.js`

**Variables:**
- camelCase for variables and functions
- PascalCase for classes and components
- UPPER_SNAKE_CASE for constants

### Folder Structure

```
# Backend
/src/
├── ai/              # AI services
├── config/          # Configuration
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
└── utils/           # Utilities

# Frontend
/src/
├── components/      # Reusable components
├── context/         # React contexts
├── hooks/           # Custom hooks
├── layouts/         # Page layouts
├── pages/           # Page components
└── services/        # API services
```

---

## Making Changes

### 1. Write Clean Code

- Keep functions small and focused
- Add comments for complex logic
- Handle errors appropriately
- Write meaningful variable names

### 2. Test Your Changes

```bash
# Backend
cd backend
npm run dev
# Test endpoints manually or with tools like Postman

# Frontend
cd frontend
npm run dev
# Test UI changes in browser
```

### 3. Update Documentation

If your change affects:
- API endpoints → Update `docs/API_REFERENCE.md`
- Architecture → Update `docs/ARCHITECTURE.md`
- Deployment → Update `docs/DEPLOYMENT.md`

### 4. Commit Guidelines

Use clear commit messages:

```
feat: Add new complaint category
fix: Resolve translation cache issue
docs: Update API documentation
refactor: Simplify priority scoring logic
style: Format code according to guidelines
```

---

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch origin
git rebase origin/main
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

- Provide clear description of changes
- Reference any related issues
- Include screenshots for UI changes

### 4. Code Review

- Address reviewer feedback
- Make requested changes
- Keep discussions constructive

---

## What to Contribute

### Good First Issues

- Documentation improvements
- Bug fixes
- Translation improvements
- UI/UX enhancements

### Larger Contributions

Before starting large changes:
1. Open an issue to discuss
2. Get feedback from maintainers
3. Agree on approach

---

## Not Accepted

- Breaking changes to public APIs
- New frameworks or major dependencies
- Changes that break existing functionality
- Cosmetic-only changes without value

---

## Questions?

- Open an issue for questions
- Check existing issues for answers
- Read documentation thoroughly

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to NamSev!

