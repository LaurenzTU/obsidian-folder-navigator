// --- version-changelog.mjs ---
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { existsSync } from 'fs'; // Import existsSync (though not directly used in this version, good to keep for file system ops)

// Get the new version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const newVersion = packageJson.version;
const date = new Date().toISOString().split('T')[0];

// Read the current changelog
let changelog = readFileSync('./CHANGELOG.md', 'utf8');

// Get commit messages since last tag
const getCommitsSinceLastTag = () => {
    try {
        // Try to get the last tag. If no tags, this command will throw an error or return empty.
        const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8', stdio: 'pipe' }).trim();
        
        if (lastTag) {
            console.log(`Getting commits since last tag: ${lastTag}`);
            return execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s"`, { encoding: 'utf8' });
        } else {
            console.log('No tags found, getting all commit messages for initial changelog.');
            // For the very first release, get all commits since the beginning
            return execSync('git log --pretty=format:"- %s"', { encoding: 'utf8' });
        }
    } catch (e) {
        console.warn(`Error getting last Git tag or commits: ${e.message}`);
        console.log('Falling back to getting all commit messages for changelog generation.');
        // Fallback for when there are no tags at all or other git errors
        return execSync('git log --pretty=format:"- %s"', { encoding: 'utf8' });
    }
};

const commitMessages = getCommitsSinceLastTag();

// Process commit messages to ensure clean lines and filter out empty ones
const formattedCommitMessages = commitMessages.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

// Construct the new version section using template literals
const newSection = `
## [${newVersion}] - ${date}

### Changes

${formattedCommitMessages}
`;

// Insert new section after the primary header '# Changelog'
const headerRegex = /^# Changelog\s*\n\s*\n/; // Matches '# Changelog' followed by one or more newlines
if (headerRegex.test(changelog)) {
    // Insert after the initial header and its following newlines
    changelog = changelog.replace(headerRegex, `$&${newSection}\n`); // Add an extra newline for separation
} else {
    // Fallback if header not found (e.g., if file is empty or malformed)
    console.warn("Changelog header not found, prepending new section.");
    changelog = `# Changelog\n\n${newSection}\n${changelog}`;
}

// Write back to CHANGELOG.md
writeFileSync('./CHANGELOG.md', changelog);

// Stage the changelog file
execSync('git add CHANGELOG.md', { stdio: 'inherit' });

console.log(`Updated CHANGELOG.md for version ${newVersion}`);