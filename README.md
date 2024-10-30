# strinfo

Allows annotating custom strings via tooltip, CodeLens and the status bar.

## Extension Settings

```json
"strinfo.mappings": {
    "somestring1": "Some String (Local)",
    "somestring2": {
        "plain": "Some String (DEV)",
        "markdown": "<h4>Some String</h4><span style='color:var(--vscode-charts-green);'>DEV</span>",
    },
    "somestring3": {
        "plain": "",
        "markdown": "<h4>Some Other String</h4><span style='color:var(--vscode-charts-red);'>PROD</span>",
    },
}
```

![Demo](https://raw.githubusercontent.com/sollniss/strinfo/main/demo.gif)

You can either set one string for all display methods or specify a plain string and a different `markdown` one.
The `markdown` is only used for tooltips. If `plain` is empty and `markdown` is set, CodeLens and status bar display are disabled.