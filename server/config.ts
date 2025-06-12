import { Connection } from 'vscode-languageserver/node';
import { TwigGoToDefinitionSettings } from './types';

// Default settings
export const defaultSettings: TwigGoToDefinitionSettings = {
  pathResolution: 'smart',
  templateDirectories: ['templates', 'views', 'src/templates', 'examples'],
  diagnostics: { enabled: true }
};

export let globalSettings: TwigGoToDefinitionSettings = defaultSettings;

export async function updateConfiguration(connection: Connection, hasConfigurationCapability: boolean): Promise<void> {
  if (!hasConfigurationCapability) {
    return;
  }

  try {
    const settings = await connection.workspace.getConfiguration('twigGoToDefinition');
    globalSettings = {
      pathResolution: settings.pathResolution || 'smart',
      templateDirectories: settings.templateDirectories || ['templates', 'views', 'src/templates', 'examples'],
      diagnostics: {
        enabled: settings.diagnostics?.enabled !== false
      }
    };
    connection.console.log(`Configuration updated: pathResolution=${globalSettings.pathResolution}`);
  } catch (error) {
    connection.console.error(`Error updating configuration: ${error}`);
    globalSettings = defaultSettings;
  }
}
