# Contributing to TimeBank

Thank you for considering contributing to TimeBank! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node version, browser)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:
- A clear description of the feature
- Why it would be useful
- Possible implementation approach

### Pull Request Process

1. **Fork the repository** and create your branch from `develop`
   ```bash
   git checkout -b feature/YourFeatureName
   ```

2. **Make your changes**
   - Follow the existing code style
   - Write clear, concise commit messages
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run dev
   npm run build
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```
   
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for changes to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes
   - `Style:` for formatting changes
   - `Test:` for adding tests

5. **Push to your fork**
   ```bash
   git push origin feature/YourFeatureName
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Link any related issues
   - Request review from maintainers

### Code Style Guidelines

#### TypeScript
- Use TypeScript for all new code
- Properly type all variables, functions, and components
- Avoid using `any` type

#### React/Next.js
- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and variable names
- Extract reusable logic into custom hooks

#### Backend
- Follow RESTful API conventions
- Validate all inputs
- Handle errors properly with appropriate status codes
- Document API endpoints

#### Styling
- Use TailwindCSS utility classes
- Follow the cosmic theme design system
- Ensure responsive design (mobile-first)
- Maintain accessibility standards

### Branch Naming Convention

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/documentation-update` - Documentation updates

### Commit Message Convention

```
Type: Brief description (max 50 chars)

Detailed explanation of what changed and why (if needed).
Include any breaking changes or migration notes.
```

**Examples:**
```
Add: User profile photo upload functionality

Implemented Multer middleware for handling file uploads.
Added validation for image types and size limits.
Updated profile routes to support avatar URLs.
```

```
Fix: Booking completion not updating ledger

Fixed transaction rollback logic in booking completion flow.
Ensured atomic operations for credit transfers.
```

### Testing

Before submitting:
- [ ] Code builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Application runs in development mode
- [ ] Changes work on mobile devices
- [ ] No console errors or warnings
- [ ] All existing features still work

### Code Review Process

1. At least one maintainer must review the PR
2. All automated checks must pass
3. Feedback must be addressed or discussed
4. Once approved, maintainers will merge the PR

### Project Structure

Please familiarize yourself with the project structure:

```
TimeBank/
├── backend/          # Express API
│   ├── src/routes/   # API endpoints
│   ├── src/middleware/ # Auth & validation
│   └── prisma/       # Database schema
└── frontend/         # Next.js app
    └── src/app/      # Pages and components
```

### Development Setup

1. Clone the repo
   ```bash
   git clone https://github.com/prajwaldesaigithub/TimeBank.git
   cd TimeBank
   ```

2. Install dependencies
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Set up environment variables (see README.md)

4. Initialize database
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start development servers
   ```bash
   npm run dev
   ```

### Getting Help

- Check existing issues and discussions
- Read the [README.md](README.md) documentation
- Ask questions in GitHub Discussions
- Tag maintainers for urgent issues

### Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others when possible
- Follow the code of conduct

## Code of Conduct

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Any conduct inappropriate in a professional setting

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TimeBank! 🚀⏰
