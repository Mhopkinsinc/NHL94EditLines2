import fs from 'fs';
import path from 'path';

const versionFilePath = path.join(process.cwd(), 'public', 'version.json');

try {
    let versionData;
    if (fs.existsSync(versionFilePath)) {
        const data = fs.readFileSync(versionFilePath, 'utf8');
        versionData = JSON.parse(data);
    } else {
        console.log('version.json not found, creating it with version 1.0.0.');
        versionData = { version: '1.0.0' };
    }

    if (!versionData.version || !/^\d+\.\d+\.\d+$/.test(versionData.version)) {
        console.warn('Invalid version format in version.json, resetting to 1.0.0.');
        versionData.version = '1.0.0';
    }

    const versionParts = versionData.version.split('.').map(Number);
    versionParts[2] += 1; // Increment patch version
    
    versionData.version = versionParts.join('.');

    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
    console.log(`Version incremented to ${versionData.version}`);
} catch (err) {
    console.error('Error processing version file:', err);
    // Let's create a default one if something goes wrong
    try {
        const initialVersion = { version: '1.0.0' };
        fs.writeFileSync(versionFilePath, JSON.stringify(initialVersion, null, 2), 'utf8');
        console.log('Created version.json with version 1.0.0 due to an error.');
    } catch (writeErr) {
        console.error('Could not create default version.json:', writeErr);
        process.exit(1);
    }
}
