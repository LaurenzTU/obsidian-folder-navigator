// --- version-changelog.mjs ---
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { existsSync } from 'fs'; // Import existsSync

// Get the new version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const newVersion = packageJson.version;
const date = new Date().toISOString().split('T')[0];

// Read the current changelog
let changelog = readFileSync('./CHANGELOG.md', 'utf8');

// Get commit messages since last tag
const getCommitsSinceLastTag = () => {
    try {
        const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8', stdio: 'pipe' }).trim();
        if (lastTag) {
            console.log(`Getting commits since last tag: ${lastTag}`);
            return execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s"`, { encoding: 'utf8' });
        } else {
            console.log('No tags found, getting all commit messages.');
            // For the very first release, get all commits since the beginning
            return execSync('git log --pretty=format:"- %s"', { encoding: 'utf8' });
        }
    } catch (e) {
        console.warn(`Error getting last Git tag or commits: ${e.message}`);
        console.log('Assuming no previous tags, getting all commit messages for initial changelog.');
        // Fallback for when there are no tags at all or other git errors
        return execSync('git log --pretty=format:"- %s"', { encoding: 'utf8' });
    }
};

const commitMessages = getCommitsSinceLastTag();

// Remove any empty lines from commit messages and ensure each message is on a new line
const formattedCommitMessages = commitMessages.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

// Create new version section with proper spacing
const newSection = `