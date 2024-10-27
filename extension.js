// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

let map = null;
let regexStr = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	updateMappings();

	// Update out map on configuration changes.
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration("strinfo.mappings")) {
			updateMappings();
		}
	}));

	context.subscriptions.push(new SelectionDisplay());
	context.subscriptions.push(new CodeLensDisplay());
	context.subscriptions.push(new TooltipDisplay());
}

function updateMappings() {
	map = vscode.workspace.getConfiguration("strinfo").mappings;

	if (!map) {
		regexStr = null;
		return
	}

	// Build regex like "key1|key2|key3".
	let s = ""
	for (const [key, value] of Object.entries(map)) {
		s += key + "|"
	}
	regexStr = s.substring(0, s.length - 1);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

function getDisplayString(text, markdown = false) {
	if (!map) {
		return null;
	}

	if (!map[text]) {
		return null;
	}

	const el = map[text];
	if (typeof el === 'string' || el instanceof String) {
		return el !== "" ? el : null;
	}

	if (markdown === true && el.markdown !== "") {
		return el.markdown;
	} else {
		return el.plain !== "" ? el.plain : null;
	}
}

class SelectionDisplay {
	constructor() {
		this.getConfig(null);
		this.settingsListener = vscode.workspace.onDidChangeConfiguration(this.getConfig);
	}

	getConfig = (e) => {
		if (e == null || (e && e.affectsConfiguration("strinfo.showStatusBar"))) {
			const enabled = vscode.workspace.getConfiguration("strinfo").showStatusBar;
			if (enabled === true) {
				this.enable();
			} else {
				this.disable();
			}
		}
	}

	enable = () => {
		if (!this.statusBarItem) {
			this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10000);
		}
		if (!this.selectionEventListener) {
			this.selectionEventListener = vscode.window.onDidChangeTextEditorSelection(this.selectionHandler);
		}
	}

	disable = () => {
		if (this.statusBarItem) { 
			this.statusBarItem.dispose();
			this.statusBarItem = null;
		}
		if (this.selectionEventListener) { 
			this.selectionEventListener.dispose(); 
			this.selectionEventListener = null;
		}
	}

	dispose = () => {
		this.settingsListener.dispose();
		this.disable()
	}

	selectionHandler = (e) => {
		if (!this.statusBarItem) {
			console.error("handler called but statusBarItem not initialized");
			return;
		}

		if (!map) {
			this.statusBarItem.hide();
			return
		}

		if (!e.selections) {
			this.statusBarItem.hide();
			return;
		}

		if (e.selections.length === 0) {
			this.statusBarItem.hide();
			return;
		}

		if (!e.textEditor) {
			this.statusBarItem.hide();
			return;
		}

		const selection = e.selections[0];

		if (!selection || selection.isEmpty) {
			this.statusBarItem.hide();
			return;
		}

		const text = e.textEditor.document.getText(selection);

		const disp = getDisplayString(text);
		if (disp === null) {
			this.statusBarItem.hide();
			return;
		}
		
		this.statusBarItem.text = disp
		this.statusBarItem.show();
	}
}

class CodeLensDisplay {
	constructor() {
		this.getConfig(null);
		this.settingsListener = vscode.workspace.onDidChangeConfiguration(this.getConfig);
	}

	getConfig = (e) => {
		if (e == null || (e && e.affectsConfiguration("strinfo.showCodelens"))) {
			const enabled = vscode.workspace.getConfiguration("strinfo").showCodelens;
			if (enabled === true) {
				this.enable();
			} else {
				this.disable();
			}
		}
	}

	enable = () => {
		if (!this.codeLens) {
			this.codeLens = vscode.languages.registerCodeLensProvider("*", { provideCodeLenses: this.codeLensHandler });
		}
	}

	disable = () => {
		if (this.codeLens) { 
			this.codeLens.dispose();
			this.codeLens = null;
		}
	}

	dispose = () => {
		this.settingsListener.dispose();
		this.disable()
	}

	codeLensHandler = (document, token) => {
		if (!regexStr) {
			return [];
		}

		let codeLenses = [];
		const regex = new RegExp(regexStr, 'g');
		const text = document.getText();
		let matches;
		while ((matches = regex.exec(text)) !== null) {
			const disp = getDisplayString(matches[0]);
			if (disp === null) {
				continue;
			}

			const position = document.positionAt(matches.index);
			const range = document.getWordRangeAtPosition(position, new RegExp(regexStr, 'g'));
			if (range) {
				codeLenses.push(new vscode.CodeLens(range, {
					command: "workbench.action.findInFiles",
					arguments: [{ query: matches[0] }],
					title: disp,
					tooltip: "Search for this string",
				}));
			}
		}
		return codeLenses;
	}
}

class TooltipDisplay {
	constructor() {
		this.getConfig(null);
		this.settingsListener = vscode.workspace.onDidChangeConfiguration(this.getConfig);
	}

	getConfig = (e) => {
		if (e == null || (e && e.affectsConfiguration("strinfo.showTooltip"))) {
			const enabled = vscode.workspace.getConfiguration("strinfo").showTooltip;
			if (enabled === true) {
				this.enable();
			} else {
				this.disable();
			}
		}
	}

	enable = () => {
		if (!this.hover) {
			this.hover = vscode.languages.registerHoverProvider("*", { provideHover: this.hoverHandler });
		}
	}

	disable = () => {
		if (this.hover) { 
			this.hover.dispose();
			this.hover = null;
		}
	}

	dispose = () => {
		this.settingsListener.dispose();
		this.disable()
	}

	hoverHandler = (document, position, token) => {
		if (!regexStr) {
			return;
		}

		const range = document.getWordRangeAtPosition(position, new RegExp(regexStr, 'g'));
		if (!range) {
			return;
		}

		const text = document.getText(range);
		const disp = getDisplayString(text, true);
		if (disp === null) {
			return;
		}

		const contents = new vscode.MarkdownString(disp);
		contents.isTrusted = true;
		contents.supportHtml = true;

		return new vscode.Hover(contents);
	}
}