import path from 'path';
import fs from 'fs';

type ProjectArgs = {
  cadType: string;
  projectFolder: string;
  projectType: string;
  propType: string;
  outDir: string;
  nestedFolderDir?: string;
};

type ProjectPaths = {
  dataPathRoot: string;
  dataFilePath: string;
  outputPath: string;
};

/**
 * Parses command line arguments to extract project configuration.
 *
 * @returns {ProjectArgs & ProjectPaths} An object containing the parsed project arguments and paths.
 */
export function getProjectArgs(
  outputFolderName?: string
): ProjectArgs & ProjectPaths {
  const args = process.argv.slice(2);
  const cadType =
    args.find((arg) => arg.startsWith('--cad='))?.split('=')[1] ?? 'mcad';
  const projectFolder =
    args.find((arg) => arg.startsWith('--project='))?.split('=')[1] ??
    'no-project';
  const projectType =
    args.find((arg) => arg.startsWith('--type='))?.split('=')[1] ??
    'residential';
  const propType =
    args.find((arg) => arg.startsWith('--prop='))?.split('=')[1] ?? 'comps';
  const outDir =
    args.find((arg) => arg.startsWith('--out='))?.split('=')[1] ?? 'downloads';
  const nestedFolderDir =
    args.find((arg) => arg.startsWith('--nested='))?.split('=')[1] ?? '';
  const projectArgs = {
    cadType,
    projectFolder,
    projectType,
    propType,
    outDir,
    nestedFolderDir,
  };
  const projectPaths = getProjectPaths(projectArgs, outputFolderName);
  return { ...projectArgs, ...projectPaths };
}

export function getProjectPaths(
  args: ProjectArgs,
  outputFolderName?: string
): ProjectPaths {
  const dataPathRoot = path.resolve(
    '/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc',
    '2025',
    args.projectType,
    'in-progress',
    args.projectFolder,
    args.propType
  );
  const dataFilePath = path.resolve(
    dataPathRoot,
    `${
      args.nestedFolderDir ? `${args.nestedFolderDir}/` : ''
    }data/property-data.json`
  );
  const defaultOutputFolder =
    args.propType === 'comps' ? outputFolderName ?? 'downloads' : '';
  const outputFolder = args.outDir ?? defaultOutputFolder;
  const outputPath = path.resolve(dataPathRoot, outputFolder);

  // Ensure the output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  return {
    dataPathRoot,
    dataFilePath,
    outputPath,
  };
}
