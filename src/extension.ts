import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	console.log('Twig Go to Definition extension is now active!');

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));

	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for twig documents
		documentSelector: [
			{ scheme: 'file', language: 'twig' },
			{ scheme: 'file', pattern: '**/*.twig' },
			{ scheme: 'file', pattern: '**/*.html.twig' }
		],
		synchronize: {
			// Notify the server about file changes to '.twig' files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{twig,html.twig}')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'twigLanguageServer',
		'Twig Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
