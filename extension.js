// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

let myStatusBarItem = null;

const map = {
	"asdfg": "test str"
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "strinfo" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('strinfo.helloWorld', async function () {
		// The code you place here will be executed every time your command is executed

		myStatusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Right,
			10000
		);

		myStatusBarItem.show();
		context.subscriptions.push(myStatusBarItem);

		vscode.window.onDidChangeTextEditorSelection(e => {
			if (!e.selections) {
				myStatusBarItem.hide();
				return;
			}
			if (e.selections.length === 0) {
				myStatusBarItem.hide();
				return;
			}
			if (!e.textEditor) {
				myStatusBarItem.hide();
				return;
			}
			const selection = e.selections[0];

			if (!selection || selection.isEmpty) {
				myStatusBarItem.hide();
				return;
			}

			const selectionRange = new vscode.Range(
				selection.start.line, 
				selection.start.character, 
				selection.end.line, 
				selection.end.character,
			);
			const text = e.textEditor.document.getText(selectionRange);
			
			if (map[text] === undefined) {
				myStatusBarItem.hide();
				return;
			}
			
			myStatusBarItem.text = map[text]
			myStatusBarItem.show();
		 });

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
