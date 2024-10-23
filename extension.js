// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

let statusBarItem = null;
let map = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	updateConfig();

	// Create status bar item.
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		10000
	);

	context.subscriptions.push(statusBarItem);

	// Update out map on configuration changes.
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration("strinfo.mappings")) {
			updateConfig();
		}
	}));

	// Handle text highlight.
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(e => {
		if (!map) {
			statusBarItem.hide();
			return
		}

		if (!e.selections) {
			statusBarItem.hide();
			return;
		}
		if (e.selections.length === 0) {
			statusBarItem.hide();
			return;
		}
		if (!e.textEditor) {
			statusBarItem.hide();
			return;
		}
		const selection = e.selections[0];

		if (!selection || selection.isEmpty) {
			statusBarItem.hide();
			return;
		}

		// Not sure if this is required, getText also accepts a selection object.
		const selectionRange = new vscode.Range(
			selection.start.line, 
			selection.start.character, 
			selection.end.line, 
			selection.end.character,
		);
		const text = e.textEditor.document.getText(selectionRange);
		
		if (map[text] === undefined) {
			statusBarItem.hide();
			return;
		}
		
		statusBarItem.text = map[text]
		statusBarItem.show();
	}));

	// Code lense
	vscode.languages.registerCodeLensProvider("*", mappingLense);
}

function updateConfig() {
	map = vscode.workspace.getConfiguration("strinfo.mappings");

	if (!map) {
		regexStr = null;
		return
	}

	let s = ""
	for (const [key, value] of Object.entries(map)) {
		s += key + "|"
	}
	regexStr = s.substring(0, s.length - 1);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

let regexStr = null;
const mappingLense = {
  provideCodeLenses: function (document, token) {
		if (!regexStr) {
			return [];
		}

		let codeLenses = [];
		const regex = new RegExp(regexStr, 'g');
		const text = document.getText();
		let matches;
		while ((matches = regex.exec(text)) !== null) {
			const line = document.lineAt(document.positionAt(matches.index).line);
			const indexOf = line.text.indexOf(matches[0]);
			const position = new vscode.Position(line.lineNumber, indexOf);
			const range = document.getWordRangeAtPosition(position, new RegExp(regexStr, 'g'));
			if (range) {
				codeLenses.push(new vscode.CodeLens(range, {
					command: "workbench.action.findInFiles",
					arguments: [
						{
							query: matches[0],
						},
					],
					title: map[matches[0]],
				}));
			}
		}
		return codeLenses;
  }
}