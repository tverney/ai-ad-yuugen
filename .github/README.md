# GitHub Actions CI/CD

This directory contains the CI/CD workflows for the AI Ad Yuugen platform.

## Workflows

### CI Pipeline (`ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **Lint**: ESLint checks across all packages
- **Type Check**: TypeScript compilation and type checking
- **Test**: Unit tests on Node.js 18, 20, and 22
- **Build**: Build all packages and upload artifacts
- **E2E**: End-to-end tests on Chromium, Firefox, and WebKit
- **Security**: npm audit and Snyk security scanning
- **Bundle Size**: Check and report bundle sizes

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Release Pipeline (`release.yml`)

Automated release process triggered by version tags.

**Jobs:**
- **Validate**: Run all tests and validations
- **Build and Publish**: Publish packages to npm
- **Publish Docker**: Build and push Docker images
- **Deploy Docs**: Deploy documentation to GitHub Pages
- **Notify**: Send notifications about release status

**Triggers:**
- Push of version tags (e.g., `v1.0.0`)
- Manual workflow dispatch

**Required Secrets:**
- `NPM_TOKEN`: npm authentication token
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `SNYK_TOKEN`: Snyk API token (optional)
- `SLACK_WEBHOOK`: Slack webhook URL (optional)

## Setting Up Secrets

### npm Token

1. Login to npm: `npm login`
2. Generate token: `npm token create`
3. Add to GitHub: Settings → Secrets → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: Your npm token

### Docker Hub Credentials

1. Create Docker Hub account at https://hub.docker.com
2. Generate access token in Account Settings → Security
3. Add to GitHub:
   - Name: `DOCKER_USERNAME`
   - Value: Your Docker Hub username
   - Name: `DOCKER_PASSWORD`
   - Value: Your access token

### Snyk Token (Optional)

1. Create Snyk account at https://snyk.io
2. Get API token from Account Settings
3. Add to GitHub:
   - Name: `SNYK_TOKEN`
   - Value: Your Snyk API token

### Slack Webhook (Optional)

1. Create Slack app and incoming webhook
2. Add to GitHub:
   - Name: `SLACK_WEBHOOK`
   - Value: Your webhook URL

## Creating a Release

### Automated Release

1. Prepare release:
   ```bash
   ./scripts/prepare-release.sh
   ```

2. Update version numbers:
   ```bash
   npm run version:patch  # or version:minor, version:major
   ```

3. Update CHANGELOG.md with release notes

4. Commit changes:
   ```bash
   git add .
   git commit -m "chore: prepare release v1.0.0"
   git push
   ```

5. Create and push tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

6. GitHub Actions will automatically:
   - Run all tests
   - Build packages
   - Publish to npm
   - Build and push Docker images
   - Deploy documentation
   - Create GitHub release
   - Send notifications

### Manual Release

You can also trigger a release manually:

1. Go to Actions → Release Pipeline
2. Click "Run workflow"
3. Enter version number (e.g., `1.0.0`)
4. Click "Run workflow"

## Monitoring Workflows

### View Workflow Runs

- Go to Actions tab in GitHub repository
- Click on a workflow to see runs
- Click on a run to see job details and logs

### Workflow Status Badges

Add to README.md:

```markdown
![CI](https://github.com/ai-yuugen/platform/workflows/CI%20Pipeline/badge.svg)
![Release](https://github.com/ai-yuugen/platform/workflows/Release%20Pipeline/badge.svg)
```

### Notifications

Configure notifications in GitHub Settings → Notifications:
- Email notifications for workflow failures
- Slack notifications (if webhook configured)

## Troubleshooting

### Build Failures

**Problem**: Build fails in CI but works locally

**Solutions**:
- Check Node.js version matches (use 20.x)
- Clear cache: Re-run workflow with "Re-run all jobs"
- Check for environment-specific issues
- Review logs for specific error messages

### Test Failures

**Problem**: Tests fail in CI but pass locally

**Solutions**:
- Check for timing issues in E2E tests
- Verify test data and fixtures
- Check for environment variables
- Run tests in CI mode locally: `CI=true npm test`

### Publishing Failures

**Problem**: npm publish fails

**Solutions**:
- Verify NPM_TOKEN is valid
- Check package versions are unique
- Ensure packages are built
- Check npm registry status

### Docker Build Failures

**Problem**: Docker image build fails

**Solutions**:
- Test Docker build locally
- Check Dockerfile syntax
- Verify base image availability
- Check for file permission issues

### Secret Issues

**Problem**: Secrets not working

**Solutions**:
- Verify secret names match exactly
- Check secret values don't have extra spaces
- Ensure secrets are set at repository level
- Re-create secrets if needed

## Best Practices

### Branch Protection

Enable branch protection for `main`:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Include administrators

### Pull Request Workflow

1. Create feature branch
2. Make changes and commit
3. Push branch and create PR
4. Wait for CI checks to pass
5. Request review
6. Merge after approval

### Release Workflow

1. Create release branch from `develop`
2. Update version numbers
3. Update CHANGELOG.md
4. Test thoroughly
5. Merge to `main`
6. Tag release
7. Monitor release pipeline

### Security

- Rotate secrets regularly
- Use least privilege for tokens
- Enable Dependabot alerts
- Review security scan results
- Keep dependencies updated

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Semantic Versioning](https://semver.org/)
